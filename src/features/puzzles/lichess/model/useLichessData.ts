import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../../lib/db';
import type { LichessAttempt, LichessRating } from '../../../../lib/types';
import { useNow } from '../../model/usePuzzleData';
import { currentRating, RATING } from './rating';
import { dayKey } from './daily';

/** The owner's Lichess-puzzle rating (seeded from Chess.com until the first attempt). Undefined while loading. */
export function useLichessRating(): LichessRating | undefined {
  return useLiveQuery(() => currentRating(), []);
}

export const isProvisional = (r: Pick<LichessRating, 'games'>) => r.games < RATING.provisionalGames;

export interface LichessStats {
  attempts: number;
  /** Clean solves as a share of attempts, 0..100, null before any attempt. */
  solveRate: number | null;
  solvedToday: number;
  /** Highest rating reached after any attempt. */
  peak: number | null;
  /** Rating after each attempt, oldest first (last 30). */
  history: number[];
}

export function lichessStats(attempts: LichessAttempt[], now = Date.now()): LichessStats {
  const sorted = [...attempts].sort((a, b) => a.at - b.at);
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const clean = sorted.filter((a) => a.result === 'solved').length;
  return {
    attempts: sorted.length,
    solveRate: sorted.length ? (clean / sorted.length) * 100 : null,
    solvedToday: sorted.filter((a) => a.at >= startOfToday && a.result !== 'failed').length,
    peak: sorted.length ? Math.max(...sorted.map((a) => a.ratingAfter)) : null,
    history: sorted.slice(-30).map((a) => a.ratingAfter),
  };
}

export function useLichessStats(): LichessStats | undefined {
  const attempts = useLiveQuery(() => db.lichessAttempts.toArray(), []);
  const now = useNow(attempts);
  return attempts && lichessStats(attempts, now);
}

export interface LichessSummary {
  rating: number;
  provisional: boolean;
  solvedToday: number;
  /** Whether today's daily puzzle (if fetched) has been played. */
  dailyDone: boolean;
}

/** Live Lichess numbers for other screens (e.g. Home). Undefined while loading. */
export function useLichessSummary(): LichessSummary | undefined {
  const startOfToday = new Date(useNow()).setHours(0, 0, 0, 0);
  return useLiveQuery(async () => {
    const [r, today, daily] = await Promise.all([currentRating(), db.lichessAttempts.where('at').aboveOrEqual(startOfToday).toArray(), db.lichessDaily.get(dayKey(startOfToday))]);
    return {
      rating: Math.round(r.rating),
      provisional: isProvisional(r),
      solvedToday: today.filter((a) => a.result !== 'failed').length,
      dailyDone: !!daily && (await db.lichessAttempts.where('puzzleId').equals(daily.puzzle.id).count()) > 0,
    };
  }, [startOfToday]);
}
