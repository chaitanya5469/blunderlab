import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import type { GameResult, MoveClass } from '../../lib/types';

export type BadgeTone = 'neutral' | 'accent' | 'lichess' | MoveClass | GameResult;

/** Tone -> classes. Uses the semantic tokens so meaning is consistent everywhere. */
export const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-surface-3 text-fg-muted',
  accent: 'bg-accent-soft text-accent-strong',
  lichess: 'bg-lichess-soft text-lichess',
  brilliant: 'bg-brilliant/14 text-brilliant',
  great: 'bg-great/14 text-great',
  best: 'bg-best/14 text-best',
  excellent: 'bg-excellent/14 text-excellent',
  book: 'bg-book/14 text-book',
  good: 'bg-good/14 text-good',
  inaccuracy: 'bg-inaccuracy/14 text-inaccuracy',
  mistake: 'bg-mistake/14 text-mistake',
  miss: 'bg-miss/14 text-miss',
  blunder: 'bg-blunder/14 text-blunder',
  win: 'bg-win/14 text-win',
  draw: 'bg-draw/14 text-draw',
  loss: 'bg-loss/14 text-loss',
};

interface BadgeProps {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
  /** 'md' (default, 24px) or 'sm' (20px) for dense rows. */
  size?: 'sm' | 'md';
}

export function Badge({ tone = 'neutral', size = 'md', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-chip font-semibold tnum whitespace-nowrap edge-current',
        // min-h, not h: grows instead of clipping when the system text size is enlarged.
        size === 'sm' ? 'min-h-5 px-1.5 text-[0.625rem] leading-none' : 'min-h-6 px-2 text-2xs',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
