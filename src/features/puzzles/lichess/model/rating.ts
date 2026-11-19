import { recordActivity } from '../../../../lib/activity';
import { db } from '../../../../lib/db';
import type { LichessOrigin, LichessPuzzle, LichessRating, Profile, PuzzleResult } from '../../../../lib/types';

/**
 * The owner's Lichess-puzzle rating: Glicko-1, each puzzle a game against the puzzle's rating.
 * As on Lichess, only a clean solve counts as a win; a wrong move, a hint or the solution is a loss.
 */
export const RATING = {
  /** Starting deviation: wide enough that the first dozen puzzles move the rating quickly (about ±80 at first). */
  startRd: 200,
  /** Floor, so the rating keeps responding after hundreds of puzzles. */
  minRd: 60,
  /** Puzzles in the pack all have a Lichess deviation of 80 or less. */
  puzzleRd: 80,
  /** Fewer games than this: shown as provisional. */
  provisionalGames: 10,
  /** Chess.com -> Lichess puzzle offset (see seedRating). */
  offset: 200,
  fallback: 1500,
  min: 400,
  max: 3000,
} as const;

const Q = Math.LN10 / 400;
const g = (rd: number) => 1 / Math.sqrt(1 + (3 * Q * Q * rd * rd) / (Math.PI * Math.PI));

/** One Glicko-1 rating period with a single game. `score` 1 = win, 0 = loss. */
export function glicko(rating: number, rd: number, opponent: number, opponentRd: number, score: 0 | 1) {
  const gj = g(opponentRd);
  const e = 1 / (1 + 10 ** ((-gj * (rating - opponent)) / 400));
  const d2 = 1 / (Q * Q * gj * gj * e * (1 - e));
  const denom = 1 / (rd * rd) + 1 / d2;
  const next = rating + (Q / denom) * gj * (score - e);
  return {
    rating: Math.min(RATING.max, Math.max(RATING.min, next)),
    rd: Math.max(RATING.minRd, Math.sqrt(1 / denom)),
  };
}

/**
 * Starting rating from Chess.com: rapid first (closest to how the owner thinks at a puzzle),
 * then blitz, daily, bullet. Lichess puzzle ratings run well above Chess.com game ratings, so
 * the start is the Chess.com rating + 200, clamped to 600..2600. With a 250 deviation the
 * rating settles to the owner's real level within ~15 puzzles either way.
 */
export function seedRating(profile: Pick<Profile, 'ratings'> | undefined): LichessRating['seed'] {
  const r = profile?.ratings ?? {};
  for (const kind of ['rapid', 'blitz', 'daily', 'bullet'] as const) {
    const v = r[kind];
    if (typeof v === 'number' && v > 0) return { kind, chesscom: v, start: Math.round(Math.min(2600, Math.max(600, v + RATING.offset))) };
  }
  return { kind: 'default', chesscom: null, start: RATING.fallback };
}

/** The stored rating, or a fresh one seeded from the profile (not stored until the first attempt). */
export async function currentRating(): Promise<LichessRating> {
  const stored = await db.lichessRating.get('owner');
  if (stored) return stored;
  const seed = seedRating(await db.profile.get('owner'));
  return { id: 'owner', rating: seed.start, rd: RATING.startRd, games: 0, seed, updatedAt: Date.now() };
}

export interface LichessAttemptInput {
  result: PuzzleResult;
  wrongMoves: number;
  hints: number;
}

/** Stores an attempt, updates the rating and logs the activity, in one transaction. Returns the rating before and after. */
export async function recordLichessAttempt(puzzle: LichessPuzzle, origin: LichessOrigin, a: LichessAttemptInput): Promise<{ before: number; after: number }> {
  const now = Date.now();
  return db.transaction('rw', [db.lichessRating, db.lichessAttempts, db.activity, db.profile], async () => {
    const cur = await currentRating();
    const next = glicko(cur.rating, cur.rd, puzzle.rating, RATING.puzzleRd, a.result === 'solved' ? 1 : 0);
    const before = Math.round(cur.rating);
    const after = Math.round(next.rating);
    await db.lichessRating.put({ ...cur, rating: next.rating, rd: next.rd, games: cur.games + 1, updatedAt: now });
    await db.lichessAttempts.add({ puzzleId: puzzle.id, origin, at: now, ...a, puzzleRating: puzzle.rating, ratingBefore: before, ratingAfter: after });
    await recordActivity('puzzle-lichess', a.result, puzzle.id, now);
    return { before, after };
  });
}

/** "Rating 1652 (+12)" */
export function ratingChange({ before, after }: { before: number; after: number }): string {
  const d = after - before;
  return `Rating ${after} (${d >= 0 ? '+' : '−'}${Math.abs(d)})`;
}
