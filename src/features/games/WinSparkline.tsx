import { useId } from 'react';
import { cn } from '../../lib/cn';
import type { Color } from '../../lib/types';

const W = 64;
const H = 26;
const PAD = 2;
const MAX_POINTS = 48;

/** Downsamples to at most MAX_POINTS, keeping the first and last positions. */
function sample(curve: number[]): number[] {
  if (curve.length <= MAX_POINTS) return curve;
  const out: number[] = [];
  const step = (curve.length - 1) / (MAX_POINTS - 1);
  for (let i = 0; i < MAX_POINTS; i++) out.push(curve[Math.round(i * step)]!);
  return out;
}

interface WinSparklineProps {
  /** White-POV win% per position (analysis.winCurve). */
  curve: number[];
  ownerColor: Color;
  className?: string;
}

/**
 * How the game went from the owner's side: the win-probability line, with the area
 * above even tinted green and below tinted red.
 */
export function WinSparkline({ curve, ownerColor, className }: WinSparklineProps) {
  // useId output can contain characters that are not valid inside url(#…).
  const id = `spark${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const pts = sample(curve.length ? curve : [50]).map((w) => Math.max(0, Math.min(100, ownerColor === 'white' ? w : 100 - w)));
  const n = Math.max(1, pts.length - 1);
  const x = (i: number) => (i / n) * W;
  const y = (v: number) => PAD + ((100 - v) / 100) * (H - PAD * 2);
  const mid = y(50);
  const line = pts.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${W} ${mid} L0 ${mid} Z`;
  const last = pts[pts.length - 1]!;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className={cn('shrink-0 overflow-visible', className)} aria-hidden>
      <defs>
        <clipPath id={`${id}-up`}>
          <rect x="0" y="0" width={W} height={mid} />
        </clipPath>
        <clipPath id={`${id}-down`}>
          <rect x="0" y={mid} width={W} height={H - mid} />
        </clipPath>
      </defs>
      <line x1="0" x2={W} y1={mid} y2={mid} stroke="var(--color-line-strong)" strokeWidth="1" strokeDasharray="2 2" />
      <path d={area} fill="var(--color-best)" fillOpacity="0.28" clipPath={`url(#${id}-up)`} />
      <path d={area} fill="var(--color-blunder)" fillOpacity="0.28" clipPath={`url(#${id}-down)`} />
      <path d={line} fill="none" stroke="var(--color-fg)" strokeOpacity="0.85" strokeWidth="1.25" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={W} cy={y(last)} r="2" fill={last >= 50 ? 'var(--color-best)' : 'var(--color-blunder)'} stroke="var(--color-surface-1)" strokeWidth="1" />
    </svg>
  );
}

/** Placeholder with the sparkline's footprint, for games not analysed yet. */
export function PendingSparkline({ active, className }: { active?: boolean; className?: string }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className={cn('shrink-0', active && 'animate-pulse', className)} aria-hidden>
      <line
        x1="0"
        x2={W}
        y1={H / 2}
        y2={H / 2}
        stroke={active ? 'var(--color-accent)' : 'var(--color-line-strong)'}
        strokeWidth="1.25"
        strokeDasharray="3 3"
        strokeLinecap="round"
      />
    </svg>
  );
}
