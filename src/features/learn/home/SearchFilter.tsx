import type { ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../../lib/cn';
import type { LessonStatus } from '../lib/progress';
import type { Lesson } from '../types';

export type Filter = 'all' | 'openings' | 'traps' | 'white' | 'black' | 'due';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'openings', label: 'Openings' },
  { value: 'traps', label: 'Traps' },
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
  { value: 'due', label: 'Due' },
];

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ');

export function matchesFilter(lesson: Lesson, query: string, filter: Filter, status: LessonStatus): boolean {
  const s = lesson.source;
  const ok =
    filter === 'all' ||
    (filter === 'openings' && s.kind === 'opening') ||
    (filter === 'traps' && s.kind === 'trap') ||
    filter === s.side ||
    (filter === 'due' && status.due > 0);
  if (!ok) return false;
  const q = fold(query).trim();
  if (!q) return true;
  const hay = fold([s.name, s.tagline, s.kind === 'trap' ? s.opening : s.eco, ...s.lines.map((l) => l.name)].join(' '));
  return q.split(' ').every((w) => hay.includes(w));
}

/** Search box and one-tap filters for the whole course. */
export function SearchFilter({ query, onQuery, filter, onFilter, dueCount }: { query: string; onQuery: (q: string) => void; filter: Filter; onFilter: (f: Filter) => void; dueCount: number }) {
  return (
    <div className="space-y-2.5">
      <label className="relative block">
        <span className="sr-only">Search lessons</span>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-fg-subtle" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search openings and traps"
          className="h-12 w-full rounded-control border border-line-soft bg-surface-1 pr-11 pl-10.5 text-[1rem] text-fg placeholder:text-fg-subtle focus:border-accent/60 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button type="button" aria-label="Clear search" onClick={() => onQuery('')} className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-full text-fg-subtle hover:text-fg">
            <X className="size-4" />
          </button>
        )}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.filter((f) => f.value !== 'due' || dueCount > 0 || filter === 'due').map((f) => (
          <Chip key={f.value} active={filter === f.value} onClick={() => onFilter(f.value)}>
            {f.label}
            {f.value === 'due' && dueCount > 0 && <span className="tnum">· {dueCount}</span>}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
        active ? 'border-accent/50 bg-accent-soft text-accent-strong' : 'border-line-soft bg-surface-1 text-fg-muted hover:text-fg',
      )}
    >
      {children}
    </button>
  );
}
