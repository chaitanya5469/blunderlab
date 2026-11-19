import { Link } from 'react-router';
import { ChevronRight, Globe, Puzzle } from 'lucide-react';
import { AnimatedNumber, Card, Skeleton } from '../../components/ui';
import { cn } from '../../lib/cn';
import { useLichessSummary, usePuzzleSummary } from '../puzzles';

/** Home slider: what's ready to solve from the owner's games (focal), with the Lichess rating as a quiet footer. */
export function PuzzlesCard({ className }: { className?: string }) {
  const own = usePuzzleSummary();
  const li = useLichessSummary();
  if (!own || !li) return <Skeleton className={cn('min-h-[188px] rounded-card', className)} />;

  const solved = own.solvedToday + li.solvedToday;
  // The focal number: reviews due first, then unseen puzzles, then everything once caught up.
  const focal =
    own.total === 0
      ? { n: null, label: 'No puzzles yet', hint: 'Made from your own mistakes once games are analysed.' }
      : own.due > 0
        ? { n: own.due, label: own.due === 1 ? 'puzzle due for review' : 'puzzles due for review', hint: own.fresh > 0 ? `${own.fresh.toLocaleString()} new to try as well` : 'From your own mistakes' }
        : own.fresh > 0
          ? { n: own.fresh, label: own.fresh === 1 ? 'new puzzle to try' : 'new puzzles to try', hint: 'From your own mistakes' }
          : { n: own.total, label: own.total === 1 ? 'puzzle, all caught up' : 'puzzles, all caught up', hint: 'Nothing due. Revisit any time.' };

  return (
    <Card variant="feature" tint="blunder" className={cn('flex flex-col justify-between gap-4', className)}>
      <Link to="/puzzles" className="-m-1 flex flex-1 flex-col justify-between gap-4 rounded-[16px] p-1 pressable" aria-label="Puzzles from your games">
        <div className="flex items-start gap-3.5">
          <span className="grid size-12 shrink-0 place-items-center rounded-[16px] bg-blunder/14 text-blunder edge-current">
            <Puzzle className="size-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl leading-tight font-semibold tracking-[-0.02em]">Puzzles</p>
            <p className={cn('mt-0.5 text-xs', solved > 0 ? 'text-fg-muted' : 'font-medium text-blunder')}>
              {solved > 0 ? `${solved} solved today` : 'One puzzle keeps the streak alive.'}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xs font-semibold tracking-[0.12em] text-fg-subtle uppercase">Yours</p>
            <p className="font-display text-lg leading-tight font-semibold tnum">{own.total.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-[3.25rem] leading-[0.95] font-semibold tracking-[-0.045em] tnum">
              {focal.n === null ? '—' : <AnimatedNumber value={focal.n} />}
            </p>
            <p className="mt-2 text-xs font-medium text-fg-muted">{focal.label}</p>
          </div>
          <p className="flex max-w-[15ch] items-center gap-0.5 pb-1 text-right text-xs leading-snug text-fg-subtle">
            <span>{focal.hint}</span>
            <ChevronRight className="size-3.5 shrink-0" aria-hidden />
          </p>
        </div>
      </Link>

      <div>
        <div className="-mx-4 mb-3 h-px bg-line-soft" aria-hidden />
        <Link to="/puzzles/lichess" className="-m-1 flex items-center gap-3 rounded-[12px] p-1 pressable" aria-label="Lichess puzzles">
          <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-lichess-soft text-lichess edge-current">
            <Globe className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Lichess</p>
            <p className="truncate text-xs text-fg-muted">{li.dailyDone ? 'Daily puzzle done' : 'Daily puzzle ready'}</p>
          </div>
          <p className="shrink-0 font-display text-lg leading-tight font-semibold text-lichess tnum">
            <AnimatedNumber value={li.rating} />
            {li.provisional && <span className="text-fg-subtle">?</span>}
          </p>
          <ChevronRight className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
        </Link>
      </div>
    </Card>
  );
}
