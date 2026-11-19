import { Chess } from 'chess.js';
import type { EngineLine } from '../../engine/uci';
import { winPercent, winPercentFor } from '../../lib/evaluation';
import type { CandidateRejection, Color, MoveAnalysis, Score } from '../../lib/types';

/**
 * Quality thresholds for turning an owner error into a puzzle. Win% values are from the
 * owner's point of view (0..100, Lichess curve, see lib/evaluation.ts).
 */
export const PUZZLE_RULES = {
  /** Lines searched per position during verification. */
  multiPv: 3,
  /** Verification searches this much deeper than the game's analysis… */
  depthBonus: 4,
  /** …and never shallower / deeper than these. */
  minDepth: 14,
  maxDepth: 22,
  /** Best play must leave the owner at least this win%; below it the position was already lost. */
  minOwnerWin: 35,
  /** At or above this win% before the move the owner was already trivially winning… */
  trivialWin: 97,
  /** …unless the best line is a forced mate of at most this many moves. */
  maxMate: 5,
  /** A move within this many win% of the best is also accepted as correct. */
  acceptMargin: 5,
  /** The best move that is not accepted must trail the best by at least this many win%. */
  clearGap: 15,
  /** At most this many moves may be accepted at one step (otherwise the answer is not clear). */
  maxAccepted: 2,
  /** In mate puzzles, another mate this many moves slower or faster makes the step ambiguous. */
  mateWindow: 2,
  /** Longest solution, counted in owner moves. */
  maxOwnerMoves: 3,
  /** Candidates verified between two game analyses while games are still queued. */
  candidatesPerGame: 4,
} as const;

/** Forced mate for `color` in N moves, or null. */
export function mateFor(score: Score, color: Color): number | null {
  if (score.kind !== 'mate') return null;
  const mine = color === 'white' ? score.value > 0 : score.value < 0;
  return mine ? Math.abs(score.value) : null;
}

/** Cheap checks on the stored game analysis, before spending engine time. */
export function prefilter(move: MoveAnalysis, owner: Color): CandidateRejection | null {
  if (!move.bestMove || move.bestMove === move.uci) return 'noBestMove';
  const before = winPercentFor(owner, move.winBefore);
  if (before < PUZZLE_RULES.minOwnerWin) return 'hopeless';
  const mate = mateFor(move.evalBefore, owner);
  if (before >= PUZZLE_RULES.trivialWin && !(mate && mate <= PUZZLE_RULES.maxMate)) return 'alreadyWon';
  return null;
}

export interface StepVerdict {
  /** Accepted moves, main (engine best) first. */
  accepted: string[];
  best: EngineLine;
}

/**
 * Decides whether a position has a clear answer for `owner`, from a MultiPV search.
 * Returns the accepted moves, or why the position is not a good puzzle step.
 */
export function judgeLines(fen: string, lines: EngineLine[], owner: Color): StepVerdict | CandidateRejection {
  const best = lines[0];
  if (!best?.pv[0]) return 'invalid';
  if (lines.length < 2) return 'onlyMove';
  const mate = mateFor(best.score, owner);
  return mate ? judgeMate(fen, lines, owner, mate) : judgeByWin(lines, owner);
}

function judgeByWin(lines: EngineLine[], owner: Color): StepVerdict | CandidateRejection {
  const win = (l: EngineLine) => winPercentFor(owner, winPercent(l.score));
  const best = lines[0]!;
  const top = win(best);
  const accepted = lines.filter((l) => top - win(l) <= PUZZLE_RULES.acceptMargin);
  const firstRejected = lines.find((l) => top - win(l) > PUZZLE_RULES.acceptMargin);
  // Every searched line close to the best: there may be even more equal moves.
  if (!firstRejected || accepted.length > PUZZLE_RULES.maxAccepted) return 'ambiguous';
  if (top - win(firstRejected) < PUZZLE_RULES.clearGap) return 'ambiguous';
  return { accepted: accepted.map((l) => l.pv[0]!), best };
}

function judgeMate(fen: string, lines: EngineLine[], owner: Color, mate: number): StepVerdict | CandidateRejection {
  const best = lines[0]!;
  if (mate === 1) {
    // Every checkmating move is correct; anything else clearly is not.
    return { accepted: [best.pv[0]!, ...matingMoves(fen).filter((m) => m !== best.pv[0])], best };
  }
  const mates = lines.map((l) => mateFor(l.score, owner));
  const accepted = lines.filter((_, i) => mates[i] === mate);
  const close = lines.filter((_, i) => mates[i] !== null && mates[i] !== mate && mates[i]! <= mate + PUZZLE_RULES.mateWindow);
  if (close.length || accepted.length > PUZZLE_RULES.maxAccepted || accepted.length === lines.length) return 'ambiguous';
  return { accepted: accepted.map((l) => l.pv[0]!), best };
}

/** All legal moves (UCI) that give checkmate. */
function matingMoves(fen: string): string[] {
  const chess = new Chess(fen);
  return chess.moves({ verbose: true }).flatMap((m) => {
    chess.move(m);
    const mate = chess.isCheckmate();
    chess.undo();
    return mate ? [m.lan] : [];
  });
}
