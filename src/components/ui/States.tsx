import type { ReactNode } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from './Button';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
  /** Medallion tint; neutral by default. */
  tone?: 'neutral' | 'accent' | 'best' | 'blunder';
}

const medallionTone = {
  neutral: 'text-fg-muted',
  accent: 'text-accent-strong',
  best: 'text-best',
  blunder: 'text-blunder',
} as const;

const haloTone = {
  neutral: 'bg-fg/[0.05]',
  accent: 'bg-accent/14',
  best: 'bg-best/12',
  blunder: 'bg-blunder/12',
} as const;

/** Designed empty state: icon medallion, title, one line of guidance, optional action. */
export function EmptyState({ icon, title, body, action, className, tone = 'neutral' }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-10 text-center', className)}>
      <div className="relative mb-5">
        <div className={cn('absolute -inset-5 rounded-full blur-xl', haloTone[tone])} aria-hidden />
        <div className={cn('surface-raised-2 relative grid size-14 place-items-center rounded-2xl [&_svg]:size-6', medallionTone[tone])}>{icon}</div>
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {body && <p className="mt-1.5 max-w-[30ch] text-sm text-fg-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Inline error with an optional retry. */
export function ErrorState({ message, onRetry, className }: { message: string; onRetry?: () => void; className?: string }) {
  return (
    <div
      role="alert"
      className={cn('flex items-start gap-3 rounded-card border border-blunder/25 bg-blunder/8 p-3.5 text-sm', className)}
    >
      <AlertTriangle className="mt-0.5 size-4.5 shrink-0 text-blunder" aria-hidden />
      <p className="min-w-0 flex-1 text-fg-muted">{message}</p>
      {onRetry && (
        <Button size="md" variant="ghost" className="-my-2 -mr-2 h-11 text-fg" onClick={onRetry} icon={<RotateCw className="size-4" />}>
          Retry
        </Button>
      )}
    </div>
  );
}
