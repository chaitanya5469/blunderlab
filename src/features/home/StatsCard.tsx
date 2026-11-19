import type { ReactNode } from 'react';
import { AnimatedNumber, Card, Skeleton, StatTile, StatTileGroup } from '../../components/ui';
import { cn } from '../../lib/cn';
import type { OwnerStats } from './useOwnerStats';

function WdlBar({ wins, draws, losses }: Pick<OwnerStats, 'wins' | 'draws' | 'losses'>) {
  const total = wins + draws + losses;
  const parts = [
    { key: 'W', label: 'Wins', n: wins, bar: 'bg-win', text: 'text-win' },
    { key: 'D', label: 'Draws', n: draws, bar: 'bg-draw', text: 'text-draw' },
    { key: 'L', label: 'Losses', n: losses, bar: 'bg-loss', text: 'text-loss' },
  ];
  return (
    <div>
      <div className="flex h-2 gap-[3px] overflow-hidden rounded-full bg-surface-3 shadow-recessed">
        {total > 0 &&
          parts.map((p) =>
            p.n > 0 ? (
              <div key={p.key} className={cn('h-full transition-[width] duration-700 ease-out-soft', p.bar)} style={{ width: `${(p.n / total) * 100}%` }} />
            ) : null,
          )}
      </div>
      <div className="mt-2.5 flex justify-between text-xs">
        {parts.map((p) => (
          <span key={p.key} className="text-fg-muted tnum" title={p.label}>
            <span className={cn('font-semibold', p.text)}>{p.key}</span> <span className="font-medium text-fg">{p.n.toLocaleString()}</span>
            {total > 0 && <span className="text-fg-subtle"> · {Math.round((p.n / total) * 100)}%</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Narrow cards (the Home slider) use a smaller tile basis so the three tiles stay on one row; they still wrap with large text. */
function Tiles({ compact, children }: { compact?: boolean; children: ReactNode }) {
  return compact ? <div className="flex flex-wrap gap-2 *:flex-1 *:basis-[4.5em]">{children}</div> : <StatTileGroup>{children}</StatTileGroup>;
}

/** Headline stats from analysed games ("Your form"). */
export function StatsCard({ stats, title, compact, className }: { stats: OwnerStats | undefined; title?: string; compact?: boolean; className?: string }) {
  if (!stats) {
    return (
      <Card variant="feature" className={cn('space-y-4', className)}>
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-2 w-full" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-18 rounded-[14px]" />
          <Skeleton className="h-18 rounded-[14px]" />
          <Skeleton className="h-18 rounded-[14px]" />
        </div>
      </Card>
    );
  }
  const hasAnalysis = stats.analysed > 0;
  return (
    <Card variant="feature" className={cn('space-y-5', className)}>
      {title && <p className="-mb-1 font-display text-xl leading-tight font-semibold tracking-[-0.02em]">{title}</p>}
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-fg-muted">Average accuracy</p>
          <p className="mt-2 font-display text-[3.25rem] leading-[0.95] font-semibold tracking-[-0.045em] tnum">
            {hasAnalysis ? <AnimatedNumber value={stats.accuracy} decimals={1} /> : '—'}
            {hasAnalysis && <span className="ml-0.5 text-2xl font-medium tracking-normal text-fg-subtle">%</span>}
          </p>
        </div>
        <p className="max-w-[15ch] pb-1 text-right text-xs leading-snug text-fg-subtle">
          {hasAnalysis ? (
            <>
              across <span className="font-medium text-fg-muted tnum">{stats.analysed.toLocaleString()}</span> analysed{' '}
              {stats.analysed === 1 ? 'game' : 'games'}
            </>
          ) : (
            'Appears after your first analysed game'
          )}
        </p>
      </div>
      <WdlBar wins={stats.wins} draws={stats.draws} losses={stats.losses} />
      <Tiles compact={compact}>
        <StatTile label="Blunders" hint="per game" value={hasAnalysis ? stats.blundersPerGame : '—'} decimals={2} valueClassName="text-blunder" />
        <StatTile label="Mistakes" hint="per game" value={hasAnalysis ? stats.mistakesPerGame : '—'} decimals={2} valueClassName="text-mistake" />
        <StatTile label="Misses" hint="per game" value={hasAnalysis ? stats.missesPerGame : '—'} decimals={2} valueClassName="text-miss" />
      </Tiles>
    </Card>
  );
}
