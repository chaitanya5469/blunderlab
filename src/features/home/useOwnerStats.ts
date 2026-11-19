import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';

export interface OwnerStats {
  analysed: number;
  accuracy: number;
  blundersPerGame: number;
  mistakesPerGame: number;
  missesPerGame: number;
  wins: number;
  draws: number;
  losses: number;
}

/** Headline numbers: accuracy and error rates from analysed games, W/D/L from all games. */
export function useOwnerStats(): OwnerStats | undefined {
  return useLiveQuery(async () => {
    const [analyses, wins, draws, losses] = await Promise.all([
      db.analyses.toArray(),
      db.games.where('result').equals('win').count(),
      db.games.where('result').equals('draw').count(),
      db.games.where('result').equals('loss').count(),
    ]);
    const counted = analyses.filter((a) => a[a.ownerColor].moves > 0);
    const n = counted.length;
    const sum = (f: (a: (typeof counted)[number]) => number) => counted.reduce((s, a) => s + f(a), 0);
    return {
      analysed: n,
      accuracy: n ? sum((a) => a.ownerAccuracy) / n : 0,
      blundersPerGame: n ? sum((a) => a.ownerCounts.blunder) / n : 0,
      mistakesPerGame: n ? sum((a) => a.ownerCounts.mistake) / n : 0,
      missesPerGame: n ? sum((a) => a.ownerCounts.miss) / n : 0,
      wins,
      draws,
      losses,
    };
  }, []);
}
