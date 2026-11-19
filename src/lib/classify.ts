import { Chess } from 'chess.js';
import { isBrilliant, isRecapture, type PreviousMove } from './brilliant';
import { EP_THRESHOLDS, GREAT, MISS, OUTCOME_BANDS } from './constants';
import { bandRank, expectedPoints, lerpByRating, outcomeBand, winningThreshold } from './expectedPoints';
import type { Color, MoveAnalysis, MoveClass, Score } from './types';

/**
 * Chess.com-like move classification (Classification V2): expected points lost by the mover,
 * on a curve that depends on the mover's rating (lib/expectedPoints.ts), plus the rule-based
 * classes Book, Brilliant, Great and Miss. The same function classifies stored game moves,
 * freshly analysed games and playground variation moves.
 *
 * Precedence: Book first (opening theory, whatever the engine says). For moves that lost little:
 * Brilliant > Great > Best > Excellent > Good. For worse moves: Blunder > Miss > Mistake > Inaccuracy.
 */

export interface MoveFacts {
  color: Color;
  /** The mover's rating. */
  rating: number;
  uci: string;
  bestMove: string | null;
  /** White-POV scores before (best play) and after the played move. */
  evalBefore: Score;
  evalAfter: Score;
  fenBefore: string;
  fenAfter: string;
  /** Best alternative to the best move; null = none exists; undefined = unknown. */
  secondBest?: { score: Score } | null;
  /** The move keeps the game in opening theory (it and every earlier move are book). */
  book: boolean;
}

/** The opponent's move just before this one. */
export interface PreviousFacts extends PreviousMove {
  evalBefore: Score;
  evalAfter: Score;
}

/** Class by expected-points loss alone. */
export function classByLoss(loss: number, isBest: boolean): MoveClass {
  if (loss >= EP_THRESHOLDS.blunder) return 'blunder';
  if (loss >= EP_THRESHOLDS.mistake) return 'mistake';
  if (loss >= EP_THRESHOLDS.inaccuracy) return 'inaccuracy';
  if (isBest) return 'best';
  return loss >= EP_THRESHOLDS.good ? 'good' : 'excellent';
}

/** Great: the best move, and the only good one or the one that keeps a better outcome band. See `GREAT`. */
function isGreat(m: MoveFacts, epBest: number, previous: PreviousFacts | null): boolean {
  if (!m.secondBest) return false;
  const epSecond = expectedPoints(m.secondBest.score, m.color, m.rating);
  const gap = epBest - epSecond;
  if (gap <= 0) return false;
  if (isRecapture(m.fenBefore, m.uci, previous)) return false;
  const best = outcomeBand(epBest, m.rating);
  const second = outcomeBand(epSecond, m.rating);
  const { low, high } = OUTCOME_BANDS;
  const onlyGap = lerpByRating(m.rating, low.rating, high.rating, GREAT.onlyMoveGap.low, GREAT.onlyMoveGap.high);
  const onlyMove = gap >= onlyGap && best !== 'losing' && second !== 'winning';
  const changesOutcome = bandRank(best) > bandRank(second) && gap >= GREAT.bandGap;
  return onlyMove || changesOutcome;
}

/** Miss: the opponent's mistake handed the mover a winning position, and this move let it go. See `MISS`. */
function isMiss(m: MoveFacts, loss: number, previous: PreviousFacts | null): boolean {
  if (!previous || loss < MISS.minLoss) return false;
  const w = winningThreshold(m.rating);
  const beforeTheirMove = expectedPoints(previous.evalBefore, m.color, m.rating);
  const handed = expectedPoints(m.evalBefore, m.color, m.rating);
  const after = expectedPoints(m.evalAfter, m.color, m.rating);
  return beforeTheirMove < w && handed >= w && handed - beforeTheirMove >= MISS.minOpponentLoss && after < w;
}

function deliversCheckmate(fenAfter: string): boolean {
  try {
    return new Chess(fenAfter).isCheckmate();
  } catch {
    return false;
  }
}

export function classify(m: MoveFacts, previous: PreviousFacts | null): MoveClass {
  // Checkmate is always the best move, whatever the engine's bookkeeping says.
  if (deliversCheckmate(m.fenAfter)) return 'best';
  if (m.book) return 'book';
  const epBefore = expectedPoints(m.evalBefore, m.color, m.rating);
  const epAfter = expectedPoints(m.evalAfter, m.color, m.rating);
  const loss = Math.max(0, epBefore - epAfter);
  const isBest = !!m.bestMove && m.uci === m.bestMove;
  const byLoss = classByLoss(loss, isBest);

  if (byLoss === 'best' || byLoss === 'excellent' || byLoss === 'good') {
    const epWithout = isBest && m.secondBest ? expectedPoints(m.secondBest.score, m.color, m.rating) : epBefore;
    if (isBrilliant({ ...m, isBest, loss, epAfter, epWithout }, previous)) return 'brilliant';
    if (isBest && isGreat(m, epBefore, previous)) return 'great';
    return byLoss;
  }
  if (byLoss !== 'blunder' && isMiss(m, loss, previous)) return 'miss';
  return byLoss;
}

/** Facts for a stored move row. */
export function factsOf(m: MoveAnalysis, rating: number, book: boolean): MoveFacts {
  return { ...m, rating, book, secondBest: m.secondBest };
}

/**
 * Classes for one game's stored rows (in ply order), from stored data only. `ratings` are the
 * players' ratings for that game; `book[i]` says whether move i keeps the game in theory.
 */
export function classifyRows(moves: MoveAnalysis[], ratings: Record<Color, number>, book: boolean[]): MoveClass[] {
  return moves.map((m, i) => {
    const prev = i > 0 ? moves[i - 1] : undefined;
    return classify(factsOf(m, ratings[m.color], book[i] ?? false), prev && prev.color !== m.color ? prev : null);
  });
}
