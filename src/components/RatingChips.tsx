import { Bolt, Rabbit, Sun, Timer, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';
import type { Ratings } from '../lib/types';

const KINDS: { key: keyof Ratings; label: string; icon: LucideIcon }[] = [
  { key: 'rapid', label: 'Rapid', icon: Timer },
  { key: 'blitz', label: 'Blitz', icon: Bolt },
  { key: 'bullet', label: 'Bullet', icon: Rabbit },
  { key: 'daily', label: 'Daily', icon: Sun },
];

/** Compact rating row; only time classes the player has a rating in. */
export function RatingChips({ ratings, className }: { ratings: Ratings; className?: string }) {
  const present = KINDS.filter((k) => ratings[k.key] !== undefined);
  if (!present.length) return <p className={cn('text-sm text-fg-subtle', className)}>No ratings yet</p>;
  return (
    <div className={cn('grid gap-2', className)} style={{ gridTemplateColumns: `repeat(${present.length}, minmax(0, 1fr))` }}>
      {present.map(({ key, label, icon: Icon }) => (
        <div key={key} className="min-w-0 rounded-control bg-surface-2 px-2.5 py-2">
          <div className="flex items-center gap-1 text-2xs text-fg-subtle">
            <Icon className="size-3" aria-hidden />
            {label}
          </div>
          <div className="mt-0.5 font-display text-lg leading-tight font-semibold tnum">{ratings[key]}</div>
        </div>
      ))}
    </div>
  );
}
