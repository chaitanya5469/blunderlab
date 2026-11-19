import { EXPECTED_POINTS, OUTCOME_BANDS } from './constants';
import type { Color, Score } from './types';

/** A usable rating: unknown or nonsense values fall back to the default, then clamp. */
export function effectiveRating(rating: number | null | undefined): number {
  const r = typeof rating === 'number' && Number.isFinite(rating) && rating > 0 ? rating : EXPECTED_POINTS.defaultRating;
  return Math.min(EXPECTED_POINTS.maxRating, Math.max(EXPECTED_POINTS.minRating, r));
}

/** Slope of the expected-points logistic for a player of this rating (see `EXPECTED_POINTS`). */
export function slopeFor(rating: number): number {
  const { anchorK, anchorRating, ratingScale } = EXPECTED_POINTS;
  return anchorK * Math.exp((effectiveRating(rating) - anchorRating) / ratingScale);
}

/**
 * Expected points (0..1) for `color` in a position with White-POV `score`, for a player rated
 * `rating`. Forced mates and checkmate are 1 or 0.
 */
export function expectedPoints(score: Score, color: Color, rating: number): number {
  let white: number;
  if (score.kind === 'checkmate') white = score.winner === 'white' ? 1 : 0;
  else if (score.kind === 'mate') white = score.value > 0 ? 1 : 0;
  else white = 1 / (1 + Math.exp(-slopeFor(rating) * score.value));
  return color === 'white' ? white : 1 - white;
}

/** Expected points the mover lost going from `before` (best play) to `after` (never negative). */
export function expectedLoss(before: Score, after: Score, color: Color, rating: number): number {
  return Math.max(0, expectedPoints(before, color, rating) - expectedPoints(after, color, rating));
}

export type OutcomeBand = 'losing' | 'equal' | 'winning';

/** Expected points at or above which the position counts as winning, for this rating. */
export function winningThreshold(rating: number): number {
  const { low, high } = OUTCOME_BANDS;
  return lerpByRating(rating, low.rating, high.rating, low.winning, high.winning);
}

export function outcomeBand(ep: number, rating: number): OutcomeBand {
  const w = winningThreshold(rating);
  if (ep >= w) return 'winning';
  if (ep <= 1 - w) return 'losing';
  return 'equal';
}

export const bandRank = (b: OutcomeBand) => (b === 'losing' ? 0 : b === 'equal' ? 1 : 2);

/** Linear interpolation by rating between (r0, v0) and (r1, v1), clamped outside. */
export function lerpByRating(rating: number, r0: number, r1: number, v0: number, v1: number): number {
  const t = Math.min(1, Math.max(0, (effectiveRating(rating) - r0) / (r1 - r0)));
  return v0 + (v1 - v0) * t;
}
