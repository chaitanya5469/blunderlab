import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '../../lib/cn';

interface ReviewControlsProps {
  canPrev: boolean;
  canNext: boolean;
  atStart: boolean;
  atEnd: boolean;
  onFirst: () => void;
  onPrev: () => void;
  onNext: () => void;
  onLast: () => void;
  /** Leaves a variation (Escape); omitted on the game line. */
  onExit?: () => void;
  /** Inside a variation the buttons walk the variation. */
  inVariation?: boolean;
  className?: string;
}

const btn =
  'grid h-12 flex-1 place-items-center rounded-control bg-surface-2 text-fg transition-colors hover:bg-surface-3 active:bg-surface-3 disabled:text-fg-subtle disabled:opacity-50';

/**
 * First / previous / next / last, pinned to the bottom of the screen within thumb reach,
 * plus arrow keys, Home/End and Escape (leave a variation) on desktop.
 */
export function ReviewControls({ canPrev, canNext, atStart, atEnd, onFirst, onPrev, onNext, onLast, onExit, inVariation, className }: ReviewControlsProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target;
      if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || e.altKey || e.ctrlKey || e.metaKey) return;
      if (document.querySelector('[role="dialog"]')) return; // e.g. the promotion picker
      const action =
        e.key === 'ArrowLeft'
          ? canPrev && onPrev
          : e.key === 'ArrowRight'
            ? canNext && onNext
            : e.key === 'Home'
              ? !atStart && onFirst
              : e.key === 'End'
                ? !atEnd && onLast
                : e.key === 'Escape'
                  ? onExit
                  : undefined;
      if (action === undefined) return;
      e.preventDefault();
      if (action) action();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [canPrev, canNext, atStart, atEnd, onFirst, onPrev, onNext, onLast, onExit]);

  const where = inVariation ? 'in variation' : 'move';
  return (
    <div
      className={cn(
        'sticky bottom-0 z-20 -mx-gutter bg-gradient-to-t from-ink from-70% to-transparent px-gutter pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]',
        className,
      )}
    >
      <div className="flex gap-1.5">
        <button type="button" className={btn} aria-label={`First ${where}`} disabled={atStart} onClick={onFirst}>
          <ChevronFirst className="size-5" />
        </button>
        <button type="button" className={`${btn} flex-[1.6]`} aria-label={`Previous ${where}`} disabled={!canPrev} onClick={onPrev}>
          <ChevronLeft className="size-6" />
        </button>
        <button type="button" className={`${btn} flex-[1.6]`} aria-label={`Next ${where}`} disabled={!canNext} onClick={onNext}>
          <ChevronRight className="size-6" />
        </button>
        <button type="button" className={btn} aria-label={`Last ${where}`} disabled={atEnd} onClick={onLast}>
          <ChevronLast className="size-5" />
        </button>
      </div>
    </div>
  );
}
