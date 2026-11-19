import { recordActivity } from '../../../lib/activity';
import { db } from '../../../lib/db';
import type { Puzzle, PuzzleResult } from '../../../lib/types';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Leitner scheduling. A clean solve moves the puzzle up one box and it returns after that
 * box's interval; an assisted solve (hint or wrong try) drops it to box 0 and brings it back
 * within the day; a failure (solution shown) drops it to box 0 and brings it back in minutes.
 */
export const SCHEDULE = {
  failedDelay: 10 * MINUTE,
  assistedDelay: 8 * HOUR,
  /** Interval for boxes 1..5 after a clean solve. */
  boxIntervals: [1 * DAY, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY],
  /** Puzzles in this box or higher count as mastered. */
  masteredBox: 4,
} as const;

const MAX_BOX = SCHEDULE.boxIntervals.length;

export function nextSchedule(box: number, result: PuzzleResult, now: number): { box: number; dueAt: number } {
  if (result === 'failed') return { box: 0, dueAt: now + SCHEDULE.failedDelay };
  if (result === 'assisted') return { box: 0, dueAt: now + SCHEDULE.assistedDelay };
  const next = Math.min(MAX_BOX, box + 1);
  return { box: next, dueAt: now + SCHEDULE.boxIntervals[next - 1]! };
}

export const isNew = (p: Puzzle) => p.attempts === 0;
export const isDue = (p: Puzzle, now: number) => p.attempts > 0 && p.dueAt <= now;
export const isMastered = (p: Puzzle) => p.box >= SCHEDULE.masteredBox;

export interface AttemptInput {
  result: PuzzleResult;
  wrongMoves: number;
  hints: number;
}

/** Stores a finished attempt and reschedules the puzzle. */
export async function recordAttempt(puzzleId: string, { result, wrongMoves, hints }: AttemptInput) {
  const now = Date.now();
  await db.transaction('rw', db.puzzles, db.puzzleAttempts, db.activity, async () => {
    const p = await db.puzzles.get(puzzleId);
    if (!p) return;
    await db.puzzleAttempts.add({ puzzleId, at: now, result, wrongMoves, hints });
    await recordActivity('puzzle-own', result, puzzleId, now);
    await db.puzzles.update(puzzleId, {
      ...nextSchedule(p.box, result, now),
      attempts: p.attempts + 1,
      lastResult: result,
      lastAttemptAt: now,
    });
  });
}

const newestFirst = (a: Puzzle, b: Puzzle) => b.gameEndTime - a.gameEndTime || a.ply - b.ply;

/**
 * Unsolved (never attempted) first, newest game first; then reviews due, earliest due first;
 * then everything else (not yet due), newest game first.
 */
export function listOrder(puzzles: Puzzle[], now: number): Puzzle[] {
  const fresh = puzzles.filter(isNew).sort(newestFirst);
  const due = puzzles.filter((p) => isDue(p, now)).sort((a, b) => a.dueAt - b.dueAt || newestFirst(a, b));
  const rest = puzzles.filter((p) => !isNew(p) && !isDue(p, now)).sort(newestFirst);
  return [...fresh, ...due, ...rest];
}

/** What training offers: the unsolved and due parts of `listOrder` (not-yet-due puzzles are skipped). */
export function trainingOrder(puzzles: Puzzle[], now: number): Puzzle[] {
  return listOrder(puzzles, now).filter((p) => isNew(p) || isDue(p, now));
}
