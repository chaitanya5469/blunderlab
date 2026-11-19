import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { dateGroup } from '../../lib/format';
import type { GameAnalysis, GameRecord, GameResult } from '../../lib/types';

export interface GameFilters {
  result: GameResult | 'all';
  timeClass: string | 'all';
  analysedOnly: boolean;
  /** Opponent name search (case-insensitive substring). */
  q?: string;
}

export interface GameListItem {
  game: GameRecord;
  analysis?: GameAnalysis;
}

export interface Record3 {
  wins: number;
  draws: number;
  losses: number;
}

/** Aggregates over every game matching the filters (not only the loaded page). */
export interface GameSummary {
  /** W/D/L for every filter except the result filter, so the record stays meaningful while a result is selected. */
  record: Record3;
  /** Every synced game, unfiltered. */
  all: number;
  analysed: number;
  /** Mean owner accuracy over matching analysed games; null when none. */
  accuracy: number | null;
  /** Mean of (opponent rating - owner rating); null when no games. */
  ratingDiff: number | null;
  /** W/D/L per date group key (see `dateGroup`). */
  groups: Record<string, Record3>;
}

export interface GameList {
  items: GameListItem[];
  /** Total games matching the filters. */
  total: number;
  summary: GameSummary;
}

const opponentOf = (g: GameRecord) => (g.ownerColor === 'white' ? g.black : g.white);

/** Every filter except the result. */
const matchesBase = (f: GameFilters) => {
  const q = f.q?.trim().toLowerCase();
  return (g: GameRecord) =>
    (f.timeClass === 'all' || g.timeClass === f.timeClass) &&
    (!f.analysedOnly || g.analysisStatus === 'done') &&
    (!q || opponentOf(g).username.toLowerCase().includes(q));
};

const resultKey = (r: GameResult) => (r === 'win' ? 'wins' : r === 'draw' ? 'draws' : 'losses');

interface GameSnapshot {
  /** Every game, newest first. */
  games: GameRecord[];
  analyses: Map<string, GameAnalysis>;
}

/**
 * Every game and every analysis, loaded once by one live query. Filtering, grouping and
 * paging happen in memory (see `useGameList`), so a filter change never touches IndexedDB.
 */
function useGameSnapshot(): GameSnapshot | undefined {
  return useLiveQuery(async () => {
    const [games, analyses] = await Promise.all([db.games.orderBy('endTime').reverse().toArray(), db.analyses.toArray()]);
    return { games, analyses: new Map(analyses.map((a) => [a.gameId, a])) };
  }, []);
}

/**
 * Newest-first page of games matching `filters`, joined with their analyses, plus the
 * summary of everything that matches. Pure in-memory work over the live snapshot. Live.
 */
export function useGameList(filters: GameFilters, limit: number, now: number): GameList | undefined {
  const { result, timeClass, analysedOnly, q = '' } = filters;
  const snap = useGameSnapshot();
  return useMemo(() => {
    if (!snap) return undefined;
    const base = matchesBase({ result, timeClass, analysedOnly, q });
    const page: GameRecord[] = [];
    const groups: Record<string, Record3> = {};
    const record: Record3 = { wins: 0, draws: 0, losses: 0 };
    let total = 0;
    let diff = 0;
    let analysed = 0;
    let accSum = 0;
    let accN = 0;

    for (const g of snap.games) {
      if (!base(g)) continue;
      const key = resultKey(g.result);
      record[key]++;
      if (result !== 'all' && g.result !== result) continue;
      total++;
      if (page.length < limit) page.push(g);
      if (g.analysisStatus === 'done') {
        analysed++;
        const a = snap.analyses.get(g.uuid);
        if (a && a[a.ownerColor].moves > 0) {
          accSum += a.ownerAccuracy;
          accN++;
        }
      }
      const group = (groups[dateGroup(g.endTime, now).key] ??= { wins: 0, draws: 0, losses: 0 });
      group[key]++;
      diff += opponentOf(g).rating - g[g.ownerColor].rating;
    }

    return {
      items: page.map((game) => ({ game, analysis: snap.analyses.get(game.uuid) })),
      total,
      summary: {
        record,
        all: snap.games.length,
        analysed,
        accuracy: accN ? accSum / accN : null,
        ratingDiff: total ? diff / total : null,
        groups,
      },
    };
  }, [snap, result, timeClass, analysedOnly, q, limit, now]);
}

/** Time classes present in the owner's games, most common first. */
export function useTimeClasses(): string[] | undefined {
  return useLiveQuery(async () => {
    const keys = await db.games.orderBy('timeClass').keys();
    const counts = new Map<string, number>();
    for (const k of keys) counts.set(String(k), (counts.get(String(k)) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
  }, []);
}
