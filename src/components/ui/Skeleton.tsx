import { cn } from '../../lib/cn';

/** Shimmering placeholder block. Size it with className. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('rounded-chip bg-surface-2', className)}
      style={{
        backgroundImage: 'linear-gradient(90deg, transparent 0%, rgb(255 255 255 / 0.045) 50%, transparent 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.6s ease-in-out infinite',
      }}
    />
  );
}
