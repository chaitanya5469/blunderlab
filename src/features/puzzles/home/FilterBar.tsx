import { useMemo, useState, type ReactNode } from 'react';
import { Clock3, SlidersHorizontal, X } from 'lucide-react';
import { TIME_CLASS_ICON } from '../../games/gameMeta';
import { Button, Sheet } from '../../../components/ui';
import { cn } from '../../../lib/cn';
import { capitalize, pluralize } from '../../../lib/format';
import type { GamePhase, Puzzle, PuzzleMotif, PuzzleSource } from '../../../lib/types';
import { activeCount, matches, type PuzzleFilters } from '../model/filters';
import { MOTIF_LABEL, PHASE_LABEL, SOURCE_LABEL } from '../model/labels';

interface FilterBarProps {
  puzzles: Puzzle[];
  filters: PuzzleFilters;
  onChange: (patch: Partial<PuzzleFilters>) => void;
}

interface Group<K extends keyof PuzzleFilters> {
  key: K;
  title: string;
  options: { value: NonNullable<PuzzleFilters[K]>; label: string }[];
}

const TIME_ORDER = ['rapid', 'blitz', 'bullet', 'daily'];
const SOURCES: PuzzleSource[] = ['blunder', 'mistake', 'miss'];
const PHASES: GamePhase[] = ['opening', 'middlegame', 'endgame'];
const MOTIFS: PuzzleMotif[] = ['mate', 'winsMaterial', 'hangingPiece', 'missedCapture'];

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

/** "Filters" button with the active filters as removable chips; the full choice lives in a sheet. */
export function FilterBar({ puzzles, filters, onChange }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const groups = useMemo(() => {
    const present = <T,>(values: T[], has: (p: Puzzle, v: T) => boolean) => values.filter((v) => puzzles.some((p) => has(p, v)));
    return [
      { key: 'source', title: 'Mistake type', options: SOURCES.map((v) => ({ value: v, label: SOURCE_LABEL[v] })) },
      { key: 'phase', title: 'Game phase', options: PHASES.map((v) => ({ value: v, label: PHASE_LABEL[v] })) },
      { key: 'motif', title: 'Theme', options: present(MOTIFS, (p, m) => p.motifs.includes(m)).map((v) => ({ value: v, label: MOTIF_LABEL[v] })) },
    ] as Group<keyof PuzzleFilters>[];
  }, [puzzles]);

  const active = groups.flatMap((g) => g.options.filter((o) => filters[g.key] === o.value).map((o) => ({ key: g.key, label: o.label })));
  const n = activeCount({ ...filters, timeClass: null });
  const shown = puzzles.filter((p) => matches(p, filters)).length;
  const present = new Set(puzzles.map((p) => p.timeClass));
  if (filters.timeClass) present.add(filters.timeClass);
  const timeClasses = [...TIME_ORDER.filter((t) => present.has(t)), ...[...present].filter((t) => !TIME_ORDER.includes(t)).sort()];

  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Time control and filters">
      <Chip active={!filters.timeClass} onClick={() => onChange({ timeClass: null })}>
        All
      </Chip>
      {timeClasses.map((tc) => {
        const Icon = TIME_CLASS_ICON[tc] ?? Clock3;
        return (
          <Chip key={tc} active={filters.timeClass === tc} onClick={() => onChange({ timeClass: filters.timeClass === tc ? null : tc })}>
            <Icon className="size-3.5" aria-hidden />
            {capitalize(tc)}
          </Chip>
        );
      })}
      <Chip active={n > 0} onClick={() => setOpen(true)}>
        <SlidersHorizontal className="size-4" aria-hidden />
        Filters{n > 0 && <span className="tnum"> · {n}</span>}
      </Chip>
      {active.map((a) => (
        <Chip key={a.key} active onClick={() => onChange({ [a.key]: null })}>
          {a.label}
          <X className="size-3.5" aria-label="Remove filter" />
        </Chip>
      ))}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Filter puzzles"
        description="Applies to training and the list."
        actions={
          <>
            <Button variant="primary" size="lg" onClick={() => setOpen(false)}>
              Show {pluralize(shown, 'puzzle')}
            </Button>
            <Button variant="ghost" size="lg" disabled={n === 0} onClick={() => onChange({ source: null, phase: null, motif: null })}>
              Clear filters
            </Button>
          </>
        }
      >
        <div className="max-h-[50dvh] space-y-4 overflow-y-auto">
          {groups
            .filter((g) => g.options.length > 0)
            .map((g) => (
              <div key={g.key}>
                <p className="mb-2 text-2xs font-semibold tracking-[0.12em] text-fg-subtle uppercase">{g.title}</p>
                <div className="flex flex-wrap gap-2">
                  {g.options.map((o) => (
                    <Chip key={o.value} active={filters[g.key] === o.value} onClick={() => onChange({ [g.key]: filters[g.key] === o.value ? null : o.value })}>
                      {o.label}
                    </Chip>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </Sheet>
    </div>
  );
}
