import { useEffect, useRef } from 'react';
import { cn } from '../../lib/cn';
import type { MoveClass, ParsedPly } from '../../lib/types';
import { ClassMarker } from './ClassMarker';

interface MoveListProps {
  plies: ParsedPly[];
  /** Classification per ply (index = ply - 1), when analysed. */
  classes?: (MoveClass | undefined)[];
  current: number;
  onSelect: (ply: number) => void;
}

const MARKED = new Set<MoveClass>(['book', 'brilliant', 'great', 'best', 'inaccuracy', 'mistake', 'miss', 'blunder']);

/** Two-column move list (white | black) with quality markers; keeps the current move in view. */
export function MoveList({ plies, classes, current, onSelect }: MoveListProps) {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current?.querySelector<HTMLElement>(`[data-ply="${current}"]`);
    const container = box.current;
    if (!el || !container) return;
    const top = el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
    container.scrollTo({ top, behavior: 'smooth' });
  }, [current]);

  const rows: [ParsedPly, ParsedPly | undefined][] = [];
  for (let i = 0; i < plies.length; i += 2) rows.push([plies[i]!, plies[i + 1]]);

  const cell = (p: ParsedPly | undefined) => {
    if (!p) return <span />;
    const cls = classes?.[p.ply - 1];
    const active = p.ply === current;
    return (
      <button
        type="button"
        data-ply={p.ply}
        onClick={() => onSelect(p.ply)}
        className={cn(
          'flex h-11 min-w-0 items-center gap-1.5 rounded-chip px-2.5 text-left text-sm font-medium transition-colors',
          active ? 'bg-accent-soft text-fg ring-1 ring-accent/40' : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
        )}
      >
        <span className="truncate">{p.san}</span>
        {cls && MARKED.has(cls) && <ClassMarker cls={cls} />}
      </button>
    );
  };

  return (
    <div ref={box} className="relative max-h-64 overflow-y-auto overscroll-contain rounded-card border border-line-soft bg-surface-1 p-1.5">
      {rows.map(([w, b]) => (
        <div key={w.ply} className="grid grid-cols-[2.25rem_1fr_1fr] items-center gap-1">
          <span className="pl-1.5 text-xs text-fg-subtle tnum">{w.moveNumber}.</span>
          {cell(w)}
          {cell(b)}
        </div>
      ))}
    </div>
  );
}
