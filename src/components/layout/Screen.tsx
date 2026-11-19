import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * A full-height, non-scrolling screen (the viewport below the status bar). For screens with a
 * board: the page itself never scrolls, so a swipe on the board can't turn into a page scroll.
 * Children lay out in a flex column; give the stretchy part `flex-1 min-h-0`.
 */
export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('relative flex h-[calc(100dvh-env(safe-area-inset-top))] flex-col overflow-hidden px-gutter', className)}>{children}</div>;
}

/** Bottom action bar of a `Screen`, clear of the gesture/navigation bar. */
export function ScreenFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('shrink-0 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]', className)}>{children}</div>;
}
