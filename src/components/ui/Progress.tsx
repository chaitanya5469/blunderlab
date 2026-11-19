import { motion } from 'motion/react';
import { cn } from '../../lib/cn';

interface ProgressProps {
  /** 0..1; omit for an indeterminate bar. */
  value?: number;
  className?: string;
  barClassName?: string;
  label?: string;
}

/** The bar's own sheen, layered over whatever colour `barClassName` sets. */
const sheen = 'bg-[linear-gradient(180deg,rgb(255_255_255/0.28),rgb(255_255_255/0)_75%)]';

export function Progress({ value, className, barClassName, label }: ProgressProps) {
  const indeterminate = value === undefined;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(value * 100)}
      className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-surface-3 shadow-recessed', className)}
    >
      {indeterminate ? (
        <motion.div
          key="indeterminate"
          className={cn('absolute inset-y-0 w-1/3 rounded-full bg-accent', sheen, barClassName)}
          animate={{ left: ['-35%', '100%'] }}
          transition={{ duration: 1.4, ease: 'easeInOut', repeat: Infinity }}
        />
      ) : (
        <motion.div
          key="determinate"
          className={cn('h-full rounded-full bg-accent', sheen, barClassName)}
          initial={false}
          animate={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
    </div>
  );
}
