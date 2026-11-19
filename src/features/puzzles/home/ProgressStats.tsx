import { StatTile, StatTileGroup } from '../../../components/ui';
import type { AttemptStats } from '../model/usePuzzleData';
import { pluralize } from '../../../lib/format';

/** Solve rate, current streak (clean solves in a row) and puzzles solved today. */
export function ProgressStats({ stats }: { stats: AttemptStats }) {
  return (
    <StatTileGroup>
      <StatTile
        label="Solve rate"
        value={stats.solveRate === null ? '—' : stats.solveRate}
        suffix={stats.solveRate === null ? undefined : '%'}
        hint={pluralize(stats.attempts, 'attempt')}
      />
      <StatTile label="Streak" value={stats.streak} hint={`Best ${stats.bestStreak}`} valueClassName={stats.streak ? 'text-best' : undefined} />
      <StatTile label="Today" value={stats.solvedToday} hint="solved" />
    </StatTileGroup>
  );
}
