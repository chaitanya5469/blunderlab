import { Chess } from 'chess.js';
import type { OpeningBook } from '../../lib/book';
import { classify, type PreviousFacts } from '../../lib/classify';
import { expectedPoints } from '../../lib/expectedPoints';
import { gameRatings } from '../../lib/gameClassification';
import type { Color, GameRecord, MoveAnalysis, MoveClass, Score } from '../../lib/types';
import type { LiveResult } from '../../services/analysisService';

/** One move of a playground variation (never stored). */
export interface VarMove {
  uci: string;
  san: string;
  from: string;
  to: string;
  color: Color;
  moveNumber: number;
  fenBefore: string;
  fenAfter: string;
}

/** A side line branching from the game after `base` plies (0 = the starting position). */
export interface Variation {
  base: number;
  moves: VarMove[];
}

/** Plays `uci` in `fen`, or null if it is not legal there. */
export function makeMove(fen: string, uci: string): VarMove | null {
  try {
    const chess = new Chess(fen);
    const m = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    return {
      uci: m.lan,
      san: m.san,
      from: m.from,
      to: m.to,
      color: m.color === 'w' ? 'white' : 'black',
      moveNumber: Number(fen.split(' ')[5]) || 1,
      fenBefore: fen,
      fenAfter: m.after,
    };
  } catch {
    return null;
  }
}

/** "12.Nf3" / "12…Qb6". */
export const moveLabel = (moveNumber: number, color: Color, san: string) => `${moveNumber}${color === 'white' ? '.' : '…'}${san}`;

export type TerminalKind = 'checkmate' | 'stalemate' | 'draw';

/** How the game stands if `fen` is over (no engine search possible or needed), else null. */
export function terminalState(fen: string): { kind: TerminalKind; score: Score } | null {
  try {
    const chess = new Chess(fen);
    if (chess.isCheckmate()) return { kind: 'checkmate', score: { kind: 'checkmate', winner: chess.turn() === 'w' ? 'black' : 'white' } };
    if (chess.isStalemate()) return { kind: 'stalemate', score: { kind: 'cp', value: 0 } };
    if (chess.isInsufficientMaterial()) return { kind: 'draw', score: { kind: 'cp', value: 0 } };
    return null;
  } catch {
    return null;
  }
}

/** An engine line as SAN with move numbers, ready to show. */
export interface SanLine {
  /** First move (UCI), played when the line is tapped. */
  uci: string;
  first: string;
  rest: string;
}

export function sanLine(fen: string, pv: string[], max = 8): SanLine | null {
  const chess = new Chess(fen);
  const parts: string[] = [];
  for (const uci of pv.slice(0, max)) {
    const white = chess.turn() === 'w';
    const n = chess.moveNumber();
    let san: string;
    try {
      san = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san;
    } catch {
      break;
    }
    parts.push(white ? `${n}.${san}` : parts.length === 0 ? `${n}…${san}` : san);
  }
  if (!parts.length) return null;
  return { uci: pv[0]!, first: parts[0]!, rest: parts.slice(1).join(' ') };
}

/** What is known about a position: its score, the engine's best move there and, when known, the second-best score. */
export interface PositionEval {
  score: Score;
  best: string | null;
  /** Score of the best alternative to `best`; null = no other move; undefined = unknown. */
  second?: Score | null;
}

const fromLive = (r: LiveResult | undefined): PositionEval | null =>
  r?.lines[0] ? { score: r.lines[0].score, best: r.lines[0].pv[0] ?? null, second: r.lines[1]?.score ?? (r.complete && r.lines.length === 1 ? null : undefined) } : null;

/** The stored game analysis for the position after `ply` plies, if the game was analysed. */
export function gameEval(analysed: MoveAnalysis[], ply: number): PositionEval | null {
  const next = analysed[ply];
  if (next) return { score: next.evalBefore, best: next.bestMove, second: next.secondBest === undefined ? undefined : (next.secondBest?.score ?? null) };
  const prev = ply > 0 ? analysed[ply - 1] : undefined;
  return prev ? { score: prev.evalAfter, best: null } : null;
}

/** Best known evaluation of a position: live analysis first, then terminal state, then the stored game analysis. */
export function positionEval(fen: string, live: LiveResult | undefined, fallback: PositionEval | null): PositionEval | null {
  const terminal = terminalState(fen);
  if (terminal) return { score: terminal.score, best: null, second: null };
  return fromLive(live) ?? fallback;
}

export interface MoveVerdict {
  cls: MoveClass;
  before: Score;
  after: Score;
}

/** What the playground knows about the game around a variation, for classifying its moves like game moves. */
export interface JudgeContext {
  /** The players' ratings in this game (the mover's rating shapes the expected-points curve). */
  ratings: Record<Color, number>;
  /** The opening book, once loaded (no Book class before that). */
  book: OpeningBook | null;
  /** Every game move up to the branch point was Book. */
  baseInBook: boolean;
}

