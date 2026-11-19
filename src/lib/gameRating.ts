import { EXPECTED_POINTS, GAME_RATING } from './constants';
import { effectiveRating, expectedPoints } from './expectedPoints';
import type { Color, MoveAnalysis, MoveClass } from './types';

/** Expected mean expected-points loss per move for a player of this rating (see `GAME_RATING`). */
export function expectedLossForRating(rating: number): number {
  const { anchorLoss, anchorRating, scale } = GAME_RATING;
  return anchorLoss * Math.exp(-(rating - anchorRating) / scale);
}

/** Inverse of `expectedLossForRating`: the rating whose expected loss equals `loss`. */
export function ratingForLoss(loss: number): number {
  const { anchorLoss, anchorRating, scale, minLoss } = GAME_RATING;
  return anchorRating + scale * Math.log(anchorLoss / Math.max(minLoss, loss));
}

/**
 * Game rating for `color`: the rating whose expected move quality matches the quality shown in
 * this game (Chess.com's Game Rating idea; their formula is not public). Move quality is measured
 * on the rating-neutral 1500 curve so players are compared on one scale; book moves and moves
 * played while the position stayed decided carry no information and are left out. Short games
 * are blended towards the player's actual rating. Null when the player made fewer than
 * `GAME_RATING.minMoves` moves.
 */
export function gameRating(moves: MoveAnalysis[], classes: MoveClass[], color: Color, actualRating: number): number | null {
  const mine = moves.map((m, i) => ({ m, cls: classes[i] })).filter(({ m }) => m.color === color);
  if (mine.length < GAME_RATING.minMoves) return null;
  const ref = EXPECTED_POINTS.anchorRating;
  const { low, high } = GAME_RATING.decided;
  const decided = (ep: number) => (ep <= low ? -1 : ep >= high ? 1 : 0);
  let sum = 0;
  let n = 0;
  for (const { m, cls } of mine) {
    if (cls === 'book') continue;
    const before = expectedPoints(m.evalBefore, color, ref);
    const after = expectedPoints(m.evalAfter, color, ref);
    const zone = decided(before);
    if (zone !== 0 && decided(after) === zone) continue;
    sum += Math.max(0, before - after);
    n++;
  }
  const actual = effectiveRating(actualRating);
  const raw = n > 0 ? ratingForLoss(sum / n) : actual;
  const w = n / (n + GAME_RATING.shrinkMoves);
  const blended = w * raw + (1 - w) * actual;
  const clamped = Math.min(GAME_RATING.max, Math.max(GAME_RATING.min, blended));
  return Math.round(clamped / GAME_RATING.round) * GAME_RATING.round;
}
