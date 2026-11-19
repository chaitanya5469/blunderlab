import { liveQuery } from 'dexie';
import { db } from '../../../lib/db';
import { createStore } from '../../../lib/store';
import { getProgress, subscribeProgress } from '../../learn/lib/progress';
import { BADGES } from './badges';
import { computeSnapshot, type ProgressSnapshot } from './snapshot';
import { dayIndex } from './streak';

/** Set once the first evaluation stored what was already earned (those unlock silently). */
const BASELINE_KEY = 'achievements-baseline';
/** Badges re-checked on every evaluation and withdrawn when no longer earned. */
const RECHECKED = new Set(['brilliant']);

export const achievementsStore = createStore<{ snapshot: ProgressSnapshot | null }>({ snapshot: null });
/** Badge ids waiting for their unlock celebration, oldest first. */
export const unlockQueue = createStore<{ ids: string[] }>({ ids: [] });

let running = false;
let pending = false;
let timer: number | undefined;

async function evaluate() {
  if (running) {
    pending = true;
    return;
  }
  running = true;
  try {
    const now = Date.now();
    const snapshot = await computeSnapshot(getProgress(), now);
    achievementsStore.set({ snapshot });
    const fresh = await db.transaction('rw', db.achievements, db.meta, async () => {
      const have = new Set(await db.achievements.toCollection().primaryKeys());
      const baseline = await db.meta.get(BASELINE_KEY);
      const earned = BADGES.map((b) => ({ b, st: b.check(snapshot) })).filter(({ b, st }) => st.done && !have.has(b.id));
      if (earned.length) await db.achievements.bulkPut(earned.map(({ b, st }) => ({ id: b.id, unlockedAt: st.at ?? now, recordedAt: now })));
      // Badges that depend on move classification are withdrawn if a reclassification shows they
      // were never really earned (an older brilliant rule also flagged replies to the opponent's sacrifice).
      const withdrawn = BADGES.filter((b) => RECHECKED.has(b.id) && have.has(b.id) && !b.check(snapshot).done).map((b) => b.id);
      if (withdrawn.length) await db.achievements.bulkDelete(withdrawn);
      if (!baseline) {
        await db.meta.put({ key: BASELINE_KEY, value: now });
        return [];
      }
      return earned.map(({ b }) => b.id);
    });
    if (fresh.length) unlockQueue.set({ ids: [...unlockQueue.get().ids, ...fresh] });
  } catch (e) {
    console.warn('Achievements evaluation failed', e);
  } finally {
    running = false;
    if (pending) {
      pending = false;
      schedule();
    }
  }
}

function schedule(delay = 250) {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void evaluate(), delay);
}

let started = false;

/**
 * Keeps the progress snapshot current and records new badges. Re-evaluates when practice is
 * stored (both puzzle sources, lessons), when analysis finds something, and when the day changes.
 */
export function startAchievements() {
  if (started) return;
  started = true;
  liveQuery(() =>
    Promise.all([
      db.activity.count(),
      db.puzzleAttempts.count(),
      db.lichessAttempts.count(),
      db.analyses.count(),
      db.moves.where('[actor+classification]').equals(['owner', 'brilliant']).count(),
    ]),
  ).subscribe({ next: () => schedule(), error: (e) => console.warn('Achievements watch failed', e) });
  subscribeProgress(() => schedule());
  let day = dayIndex(Date.now());
  const checkDay = () => {
    const d = dayIndex(Date.now());
    if (d !== day) {
      day = d;
      schedule(0);
    }
  };
  window.setInterval(checkDay, 60_000);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && checkDay());
}

export function shiftUnlock() {
  unlockQueue.set({ ids: unlockQueue.get().ids.slice(1) });
}
