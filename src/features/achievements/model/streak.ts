/**
 * Daily streak, in local calendar days.
 *
 * A day counts when the owner solves a puzzle (either source, clean or with help) or finishes a
 * lesson line. The gentle rule: one rest day per week. A single missed day keeps the streak alive
 * (it adds nothing) if no rest day was used in the 6 days before it; a second missed day in a row,
 * or a miss while the rest day is still recharging, resets it. Today never breaks a streak: until
 * midnight it is just "not done yet".
 */

const DAY = 24 * 60 * 60 * 1000;
/** Days between two rest days (a rest day on Monday makes the next one possible on the following Monday). */
export const REST_EVERY = 7;

/** Local calendar day as a whole number (DST safe). */
export function dayIndex(ms: number): number {
  const d = new Date(ms);
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);
}

/** Local midnight at the start of a day index. */
export function dayStart(index: number): number {
  const d = new Date(index * DAY);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).getTime();
}

export type DayState = 'done' | 'rest' | 'missed' | 'today';

export interface StreakInfo {
  current: number;
  best: number;
  todayDone: boolean;
  /** A rest day can still cover a missed day right now. */
  restAvailable: boolean;
  /** Day index when the rest day becomes available again (when it is not). */
  restBackOn: number | null;
  /** The last 7 days, oldest first, ending today. */
  week: { index: number; state: DayState }[];
  /** reachedAt[n] = local midnight of the first day the streak reached n days. */
  reachedAt: number[];
  activeDays: number;
}

export function computeStreak(active: Set<number>, today: number): StreakInfo {
  const states = new Map<number, DayState>();
  const reachedAt: number[] = [];
  let current = 0;
  let best = 0;
  let lastRest = -Infinity;
  const first = active.size ? Math.min(...active) : today;

  for (let d = first; d <= today; d++) {
    if (active.has(d)) {
      current++;
      states.set(d, 'done');
      if (current > best) best = current;
      if (reachedAt[current] === undefined) reachedAt[current] = dayStart(d);
    } else if (d === today) {
      states.set(d, 'today');
    } else if (current > 0 && active.has(d - 1) && d - lastRest >= REST_EVERY) {
      lastRest = d;
      states.set(d, 'rest');
    } else {
      current = 0;
      states.set(d, 'missed');
    }
  }

  const todayDone = active.has(today);
  // Covering a miss needs the previous day active, so a rest day is "available" for tomorrow
  // only if today gets done; we report whether the weekly allowance itself has recharged.
  const restAvailable = today - lastRest >= REST_EVERY;
  const week = Array.from({ length: 7 }, (_, i) => {
    const index = today - 6 + i;
    return { index, state: states.get(index) ?? (index === today ? 'today' : 'missed') };
  });
  return {
    current,
    best,
    todayDone,
    restAvailable,
    restBackOn: restAvailable ? null : lastRest + REST_EVERY,
    week,
    reachedAt,
    activeDays: active.size,
  };
}
