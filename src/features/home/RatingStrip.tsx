import { Bolt, Rabbit, Sun, Timer, type LucideIcon } from 'lucide-react';
import { Card } from '../../components/ui';
import { cn } from '../../lib/cn';
import type { Ratings } from '../../lib/types';

const KINDS: { key: keyof Ratings; label: string; icon: LucideIcon }[] = [
  { key: 'rapid', label: 'Rapid', icon: Timer },
  { key: 'blitz', label: 'Blitz', icon: Bolt },
  { key: 'bullet', label: 'Bullet', icon: Rabbit },
  { key: 'daily', label: 'Daily', icon: Sun },
];

/**
 * Columns per number of ratings. Four columns become 2x2 when the strip is narrow for its text
 * size (large system text on a small phone), so labels and ratings are never cut off.
 */
const COLUMNS = ['grid-cols-1', 'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4 @max-[19em]:grid-cols-2'];

/** Ratings as one quiet strip with hairline dividers (Profile's version of RatingChips). */
export function RatingStrip({ ratings }: { ratings: Ratings }) {
  const present = KINDS.filter((k) => ratings[k.key] !== undefined);
  if (!present.length) return <p className="px-1 text-sm text-fg-subtle">No ratings yet</p>;
  return (
    <div className="@container">
      {/* Hairlines are the 1px gaps showing the card's line colour between cells (works when wrapped). */}
      <Card variant="base" padded={false} className={cn('grid gap-px overflow-hidden bg-line-soft', COLUMNS[present.length])}>
        {present.map(({ key, label, icon: Icon }) => (
          <div key={key} className="min-w-0 bg-surface-1 px-3 py-2.5">
            <div className="flex items-center gap-1 text-2xs text-fg-subtle">
              <Icon className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{label}</span>
            </div>
            <div className="mt-0.5 font-display text-xl leading-tight font-semibold tracking-[-0.02em] tnum">{ratings[key]}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}
