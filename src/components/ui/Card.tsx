import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * Surface level (see the surface classes in styles/index.css):
 * - 'base': quiet, for lists and dense rows.
 * - 'raised': grouped content. The default.
 * - 'feature': the one key thing on a screen, lit with a tint.
 */
export type CardVariant = 'base' | 'raised' | 'feature';
export type CardTint = 'accent' | 'best' | 'win' | 'loss' | 'draw' | 'blunder' | 'mistake' | 'inaccuracy' | 'miss' | 'lichess';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Elevation layer: 1 sits on the canvas, 2 is raised (e.g. inside a sheet). */
  level?: 1 | 2;
  padded?: boolean;
  /** Surface treatment; defaults to 'raised'. */
  variant?: CardVariant;
  /** Tint colour for the 'feature' variant (default accent). */
  tint?: CardTint;
}

export function Card({ level = 1, padded = true, variant = 'raised', tint, className, ...rest }: CardProps) {
  const surface =
    variant === 'feature'
      ? cn('surface-feature', `tint-${tint ?? 'accent'}`)
      : variant === 'base'
        ? 'surface-base'
        : level === 2
          ? 'surface-raised-2'
          : 'surface-raised';
  return <div className={cn('rounded-card', surface, padded && 'p-4', className)} {...rest} />;
}

interface SectionHeaderProps {
  title: ReactNode;
  action?: ReactNode;
  /** Optional quiet count or note shown after the title. */
  meta?: ReactNode;
  className?: string;
}

/** Small uppercase section label with an optional trailing action. */
export function SectionHeader({ title, action, meta, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-2.5 flex min-h-8 items-center justify-between gap-3 px-1', className)}>
      <h2 className="flex min-w-0 items-baseline gap-2 font-sans text-2xs font-semibold tracking-[0.14em] text-fg-subtle uppercase">
        <span className="truncate">{title}</span>
        {meta !== undefined && <span className="shrink-0 font-medium tracking-normal normal-case tnum">{meta}</span>}
      </h2>
      {action}
    </div>
  );
}
