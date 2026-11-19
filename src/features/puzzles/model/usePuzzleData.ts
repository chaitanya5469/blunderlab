import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../lib/db';
import type { Puzzle, PuzzleAttempt } from '../../../lib/types';
import { isDue, isMastered, isNew } from './schedule';

/**
 * Current time, refreshed every minute (so "due" counts move on while a screen stays open)
 * and whenever `data` changes (so fresh rows are judged against a fresh clock).
 */
export function useNow(data?: unknown, intervalMs = 60_000): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [data, intervalMs]);
  return now;
}

/** Every puzzle, newest game first and in move order within a game (undefined while loading). */
export function usePuzzles(): Puzzle[] | undefined {
  return useLiveQuery(async () => (await db.puzzles.toArray()).sort((a, b) => b.gameEndTime - a.gameEndTime || a.ply - b.ply), []);
}

export interface PuzzleCounts {
  due: number;
  fresh: number;
  mastered: number;
  total: number;
  /** Earliest future due time among attempted puzzles, if any. */
  nextDueAt: number | null;
}

export function countPuzzles(puzzles: Puzzle[], now: number): PuzzleCounts {
  let due = 0;
  let fresh = 0;
  let mastered = 0;
  let nextDueAt: number | null = null;
  for (const p of puzzles) {
    if (isNew(p)) fresh++;
    else if (isDue(p, now)) due++;
    else nextDueAt = nextDueAt === null ? p.dueAt : Math.min(nextDueAt, p.dueAt);
    if (isMastered(p)) mastered++;
  }
  return { due, fresh, mastered, total: puzzles.length, nextDueAt };
}

export interface AttemptStats {
  attempts: number;
  /** Share of attempts solved cleanly, 0..100 (null before any attempt). */
  solveRate: number | null;
  /** Clean solves in a row, up to the latest attempt. */
  streak: number;
  bestStreak: number;
  /** Distinct puzzles solved (cleanly or with help) since midnight. */
  solvedToday: number;
}

export function attemptStats(attempts: PuzzleAttempt[], now = Date.now()): AttemptStats {
  const sorted = [...attempts].sort((a, b) => a.at - b.at);
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  let run = 0;
  let bestStreak = 0;
  let clean = 0;
  const today = new Set<string>();
  for (const a of sorted) {
    if (a.result === 'solved') {
      clean++;
      run++;
      bestStreak = Math.max(bestStreak, run);
    } else {
      run = 0;
    }
    if (a.result !== 'failed' && a.at >= startOfToday) today.add(a.puzzleId);
  }
  return {
    attempts: sorted.length,
    solveRate: sorted.length ? (clean / sorted.length) * 100 : null,
    streak: run,
    bestStreak,
    solvedToday: today.size,
  };
}

export function useAttemptStats(): AttemptStats | undefined {
  const attempts = useLiveQuery(() => db.puzzleAttempts.toArray(), []);
  return attempts && attemptStats(attempts);
}

export interface PuzzleSummary {
  due: number;
  fresh: number;
  total: number;
  solvedToday: number;
}

/** Live puzzle numbers for other screens (e.g. Home). Undefined while loading. */
export function usePuzzleSummary(): PuzzleSummary | undefined {
  // A minute tick keeps the day boundary current; `now` also refreshes with the data.
  const startOfToday = new Date(useNow()).setHours(0, 0, 0, 0);
  const data = useLiveQuery(async () => {
    const [puzzles, attempts] = await Promise.all([db.puzzles.toArray(), db.puzzleAttempts.where('at').aboveOrEqual(startOfToday).toArray()]);
    return { puzzles, attempts };
  }, [startOfToday]);
  const now = useNow(data);
  if (!data) return undefined;
  const c = countPuzzles(data.puzzles, now);
  return { due: c.due, fresh: c.fresh, total: c.total, solvedToday: attemptStats(data.attempts, now).solvedToday };
}
