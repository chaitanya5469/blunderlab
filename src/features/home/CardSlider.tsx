import { Children, useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { AnimatePresence, animate, motion, useReducedMotion } from 'motion/react';
import { ChevronsRight } from 'lucide-react';
import { useStore } from '../../lib/store';
import { guideStore, tipStore } from '../guide/launch';
import { cn } from '../../lib/cn';

interface CardSliderProps {
  /** One slide per child. */
  children: ReactNode;
  /** Accessible name of the carousel. */
  label: string;
  /** Names for the page dots, one per slide. */
  slideLabels: string[];
  className?: string;
}

/** Pixels a mouse must move before a press counts as a drag (and its click is swallowed). */
const DRAG_THRESHOLD = 6;

const HINT_KEY = 'blunderlab:swipe-hint:v1';
function hintSeen(): boolean {
  try {
    return localStorage.getItem(HINT_KEY) === '1';
  } catch {
    return false;
  }
}
function markHintSeen() {
  try {
    localStorage.setItem(HINT_KEY, '1');
  } catch {
    /* storage unavailable: the hint may replay next launch */
  }
}

/**
 * Horizontal card slider: native scroll-snap, one card per view with a peek of the next,
 * page dots. Touch uses native scrolling; a mouse can drag (or use the wheel / the dots).
 * The track bleeds into the page gutter so the peek reaches the screen edge.
 */
export function CardSlider({ children, label, slideLabels, className }: CardSliderProps) {
  const slides = Children.toArray(children);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const { walkthrough } = useStore(guideStore);
  const { open: tipOpen } = useStore(tipStore);
  const [hinting, setHinting] = useState(false);
  const hintDone = useRef(hintSeen());

  // One-time nudge: the cards slide left to show the next one and spring back. Waits for the walkthrough.
  useEffect(() => {
    if (hintDone.current || walkthrough || tipOpen || reduce || slides.length < 2) return;
    const el = track.current;
    if (!el) return;
    let controls: ReturnType<typeof animate> | undefined;
    const timer = window.setTimeout(() => {
      hintDone.current = true;
      markHintSeen();
      setHinting(true);
      const set = (v: number) => el.style.setProperty('--nudge', `${v}px`);
      controls = animate(0, -52, {
        type: 'spring',
        stiffness: 180,
        damping: 16,
        onUpdate: set,
        onComplete: () => {
          controls = animate(-52, 0, { type: 'spring', stiffness: 220, damping: 18, onUpdate: set, onComplete: () => el.style.removeProperty('--nudge') });
        },
      });
      window.setTimeout(() => setHinting(false), 2200);
    }, 900);
    return () => {
      window.clearTimeout(timer);
      controls?.stop();
      el.style.removeProperty('--nudge');
    };
  }, [walkthrough, tipOpen, reduce, slides.length]);

  /** The user swiped (or tried to) first: the hint is no longer needed. */
  const dismissHint = () => {
    if (!hintDone.current) {
      hintDone.current = true;
      markHintSeen();
    }
    setHinting(false);
  };

  const slideStep = useCallback(() => {
    const el = track.current;
    const first = el?.children[0] as HTMLElement | undefined;
    const second = el?.children[1] as HTMLElement | undefined;
    if (!first) return 1;
    return second ? second.offsetLeft - first.offsetLeft : first.offsetWidth;
  }, []);

  const onScroll = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / slideStep());
    if (i > 0) dismissHint();
    setIndex(Math.max(0, Math.min(slides.length - 1, i)));
  }, [slideStep, slides.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = useCallback(
    (i: number, smooth = true) => {
      const el = track.current;
      if (!el) return;
      el.scrollTo({ left: i * slideStep(), behavior: smooth && !reduce ? 'smooth' : 'auto' });
    },
    [reduce, slideStep],
  );

  useEffect(() => {
    window.addEventListener('resize', onScroll);
    return () => window.removeEventListener('resize', onScroll);
  }, [onScroll]);

  // Mouse drag (touch and pen scroll natively). Snap is paused while dragging, then the nearest card is settled on.
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !track.current) return;
    drag.current = { x: e.clientX, left: track.current.scrollLeft, moved: false };
  };
  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    const el = track.current;
    if (!d || !el) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) < DRAG_THRESHOLD) return;
    if (!d.moved) {
      d.moved = true;
      el.style.scrollSnapType = 'none';
      el.setPointerCapture(e.pointerId);
    }
    el.scrollLeft = d.left - dx;
  };
  const endDrag = (e: PointerEvent) => {
    const d = drag.current;
    const el = track.current;
    drag.current = null;
    if (!d?.moved || !el) return;
    suppressClick.current = true;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    const dx = e.clientX - d.x;
    const from = Math.round(d.left / slideStep());
    // A short flick is enough to move one card.
    const target = Math.abs(dx) > 40 ? from + (dx < 0 ? 1 : -1) : from;
    const i = Math.max(0, Math.min(slides.length - 1, target));
    goTo(i);
    // Restore snapping once the smooth scroll has had time to land.
    window.setTimeout(() => {
      el.style.scrollSnapType = '';
    }, reduce ? 0 : 400);
  };

  return (
    <section aria-roledescription="carousel" aria-label={label} className={cn('relative', className)}>
      <div
        ref={track}
        onScroll={onScroll}
        onPointerDown={(e) => {
          dismissHint();
          onPointerDown(e);
        }}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            e.preventDefault();
            e.stopPropagation();
            suppressClick.current = false;
          }
        }}
        onDragStart={(e) => e.preventDefault()}
        className="no-scrollbar -mx-gutter flex snap-x snap-mandatory scroll-px-gutter gap-3 overflow-x-auto overscroll-x-contain px-gutter pt-1.5 pb-1.5"
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}: ${slideLabels[i] ?? ''}`}
            className="flex w-[88%] shrink-0 translate-x-(--nudge,0px) snap-start snap-always flex-col *:flex-1"
          >
            {slide}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {hinting && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="pointer-events-none absolute top-1/2 right-3 z-10 -translate-y-1/2"
          >
            <span className="flex items-center gap-1 rounded-full border border-line-strong/80 bg-ink/80 py-1.5 pr-2 pl-3 text-xs font-semibold text-fg shadow-control backdrop-blur">
              Swipe <ChevronsRight className="size-4 text-accent-strong" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-2 flex justify-center gap-0.5">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Show ${slideLabels[i] ?? `card ${i + 1}`}`}
            aria-current={i === index ? 'true' : undefined}
            className="grid h-6 w-5 place-items-center rounded-full"
          >
            <span
              className={cn(
                'h-1.5 rounded-full transition-[width,background-color] duration-200 motion-reduce:transition-none',
                i === index ? 'w-4 bg-accent' : 'w-1.5 bg-line-strong',
              )}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
