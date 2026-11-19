import { Capacitor } from '@capacitor/core';
import { archiveMonth, fetchArchive, fetchArchiveList, fetchRatings, toGameRecord } from '../lib/chesscom';
import { db } from '../lib/db';
import { formatMonth } from '../lib/format';
import { createStore } from '../lib/store';

export interface SyncState {
  status: 'idle' | 'syncing' | 'error';
  /** Month currently being fetched, e.g. "March 2025". */
  fetchingMonth: string | null;
  /** Last month stored and how many games it had. */
  lastMonth: { label: string; games: number } | null;
  monthsDone: number;
  monthsTotal: number;
  /** New games stored during this sync. */
  newGames: number;
  error: string | null;
}

/** On returning to the foreground, re-sync when the last sync is older than this. */
const RESUME_SYNC_AFTER_MS = 30 * 60 * 1000;
/** On launch, skip the sync when one finished this recently (e.g. right after onboarding). */
const LAUNCH_SKIP_MS = 2 * 60 * 1000;

/**
 * Fetches the owner's Chess.com archives sequentially, newest month first.
 * Games are written month by month so the UI fills in as they arrive.
 * Incremental: only months never fetched, plus the latest stored month and newer.
 */
class SyncService {
  readonly store = createStore<SyncState>({
    status: 'idle',
    fetchingMonth: null,
    lastMonth: null,
    monthsDone: 0,
    monthsTotal: 0,
    newGames: 0,
    error: null,
  });

  private controller: AbortController | null = null;
  private current: Promise<void> | null = null;
  private launched = false;
  private watching = false;

  /**
   * `quiet` (automatic syncs): a failure (offline, Chess.com unreachable) is only logged, the
   * store goes back to idle so no error card shows. Manual syncs report errors.
   */
  sync({ quiet = false }: { quiet?: boolean } = {}): Promise<void> {
    this.current ??= this.run(quiet).finally(() => {
      this.current = null;
      this.controller = null;
    });
    return this.current;
  }

  /**
   * Automatic background syncing: a quiet sync once per cold start, and again whenever the app
   * comes back to the foreground with the last sync older than 30 minutes. New games land in the
   * database and the analysis queue picks them up as usual.
   */
  startAutoSync() {
    if (!this.launched) {
      this.launched = true;
      void this.autoSync(LAUNCH_SKIP_MS);
    }
    if (this.watching) return;
    this.watching = true;
    const onResume = () => void this.autoSync(RESUME_SYNC_AFTER_MS);
    document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && onResume());
    // The Android shell also reports resume through Capacitor (a duplicate call is a no-op while a sync runs).
    if (Capacitor.isNativePlatform()) void import('@capacitor/app').then(({ App }) => App.addListener('resume', onResume)).catch(() => undefined);
  }

  private async autoSync(olderThanMs: number) {
    if (this.current || (typeof navigator !== 'undefined' && navigator.onLine === false)) return;
    const profile = await db.profile.get('owner');
    if (profile && Date.now() - (profile.lastSyncAt ?? 0) > olderThanMs) void this.sync({ quiet: true });
  }

  async cancel() {
    this.controller?.abort();
    await this.current?.catch(() => undefined);
  }

  private async run(quiet: boolean) {
    const profile = await db.profile.get('owner');
    if (!profile) return;
    const controller = new AbortController();
    this.controller = controller;
    const { signal } = controller;
    this.store.set({ status: 'syncing', fetchingMonth: null, lastMonth: null, monthsDone: 0, monthsTotal: 0, newGames: 0, error: null });

    try {
      fetchRatings(profile.username, signal)
        .then((ratings) => db.profile.update('owner', { ratings, ratingsFetchedAt: Date.now() }))
        .catch(() => undefined);

      const urls = (await fetchArchiveList(profile.username, signal)).slice().reverse();
      const stored = new Set((await db.archives.toArray()).map((a) => a.month));
      const latestStored = [...stored].sort().at(-1);
      const todo = urls.filter((u) => {
        const month = archiveMonth(u);
        return !stored.has(month) || (latestStored !== undefined && month >= latestStored);
      });
      this.store.set({ monthsTotal: todo.length });

      for (const url of todo) {
        const month = archiveMonth(url);
        const label = formatMonth(month);
        this.store.set({ fetchingMonth: label });
        const apiGames = await fetchArchive(url, signal);
        const records = apiGames.flatMap((g) => toGameRecord(g, profile.username, month) ?? []);
        const unique = [...new Map(records.map((r) => [r.uuid, r])).values()];
        const existing = await db.games.bulkGet(unique.map((r) => r.uuid));
        const fresh = unique.filter((_, i) => !existing[i]);
        await db.transaction('rw', db.games, db.archives, async () => {
          if (fresh.length) await db.games.bulkAdd(fresh);
          await db.archives.put({ month, url, fetchedAt: Date.now(), gameCount: unique.length });
        });
        const s = this.store.get();
        this.store.set({ lastMonth: { label, games: unique.length }, monthsDone: s.monthsDone + 1, newGames: s.newGames + fresh.length });
      }
      await db.profile.update('owner', { lastSyncAt: Date.now() });
      this.store.set({ status: 'idle', fetchingMonth: null });
    } catch (e) {
      if (signal.aborted) {
        this.store.set({ status: 'idle', fetchingMonth: null });
        return;
      }
      const error = e instanceof Error ? e.message : String(e);
      if (quiet) {
        console.warn('Background sync failed', error);
        this.store.set({ status: 'idle', fetchingMonth: null, error: null });
        return;
      }
      this.store.set({ status: 'error', fetchingMonth: null, error });
    }
  }
}

export const syncService = new SyncService();
