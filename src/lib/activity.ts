import { db } from './db';
import type { ActivityEvent, ActivityKind, ActivityResult } from './types';

/**
 * The shared activity log (table `activity`): one row per finished puzzle (from the owner's
 * games or from Lichess) or completed lesson. Features that count practice (daily streaks,
 * achievements) read from here instead of from each feature's own tables.
 *
 * When called inside a Dexie transaction, that transaction must include `db.activity`.
 */
export async function recordActivity(kind: ActivityKind, result: ActivityResult, ref?: string, at = Date.now()): Promise<void> {
  await db.activity.add({ kind, result, at, ...(ref ? { ref } : {}) });
}

/** Activity since `from` (epoch ms), oldest first, optionally of one kind. */
export function activitySince(from: number, kind?: ActivityKind): Promise<ActivityEvent[]> {
  return kind ? db.activity.where('[kind+at]').between([kind, from], [kind, Infinity]).toArray() : db.activity.where('at').aboveOrEqual(from).toArray();
}