/** The game's ratings and whether the game was still in the book at `base` plies. */
export function judgeContext(game: Pick<GameRecord, 'white' | 'black'>, analysed: MoveAnalysis[], base: number, book: OpeningBook | null): JudgeContext {
  const baseInBook = base === 0 || (analysed.length >= base && analysed.slice(0, base).every((m) => m.classification === 'book'));
  return { ratings: gameRatings(game), book, baseInBook };
}

/** Classifies a move with the same rules as game moves (lib/classify.ts). */
export function judgeMove(
  move: VarMove,
  before: PositionEval | null,
  after: PositionEval | null,
  ctx: JudgeContext,
  extra: { book: boolean; previous: PreviousFacts | null },
): MoveVerdict | null {
  if (!before || !after) return null;
  const cls = classify(
    {
      color: move.color,
      rating: ctx.ratings[move.color],
      uci: move.uci,
      bestMove: before.best,
      evalBefore: before.score,
      evalAfter: after.score,
      fenBefore: move.fenBefore,
      fenAfter: move.fenAfter,
      secondBest: before.second === undefined ? undefined : before.second && { score: before.second },
      book: extra.book,
    },
    extra.previous,
  );
  return { cls, before: before.score, after: after.score };
}

/** Live results shallower than this are too noisy to put a quality badge on a move (unless the search finished). */
export const MIN_BADGE_DEPTH = 14;

const settled = (r: LiveResult | undefined) => (r && (r.complete || r.depth >= MIN_BADGE_DEPTH) ? r : undefined);

/** Whether variation move `index` (and every move before it) stays in the book. */
function inBook(variation: Variation, index: number, ctx: JudgeContext): boolean {
  if (!ctx.book || !ctx.baseInBook) return false;
  return variation.moves.slice(0, index + 1).every((m) => ctx.book!.has(m.fenAfter));
}

/** Evaluations around variation move `index`: before and after it (null when not known well enough). */
function evalsAround(
  variation: Variation,
  index: number,
  analysed: MoveAnalysis[],
  liveResult: (fen: string) => LiveResult | undefined,
  settledOnly: boolean,
): { before: PositionEval | null; after: PositionEval | null } {
  const move = variation.moves[index]!;
  const pick = (r: LiveResult | undefined) => (settledOnly ? settled(r) : r);
  const fallback = index === 0 ? gameEval(analysed, variation.base) : null;
  const beforeLive = pick(liveResult(move.fenBefore));
  // Stored game analysis is deep enough on its own; a shallow live result of the same position is not.
  const before = !terminalState(move.fenBefore) && !beforeLive && !fallback ? null : positionEval(move.fenBefore, beforeLive, fallback);
  const afterLive = pick(liveResult(move.fenAfter));
  const after = !terminalState(move.fenAfter) && !afterLive ? null : positionEval(move.fenAfter, afterLive, null);
  return { before, after };
}

/** The move before variation move `index` (a game move at the branch point), with its evaluations, for Miss. */
function previousFacts(
  variation: Variation,
  index: number,
  analysed: MoveAnalysis[],
  liveResult: (fen: string) => LiveResult | undefined,
  settledOnly: boolean,
): PreviousFacts | null {
  if (index === 0) return variation.base > 0 ? (analysed[variation.base - 1] ?? null) : null;
  const prev = variation.moves[index - 1]!;
  const { before, after } = evalsAround(variation, index - 1, analysed, liveResult, settledOnly);
  return before && after ? { uci: prev.uci, fenBefore: prev.fenBefore, evalBefore: before.score, evalAfter: after.score } : null;
}

/**
 * Verdict for variation move `index`. With `settledOnly`, only once both positions are evaluated
 * deeply enough (else null), as for the board badge; otherwise from whatever is known so far.
 */
export function variationVerdict(
  variation: Variation,
  index: number,
  analysed: MoveAnalysis[],
  liveResult: (fen: string) => LiveResult | undefined,
  ctx: JudgeContext,
  settledOnly: boolean,
): MoveVerdict | null {
  const move = variation.moves[index];
  if (!move) return null;
  const { before, after } = evalsAround(variation, index, analysed, liveResult, settledOnly);
  return judgeMove(move, before, after, ctx, {
    book: inBook(variation, index, ctx),
    previous: previousFacts(variation, index, analysed, liveResult, settledOnly),
  });
}

/** Mover-POV expected-points difference between two results (positive: `a` is better for `color`). */
export function pointsEdge(color: Color, rating: number, a: Score, b: Score): number {
  return expectedPoints(a, color, rating) - expectedPoints(b, color, rating);
}
