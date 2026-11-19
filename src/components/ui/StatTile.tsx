import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { AnimatedNumber } from './AnimatedNumber';

interface StatTileProps {
  label: string;
  /** Numeric values animate; pass a string for preformatted values or '—'. */
  value: number | string;
  decimals?: number;
  suffix?: string;
  hint?: ReactNode;
  /** Text colour class for the value, e.g. 'text-blunder'. */
  valueClassName?: string;
  className?: string;
  /** 'tile' (default) sits on its own inset surface; 'plain' has no surface, for strips and dividers. */
  variant?: 'tile' | 'plain';
}

/**
 * A row of stat tiles: three across on a phone, wrapping to 2 + 1 when the system text size is
 * large enough that three would cut their labels off (the basis is in `em`, so it follows text size).
 */
export function StatTileGroup({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('flex flex-wrap gap-2 *:flex-1 *:basis-[5.75em]', className)}>{children}</div>;
}

export function StatTile({ label, value, decimals = 0, suffix, hint, valueClassName, className, variant = 'tile' }: StatTileProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', variant === 'tile' && 'surface-inset rounded-[14px] px-3.5 py-3', className)}>
      <span className="truncate text-2xs font-medium text-fg-subtle">{label}</span>
      <span className={cn('font-display text-[1.65rem] leading-none font-semibold tracking-[-0.03em] tnum', valueClassName)}>
        {typeof value === 'number' ? <AnimatedNumber value={value} decimals={decimals} /> : value}
        {suffix && <span className="ml-0.5 text-base font-medium tracking-normal text-fg-subtle">{suffix}</span>}
      </span>
      {hint && <span className="-mt-0.5 truncate text-2xs text-fg-subtle">{hint}</span>}
    </div>
  );
}
