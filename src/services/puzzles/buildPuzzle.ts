import { Chess } from 'chess.js';
import type { UciEngine } from '../../engine/uci';
import { winPercent, winPercentFor } from '../../lib/evaluation';
import { uciLineToSan } from '../../lib/pgn';
import type { CandidateRejection, GameRecord, MoveAnalysis, Puzzle, PuzzleSource, PuzzleStep } from '../../lib/types';
import { judgeLines, mateFor, PUZZLE_RULES, type StepVerdict } from './rules';
import { detectMotifs, gamePhase } from './tags';

export interface CandidateInput {
  move: MoveAnalysis;
  game: GameRecord;
  /** The analysed row for `ply - 1` (the opponent's move into the puzzle position), if any. */
  previous: MoveAnalysis | undefined;
  /** The analysed row for `ply + 1` (the engine's reply to the played move), if the game went on. */
  next: MoveAnalysis | undefined;
  /** Depth the game was analysed at. */
  analysisDepth: number;
}

export type BuildResult = { puzzle: Puzzle } | { rejected: CandidateRejection } | { cancelled: true };

const isVerdict = (v: StepVerdict | CandidateRejection): v is StepVerdict => typeof v !== 'string';

const verifyDepth = (analysisDepth: number) =>
  Math.min(PUZZLE_RULES.maxDepth, Math.max(PUZZLE_RULES.minDepth, analysisDepth + PUZZLE_RULES.depthBonus));

/**
 * Re-searches the position before the owner's error with MultiPV, deeper than the game
 * analysis, and turns it into a puzzle if it has a clear answer the owner missed.
 * The solution is extended while the engine line stays forcing: after each verified owner
 * move and the opponent's best reply, the next owner move must pass the same check.
 */
export async function buildPuzzle(engine: UciEngine, input: CandidateInput, isCancelled: () => boolean): Promise<BuildResult> {
  const { move, game, previous, next } = input;
  const owner = game.ownerColor;
  const depth = verifyDepth(input.analysisDepth);

  const first = judgeLines(move.fenBefore, await engine.evaluateLines(move.fenBefore, depth, PUZZLE_RULES.multiPv), owner);
  if (isCancelled()) return { cancelled: true };
  if (!isVerdict(first)) return { rejected: first };
  if (first.accepted.includes(move.uci)) return { rejected: 'playedIsFine' };

  const winBest = winPercentFor(owner, winPercent(first.best.score));
  const mateIn = mateFor(first.best.score, owner);
  if (winBest < PUZZLE_RULES.minOwnerWin) return { rejected: 'hopeless' };
  if (winBest >= PUZZLE_RULES.trivialWin && !(mateIn && mateIn <= PUZZLE_RULES.maxMate)) return { rejected: 'alreadyWon' };

  const shortMate = mateIn && mateIn <= PUZZLE_RULES.maxMate ? mateIn : null;
  // A short forced mate may run to its end; other lines stop at `maxOwnerMoves`.
  const maxSteps = Math.max(PUZZLE_RULES.maxOwnerMoves, shortMate ?? 0);
  const steps: PuzzleStep[] = [{ accepted: first.accepted, reply: null }];
  const chess = new Chess(move.fenBefore);
  let line = first.best.pv;
  while (steps.length < maxSteps) {
    const [main, reply] = line;
    if (!main || !reply || !tryMove(chess, main)) break;
    if (chess.isGameOver() || !tryMove(chess, reply)) break;
    if (chess.isGameOver()) break;
    const fen = chess.fen();
    const verdict = judgeLines(fen, await engine.evaluateLines(fen, depth, PUZZLE_RULES.multiPv), owner);
    if (isCancelled()) return { cancelled: true };
    if (!isVerdict(verdict)) break;
    steps[steps.length - 1]!.reply = reply;
    steps.push({ accepted: verdict.accepted, reply: null });
    line = verdict.best.pv;
  }

  const opponent = game[owner === 'white' ? 'black' : 'white'];
  return {
    puzzle: {
      id: `${game.uuid}:${move.ply}`,
      gameId: game.uuid,
      ply: move.ply,
      moveNumber: move.moveNumber,
      fen: move.fenBefore,
      lastMove: previous?.uci ?? null,
      ownerColor: owner,
      source: move.classification as PuzzleSource,
      phase: gamePhase(move.fenBefore),
      timeClass: game.timeClass,
      motifs: detectMotifs({ fen: move.fenBefore, owner, line: first.best.pv, playedUci: move.uci, mateIn: shortMate }),
      mateIn: shortMate,
      steps,
      played: { uci: move.uci, san: move.san },
      refutation: next?.pv.length ? uciLineToSan(next.fenBefore, next.pv, 5) : [],
      evalBest: first.best.score,
      evalPlayed: move.evalAfter,
      winBest,
      winPlayed: winPercentFor(owner, move.winAfter),
      opponent: { username: opponent.username, rating: opponent.rating },
      gameEndTime: game.endTime,
      verifyDepth: depth,
      createdAt: Date.now(),
      box: 0,
      dueAt: 0,
      attempts: 0,
      lastResult: null,
      lastAttemptAt: null,
    },
  };
}

function tryMove(chess: Chess, uci: string): boolean {
  try {
    chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    return true;
  } catch {
    return false;
  }
}
