import { motion } from 'motion/react';
import { formatScore, winPercent } from '../../lib/evaluation';
import { cn } from '../../lib/cn';
import type { Color, Score } from '../../lib/types';

/** Vertical win-probability bar beside the board. `orientation` is the colour at the bottom. */
export function EvalBar({ score, orientation, className }: { score: Score | null; orientation: Color; className?: string }) {
  const white = score ? winPercent(score) : 50;
  const label = score ? formatScore(score).replace('+', '') : '';
  const whiteAhead = white >= 50;
  const whiteAtBottom = orientation === 'white';
  const labelAtBottom = whiteAtBottom === whiteAhead;

  return (
    <div
      className={cn('relative w-5 overflow-hidden rounded-[6px] bg-eval-black ring-1 ring-white/5', className)}
      role="img"
      aria-label={score ? `Evaluation ${formatScore(score)}` : 'No evaluation yet'}
    >
      <motion.div
        className={cn('absolute inset-x-0 bg-eval-white', whiteAtBottom ? 'bottom-0' : 'top-0')}
        initial={false}
        animate={{ height: `${white}%` }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="absolute inset-x-0 top-1/2 h-px bg-accent/60" aria-hidden />
      {score && (
        <span
          className={cn(
            'absolute inset-x-0 text-center text-[9px] leading-none font-bold tracking-tight tnum',
            labelAtBottom ? 'bottom-1.5' : 'top-1.5',
            whiteAhead ? 'text-eval-black' : 'text-eval-white',
          )}
          aria-hidden
        >
          {label}
        </span>
      )}
    </div>
  );
}
