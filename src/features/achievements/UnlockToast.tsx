import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import { useStore } from '../../lib/store';
import { guideStore } from '../guide/launch';
import { BadgeIcon } from './BadgeIcon';
import { BADGE_TONE, badgeById } from './model/badges';
import { shiftUnlock, unlockQueue } from './model/service';

const SHOW_MS = 4800;

/** Celebrates each newly earned badge, one at a time, at the top of the screen. Held during the walkthrough. */
export function UnlockToast() {
  const { ids } = useStore(unlockQueue);
  const { walkthrough } = useStore(guideStore);
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const id = walkthrough ? undefined : ids[0];
  const badge = id ? badgeById.get(id) : undefined;

  useEffect(() => {
    if (!id) return;
    if (!badge) {
      shiftUnlock();
      return;
    }
    const t = window.setTimeout(shiftUnlock, SHOW_MS);
    return () => window.clearTimeout(t);
  }, [id, badge]);

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[55] mx-auto max-w-app px-gutter pt-[calc(env(safe-area-inset-top)+0.75rem)]">
      <AnimatePresence>
        {badge && (
          <motion.div
            key={badge.id}
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="pointer-events-auto relative overflow-hidden rounded-card border bg-surface-2 shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_20px_50px_-14px_rgb(0_0_0/0.85)]"
            style={{ borderColor: `color-mix(in oklab, ${BADGE_TONE[badge.tone].glow} 40%, var(--color-line))` }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: `radial-gradient(120% 140% at 0% 50%, color-mix(in oklab, ${BADGE_TONE[badge.tone].glow} 22%, transparent), transparent 60%)` }}
            />
            {!reduce && (
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-1/3 bg-[linear-gradient(100deg,transparent,rgb(255_255_255/0.09),transparent)]"
                initial={{ left: '-40%' }}
                animate={{ left: '120%' }}
                transition={{ duration: 1.1, delay: 0.25, ease: 'easeOut' }}
              />
            )}
            <div className="relative flex items-center gap-3 p-3 pr-1">
              <button
                type="button"
                onClick={() => {
                  shiftUnlock();
                  navigate('/achievements');
                }}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <motion.span
                  initial={reduce ? false : { rotate: -18, scale: 0.6 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1 }}
                >
                  <BadgeIcon badge={badge} size="sm" />
                </motion.span>
                <span className="min-w-0 flex-1">
                  <span className="block text-2xs font-semibold tracking-[0.12em] text-fg-subtle uppercase">Badge unlocked</span>
                  <span className="block truncate font-display text-lg leading-tight font-semibold">{badge.name}</span>
                  <span className="block truncate text-xs text-fg-muted">{badge.description}</span>
                </span>
              </button>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={shiftUnlock}
                className="grid size-11 shrink-0 place-items-center rounded-full text-fg-subtle hover:text-fg active:bg-surface-3"
              >
                <X className="size-4.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
