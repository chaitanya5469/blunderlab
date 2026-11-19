import { Lock } from 'lucide-react';
import { cn } from '../../lib/cn';
import { BADGE_TONE, type BadgeDef } from './model/badges';

const SIZES = {
  xs: { box: 'size-6 rounded-[8px]', icon: 'size-3.5', lock: 'size-2.5' },
  sm: { box: 'size-12 rounded-[15px]', icon: 'size-5.5', lock: 'size-2.5' },
  md: { box: 'size-14 rounded-[18px]', icon: 'size-6', lock: 'size-3' },
  lg: { box: 'size-20 rounded-[24px]', icon: 'size-9', lock: 'size-4' },
} as const;

/** A badge's icon tile: tinted when earned, a quiet outline with a lock when not. */
export function BadgeIcon({ badge, locked, size = 'md', className }: { badge: BadgeDef; locked?: boolean; size?: keyof typeof SIZES; className?: string }) {
  const Icon = badge.icon;
  const s = SIZES[size];
  return (
    <span
      className={cn(
        'relative grid shrink-0 place-items-center',
        s.box,
        locked ? 'border border-dashed border-line-strong bg-surface-2 text-fg-subtle/70' : cn(BADGE_TONE[badge.tone].tile, 'edge-current'),
        className,
      )}
      style={
        locked || size === 'xs'
          ? undefined
          : { boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.12), 0 10px 24px -14px ${BADGE_TONE[badge.tone].glow}` }
      }
      aria-hidden
    >
      <Icon className={s.icon} strokeWidth={size === 'xs' ? 2.25 : 1.9} />
      {locked && size !== 'xs' && (
        <span className="absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full border border-line bg-surface-3 text-fg-subtle">
          <Lock className={s.lock} />
        </span>
      )}
    </span>
  );
}
