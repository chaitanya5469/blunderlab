import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, ChevronRight, Globe, GraduationCap, Puzzle, ScanLine } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useLearnSummary } from '../learn';
import { useLichessSummary, usePuzzleSummary } from '../puzzles';

function Doorway({ to, tint, icon, title, line }: { to: string; tint: 'blunder' | 'accent'; icon: ReactNode; title: string; line: ReactNode }) {
  return (
    <Link
      to={to}
      className={cn(
        'group relative flex min-h-36 flex-col overflow-hidden rounded-card p-4 pressable surface-raised',
        // A softer cousin of the feature surface: tinted corner light, tinted hairline.
        tint === 'blunder'
          ? 'border-blunder/18 bg-[radial-gradient(120%_90%_at_0%_0%,rgb(240_93_93/0.13),transparent_60%)]'
          : 'border-accent/18 bg-[radial-gradient(120%_90%_at_0%_0%,rgb(111_149_255/0.14),transparent_60%)]',
      )}
    >
      <span
        className={cn(
          'grid size-10 place-items-center rounded-[12px] edge-current',
          tint === 'blunder' ? 'bg-blunder/14 text-blunder' : 'bg-accent-soft text-accent-strong',
        )}
      >
        {icon}
      </span>
      <ArrowUpRight
        className="absolute top-4 right-4 size-4 text-fg-subtle transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-active:translate-x-0.5 group-active:-translate-y-0.5"
        aria-hidden
      />
      <span className="mt-auto pt-4 font-display text-lg leading-tight font-semibold">{title}</span>
      <span className="mt-0.5 text-xs text-fg-muted">{line}</span>
    </Link>
  );
}

/** Lichess puzzles: their own row, colour and numbers, apart from the puzzles from the owner's games. */
function LichessDoorway() {
  const s = useLichessSummary();
  const line = !s
    ? ' '
    : [`Rating ${s.rating}${s.provisional ? '?' : ''}`, s.solvedToday > 0 && `${s.solvedToday} solved today`, s.dailyDone ? 'Daily puzzle done' : 'Daily puzzle'].filter(Boolean).join(' · ');
  return (
    <Link
      to="/puzzles/lichess"
      className="col-span-2 flex min-h-16 items-center gap-3 rounded-card border-lichess/18 bg-[radial-gradient(120%_120%_at_0%_0%,rgb(180_156_255/0.13),transparent_60%)] p-4 pressable surface-raised"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-lichess-soft text-lichess edge-current">
        <Globe className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg leading-tight font-semibold">Lichess puzzles</span>
        <span className="mt-0.5 block truncate text-xs text-fg-muted">{line}</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-fg-subtle" aria-hidden />
    </Link>
  );
}

/** The position scanner / board editor with live engine analysis. */
function AnalyseDoorway() {
  return (
    <Link
      to="/analyse"
      className="col-span-2 flex min-h-16 items-center gap-3 rounded-card border-accent/18 bg-[radial-gradient(120%_120%_at_0%_0%,rgb(111_149_255/0.13),transparent_60%)] p-4 pressable surface-raised"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-accent-soft text-accent-strong edge-current">
        <ScanLine className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg leading-tight font-semibold">Analyse a position</span>
        <span className="mt-0.5 block truncate text-xs text-fg-muted">Scan a photo or set up a board</span>
      </span>
      <ChevronRight className="size-5 shrink-0 text-fg-subtle" aria-hidden />
    </Link>
  );
}

/** Doorways to Puzzles (from the owner's games), Lichess puzzles, Learn and the position analyser. */
export function EntryCards() {
  const puzzles = usePuzzleSummary();
  const puzzleLine = !puzzles
    ? ' '
    : puzzles.total === 0
      ? 'From your own mistakes'
      : puzzles.due + puzzles.fresh === 0
        ? 'From your games · all caught up'
        : ['From your games', puzzles.due > 0 && `${puzzles.due.toLocaleString()} due`, puzzles.fresh > 0 && `${puzzles.fresh.toLocaleString()} new`].filter(Boolean).join(' · ');
  const learn = useLearnSummary();
  const learnLine = !learn
    ? 'Openings and traps'
    : learn.dueForReview > 0
      ? `${learn.dueForReview.toLocaleString()} due for review`
      : `${learn.completed.toLocaleString()} of ${learn.total.toLocaleString()} lessons done`;
  return (
    <div className="grid grid-cols-2 gap-3">
      <Doorway to="/puzzles" tint="blunder" icon={<Puzzle className="size-5" aria-hidden />} title="Your puzzles" line={puzzleLine} />
      <Doorway to="/learn" tint="accent" icon={<GraduationCap className="size-5" aria-hidden />} title="Learn" line={learnLine} />
      <LichessDoorway />
      <AnalyseDoorway />
    </div>
  );
}
