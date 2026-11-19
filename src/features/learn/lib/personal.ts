import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../lib/db';
import type { Color } from '../../../lib/types';
import { moveLabel, OPENINGS, TRAPS } from './catalog';
import { lineKeys } from './lines';

/*
 * Personalisation from the owner's games. The heavy part (reading every PGN and walking
 * its first moves against the lesson lines) runs in a Web Worker; results are cached per
 * game-table signature so revisiting Learn does not recompute.
 */

export interface MatchSpec {
  openings: { id: string; side: Color; prefixes: string[][] }[];
  traps: { id: string; side: Color; lines: { keys: string[]; bait: number; mistake: number }[] }[];
}

export interface OpeningGroup {
  name: string;
  color: Color;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  /** The lesson most of these games lead into, if any. */
  lessonId?: string;
}

export interface TrapHits {
  /** The owner made the losing mistake. */
  fell: number;
  /** The owner set the trap and the opponent fell for it. */
  sprung: number;
  /** The opponent set the bait and the owner avoided the mistake. */
  dodged: number;
  /** The owner reached the position before the bait and played something else. */
  chances: number;
}

export interface PersonalStats {
  games: number;
  openings: OpeningGroup[];
  traps: Record<string, TrapHits>;
}

function buildSpec(): MatchSpec {
  return {
    openings: OPENINGS.map((l) => ({ id: l.source.id, side: l.source.side, prefixes: l.source.match.map((m) => m.split(' ')) })),
    traps: TRAPS.map((l) => ({
      id: l.source.id,
      side: l.source.side,
      lines: l.playables
        .filter((p) => p.line.role === 'trap' && p.mistakeIndex !== undefined)
        .map((p) => {
          const bait = p.plies.findIndex((ply) => moveLabel(ply.moveNumber, ply.color, ply.san) === l.source.bait);
          return { keys: lineKeys(p.plies), bait: bait < 0 ? p.mistakeIndex! : bait, mistake: p.mistakeIndex! };
        }),
    })),
  };
}

let cache: { sig: string; stats: PersonalStats } | null = null;

/** Opening and trap statistics from the owner's games (undefined while computing). */
export function usePersonalStats(): PersonalStats | undefined {
  const sig = useLiveQuery(async () => {
    const [count, last] = await Promise.all([db.games.count(), db.games.orderBy('endTime').last()]);
    return `${count}:${last?.endTime ?? 0}`;
  }, []);
  const [stats, setStats] = useState<PersonalStats | undefined>(() => (cache && cache.sig === sig ? cache.stats : undefined));

  useEffect(() => {
    if (sig === undefined) return;
    if (cache?.sig === sig) {
      setStats(cache.stats);
      return;
    }
    if (sig.startsWith('0:')) {
      cache = { sig, stats: { games: 0, openings: [], traps: {} } };
      setStats(cache.stats);
      return;
    }
    const worker = new Worker(new URL('./personal.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<PersonalStats>) => {
      cache = { sig, stats: e.data };
      setStats(e.data);
      worker.terminate();
    };
    worker.onerror = () => worker.terminate();
    worker.postMessage(buildSpec());
    return () => worker.terminate();
  }, [sig]);

  return stats;
}

export const scoreOf = (g: { games: number; wins: number; draws: number }) => (g.games ? (g.wins + g.draws / 2) / g.games : 0);
