import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, Clock3, RotateCcw, Search, X } from 'lucide-react';
import { Tabs } from '../../components/ui';
import { cn } from '../../lib/cn';
import { capitalize } from '../../lib/format';
import type { GameResult } from '../../lib/types';
import { TIME_CLASS_ICON } from './gameMeta';
import { useTimeClasses, type GameFilters } from './useGameList';

const RESULT_TABS: { value: GameResult | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'win', label: 'Wins' },
  { value: 'loss', label: 'Losses' },
  { value: 'draw', label: 'Draws' },
];

/** Indicator tint per selected result, so the control echoes the record card. */
const INDICATOR: Record<GameResult | 'all', string | undefined> = {
  all: undefined,
  win: 'border-win/35 bg-win/12',
  loss: 'border-loss/35 bg-loss/12',
  draw: 'border-draw/30 bg-draw/10',
};

function Chip({ active, onClick, children, label }: { active: boolean; onClick: () => void; children: ReactNode; label?: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[0.8125rem] font-medium pressable',
        active
          ? 'border-accent/45 bg-accent-soft text-accent-strong shadow-[inset_0_1px_0_rgb(147_176_255/0.16)]'
          : 'border-line-soft bg-surface-1 text-fg-muted shadow-[inset_0_1px_0_rgb(255_255_255/0.03)] hover:text-fg active:bg-surface-2',
      )}
    >
      {children}
    </button>
  );
}

/** Opponent search; typing is local and pushed to the URL after a short pause. */
function SearchField({ value, onChange }: { value: string; onChange: (q: string) => void }) {
  const [text, setText] = useState(value);
  const input = useRef<HTMLInputElement>(null);
  // Follow external changes (reset, back navigation).
  useEffect(() => setText(value), [value]);
  useEffect(() => {
    if (text === value) return;
    const t = window.setTimeout(() => onChange(text), 220);
    return () => window.clearTimeout(t);
  }, [text]);

  return (
    <label className="surface-base relative flex h-11 min-w-0 flex-1 items-center rounded-control transition-colors focus-within:border-accent/50">
      <Search className="pointer-events-none absolute left-3 size-4 text-fg-subtle" aria-hidden />
      <input
        ref={input}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && input.current?.blur()}
        placeholder="Search opponents"
        aria-label="Search opponents"
        className="h-full w-full min-w-0 bg-transparent pr-11 pl-9 text-sm text-fg outline-none placeholder:text-fg-subtle [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setText('');
            onChange('');
          }}
          className="absolute right-0 grid size-11 place-items-center rounded-control text-fg-subtle pressable hover:text-fg active:text-fg"
        >
          <X className="size-4" />
        </button>
      )}
    </label>
  );
}

interface GameFilterBarProps {
  filters: GameFilters;
  onChange: (p: Partial<GameFilters>) => void;
}

/** Search, analysed toggle, result and time-class filters. Wraps instead of scrolling sideways. */
export function GameFilterBar({ filters, onChange }: GameFilterBarProps) {
  const classes = useTimeClasses() ?? [];
  return (
    <div className="space-y-2.5">
      <div className="flex gap-2">
        <SearchField value={filters.q ?? ''} onChange={(q) => onChange({ q })} />
        <Chip active={filters.analysedOnly} onClick={() => onChange({ analysedOnly: !filters.analysedOnly })}>
          <Check className={cn('size-3.5 transition-opacity', filters.analysedOnly ? 'opacity-100' : 'opacity-40')} aria-hidden />
          Analysed
        </Chip>
      </div>
      <Tabs
        label="Result"
        options={RESULT_TABS}
        value={filters.result}
        onChange={(result) => onChange({ result })}
        indicatorClassName={INDICATOR[filters.result]}
      />
      {classes.length > 1 && <FilterChips filters={filters} onChange={onChange} classes={classes} />}
    </div>
  );
}

/** Time-class toggles (single choice; tap again for all). */
export function FilterChips({
  filters,
  onChange,
  classes: given,
}: {
  filters: GameFilters;
  onChange: (p: Partial<GameFilters>) => void;
  classes?: string[];
}) {
  const fetched = useTimeClasses();
  const classes = given ?? fetched ?? [];
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Time control">
      {classes.map((tc) => {
        const Icon = TIME_CLASS_ICON[tc] ?? Clock3;
        return (
          <Chip key={tc} active={filters.timeClass === tc} onClick={() => onChange({ timeClass: filters.timeClass === tc ? 'all' : tc })}>
            <Icon className="size-3.5" aria-hidden />
            {capitalize(tc)}
          </Chip>
        );
      })}
    </div>
  );
}

interface ActiveFiltersProps {
  filters: GameFilters;
  total: number | undefined;
  all: number | undefined;
  onReset: () => void;
}

const RESULT_WORD = { win: 'Wins', loss: 'Losses', draw: 'Draws' } as const;

/** "12 of 64 · Losses · Blitz · “kas”" with a one-tap reset. Only shown while something is filtered. */
export function ActiveFilters({ filters, total, all, onReset }: ActiveFiltersProps) {
  const parts = [
    filters.result !== 'all' && RESULT_WORD[filters.result],
    filters.timeClass !== 'all' && capitalize(filters.timeClass),
    filters.analysedOnly && 'Analysed',
    filters.q?.trim() && `“${filters.q.trim()}”`,
  ].filter(Boolean) as string[];
  if (!parts.length) return null;
  return (
    <div className="flex items-center gap-2 animate-settle" aria-live="polite">
      <p className="min-w-0 flex-1 truncate pl-1 text-xs text-fg-muted">
        {total !== undefined && all !== undefined && (
          <span className="font-semibold text-fg tnum">
            {total.toLocaleString()} <span className="font-normal text-fg-subtle">of {all.toLocaleString()}</span>
          </span>
        )}
        {parts.map((p) => (
          <span key={p}>
            <span className="text-fg-subtle"> · </span>
            {p}
          </span>
        ))}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="-mr-2 inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-accent-strong pressable hover:bg-accent-soft active:bg-accent-soft"
      >
        <RotateCcw className="size-3.5" aria-hidden />
        Reset
      </button>
    </div>
  );
}
