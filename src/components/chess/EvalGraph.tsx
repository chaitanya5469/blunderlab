import { useRef, type PointerEvent } from 'react';
import { MOVE_CLASS_META } from '../../lib/moveClass';
import type { MoveClass } from '../../lib/types';

interface EvalGraphProps {
  /** White-POV win% per position (index 0 = start position, i = after ply i). */
  curve: number[];
  /** Plies to mark with their class colour. */
  markers: { ply: number; cls: MoveClass }[];
  /** Ply under the cursor line; none when undefined. */
  current?: number;
  onSelect: (ply: number) => void;
  /** Called with the selected ply when the finger lifts (not when the gesture turns into a scroll). */
  onRelease?: (ply: number) => void;
}

const H = 100;

/** Win-probability area chart; tap or drag to scrub through the game. */
export function EvalGraph({ curve, markers, current, onSelect, onRelease }: EvalGraphProps) {
  const ref = useRef<HTMLDivElement>(null);
  const picked = useRef<number | null>(null);
  const n = curve.length;
  const xPct = (i: number) => (n > 1 ? (i / (n - 1)) * 100 : 0);

  const line = curve.map((w, i) => `${xPct(i).toFixed(2)},${(H - w).toFixed(2)}`).join(' ');
  const area = `0,${H} ${line} 100,${H}`;

  const select = (e: PointerEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || n < 2) return;
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    picked.current = Math.round(ratio * (n - 1));
    onSelect(picked.current);
  };

  return (
    <div
      ref={ref}
      className="relative h-20 w-full cursor-pointer touch-pan-y select-none"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        select(e);
      }}
      onPointerMove={(e) => e.buttons > 0 && select(e)}
      onPointerUp={() => {
        if (onRelease && picked.current !== null) onRelease(picked.current);
        picked.current = null;
      }}
      onPointerCancel={() => {
        picked.current = null;
      }}
      role="slider"
      aria-label="Evaluation graph"
      aria-valuemin={0}
      aria-valuemax={Math.max(0, n - 1)}
      aria-valuenow={current ?? 0}
    >
      <svg
        viewBox={`0 0 100 ${H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-hidden rounded-control bg-eval-black"
        aria-hidden
      >
        <polygon points={area} style={{ fill: 'var(--color-eval-white)' }} opacity={0.92} />
        <line
          x1="0"
          x2="100"
          y1={H / 2}
          y2={H / 2}
          style={{ stroke: 'var(--color-fg-subtle)' }}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="3 3"
        />
      </svg>
      {current !== undefined && <div className="absolute inset-y-0 w-px bg-accent" style={{ left: `${xPct(current)}%` }} aria-hidden />}
      {markers.map((m) => (
        <span
          key={m.ply}
          className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-eval-black"
          style={{ left: `${xPct(m.ply)}%`, top: `${Math.min(92, Math.max(8, H - (curve[m.ply] ?? 50)))}%`, background: MOVE_CLASS_META[m.cls].color }}
          aria-hidden
        />
      ))}
    </div>
  );
}
