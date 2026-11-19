import { cn } from '../../lib/cn';

/** BlunderLab mark: a rook-like flask silhouette in the accent colour. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('size-9', className)} aria-hidden>
      <rect width="64" height="64" rx="18" fill="var(--color-surface-2)" stroke="var(--color-line)" />
      <path d="M22 47h20v-3.5H22zM25.5 41h13l-1.6-11.5h3.3l-2.4-7h-2.6l-1.7-3.5h-4l-1.7 3.5h-2.6l-2.4 7h3.3z" fill="var(--color-accent)" />
      <circle cx="32" cy="34" r="2.2" fill="var(--color-surface-2)" />
    </svg>
  );
}
