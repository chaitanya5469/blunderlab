import type { ReactNode } from 'react';
import { AnimatedNumber, Card, Skeleton } from '../../components/ui';
import { cn } from '../../lib/cn';
import type { GameResult } from '../../lib/types';
import { RESULT_TINT, accuracyTone, formatDiff } from './gameMeta';
import type { GameSummary } from './useGameList';

interface RecordCardProps {
  summary: GameSummary | undefined;
  /** Games in the list (all filters applied). */
  total: number | undefined;
  result: GameResult | 'all';
  /** Short description of the non-result filters, e.g. 'Blitz · analysed'. */
  context: string;
}

const COLUMNS = [
  { key: 'wins', result: 'win', label: 'Wins', text: 'text-win', bar: 'bg-win' },
  { key: 'draws', result: 'draw', label: 'Draws', text: 'text-draw', bar: 'bg-draw' },
  { key: 'losses', result: 'loss', label: 'Losses', text: 'text-loss', bar: 'bg-loss' },
] as const;

/** The screen's feature surface: the record for the current filters, and how well those games were played. */
export function RecordCard({ summary, total, result, context }: RecordCardProps) {
  if (!summary || total === undefined) {
    return (
      <Card variant="feature" className="space-y-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-11 w-32" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-10 w-full" />
      </Card>
    );
  }

  const { record } = summary;
  const games = record.wins + record.draws + record.losses;
  const winRate = games ? (record.wins / games) * 100 : 0;

  return (
    <Card variant="feature" tint={RESULT_TINT[result]} padded={false} className="overflow-hidden">
      <div className="px-4 pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="min-w-0 truncate text-2xs font-semibold tracking-[0.14em] text-fg-subtle uppercase">
            Record<span className="tracking-normal normal-case"> · {context}</span>
          </p>
          <p className="shrink-0 text-xs text-fg-muted tnum">
            {games.toLocaleString()} {games === 1 ? 'game' : 'games'}
          </p>
        </div>

        {/* Wraps (columns drop below the win rate) when large system text makes the row too wide. */}
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-[2.75rem] leading-none font-semibold tracking-[-0.04em] tnum">
              {games ? <AnimatedNumber value={winRate} /> : '—'}
              {games > 0 && <span className="ml-0.5 text-xl font-medium tracking-normal text-fg-subtle">%</span>}
            </p>
            <p className="mt-1.5 text-xs text-fg-muted">win rate</p>
          </div>
          <div className="ml-auto flex gap-1">
            {COLUMNS.map((c) => {
              // The selected result is lifted onto an inset tile; the others stay at full contrast.
              return (
                <div
                  key={c.key}
                  className={cn(
                    'min-w-13 rounded-[12px] border border-transparent px-2 py-1.5 text-center transition-colors duration-200',
                    result === c.result && 'surface-inset',
                  )}
                >
                  <p className={cn('font-display text-xl leading-tight font-semibold tnum', c.text)}>
                    <AnimatedNumber value={record[c.key]} />
                  </p>
                  <p className="text-2xs text-fg-subtle">{c.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex h-2 gap-[3px] overflow-hidden rounded-full bg-surface-3 shadow-recessed" aria-hidden>
          {games > 0 &&
            COLUMNS.map((c) =>
              record[c.key] > 0 ? (
                <div
                  key={c.key}
                  className={cn('h-full transition-[width,opacity] duration-500 ease-out-soft', c.bar, result !== 'all' && result !== c.result && 'opacity-35')}
                  style={{ width: `${(record[c.key] / games) * 100}%` }}
                />
              ) : null,
            )}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 border-t border-white/[0.06] bg-ink/25">
        <Metric label="Analysed">
          <AnimatedNumber value={summary.analysed} />
          <span className="text-xs font-medium text-fg-subtle">/{total.toLocaleString()}</span>
        </Metric>
        <Metric label="Accuracy" className="border-x border-white/[0.06]">
          {summary.accuracy === null ? (
            <span className="text-fg-subtle">—</span>
          ) : (
            <span className={accuracyTone(summary.accuracy)}>
              <AnimatedNumber value={summary.accuracy} decimals={1} />
              <span className="text-xs font-medium text-fg-subtle">%</span>
            </span>
          )}
        </Metric>
        <Metric label="Opp. vs you">
          {summary.ratingDiff === null ? <span className="text-fg-subtle">—</span> : formatDiff(summary.ratingDiff)}
        </Metric>
      </dl>
    </Card>
  );
}

function Metric({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn('min-w-0 px-3 py-3 text-center', className)}>
      <dt className="text-2xs text-balance text-fg-subtle">{label}</dt>
      <dd className="mt-0.5 truncate font-display text-base leading-tight font-semibold tnum">{children}</dd>
    </div>
  );
}
