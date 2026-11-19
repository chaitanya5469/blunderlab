import { useCallback, useEffect, useLayoutEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Flame, GraduationCap, ListChecks, Puzzle, RefreshCw, Settings, Sparkles, UserRound, type LucideIcon } from 'lucide-react';
import { Button } from '../../components/ui';
import { cn } from '../../lib/cn';
import { useStore } from '../../lib/store';
import { finishWalkthrough, guideStore } from './launch';

interface Step {
  /** `data-guide` value of the element to highlight; null for a centred card. */
  target: string | null;
  icon: LucideIcon;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    target: null,
    icon: Sparkles,
    title: 'Welcome to BlunderLab',
    body: 'A quick tour of how BlunderLab turns your own games into training. It takes under a minute.',
  },
  {
    target: 'activity',
    icon: RefreshCw,
    title: 'Sync and analysis run by themselves',
    body: 'Your Chess.com games sync automatically. Stockfish then reviews each one on this phone in the background. Pause or resume it here.',
  },
  {
    target: 'tab-games',
    icon: ListChecks,
    title: 'Review every game',
    body: 'Open a game to see each move rated, the eval graph and your accuracy. Play your own moves on the board to try ideas with the engine.',
  },
  {
    target: 'tab-puzzles',
    icon: Puzzle,
    title: 'Two kinds of puzzles',
    body: '"From your games" turns your own mistakes into puzzles that return until you master them. "Lichess" gives rated puzzles at your level and a daily puzzle.',
  },
  {
    target: 'tab-learn',
    icon: GraduationCap,
    title: 'Learn openings and traps',
    body: 'Learn each line with arrows, then practise it from memory. Lines come back for review so they stick.',
  },
  {
    target: 'streak',
    icon: Flame,
    title: 'Streaks, titles and badges',
    body: 'Solve a puzzle or play a lesson line each day to grow your streak (one rest day a week is forgiven). Practice earns XP for titles and badges. Tap the card to see them all, or swipe for your form and puzzles.',
  },
  {
    target: 'profile',
    icon: UserRound,
    title: 'Your profile',
    body: 'Your Chess.com ratings, puzzle ratings, record, average game rating and recent games, all in one place.',
  },
  {
    target: 'settings',
    icon: Settings,
    title: 'Make it yours',
    body: 'Settings has analysis depth, re-sync, chess tips and a button to replay this tour.',
  },
];

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 6;

function measure(target: string | null): Rect | null {
  if (!target) return null;
  const el = document.querySelector(`[data-guide="${target}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 };
}

/**
 * First-run coach marks: a dimmed screen with a spotlight on the real UI and a card that
 * explains it. Shown over Home only; skipping or finishing marks it done for good.
 */
export function Walkthrough({ onHome }: { onHome: boolean }) {
  const { walkthrough, step } = useStore(guideStore);
  const reduce = useReducedMotion();
  const [rect, setRect] = useState<Rect | null>(null);
  const [vh, setVh] = useState(() => window.innerHeight);
  const active = walkthrough && onHome;
  const current = STEPS[step]!;

  const update = useCallback(() => {
    setRect(measure(current.target));
    setVh(window.innerHeight);
  }, [current.target]);

  // Bring the target into view, then follow it while scrolling settles.
  useLayoutEffect(() => {
    if (!active) return;
    const el = current.target ? document.querySelector(`[data-guide="${current.target}"]`) : null;
    if (el && !el.closest('nav')) el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    update();
    let frame = 0;
    const until = performance.now() + 700;
    const tick = () => {
      update();
      if (performance.now() < until) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update);
    };
  }, [active, current.target, reduce, update]);

  const go = useCallback((delta: number) => {
    const next = guideStore.get().step + delta;
    if (next >= STEPS.length) finishWalkthrough();
    else if (next >= 0) guideStore.set({ step: next });
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finishWalkthrough();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, go]);

  // The card sits on whichever side of the spotlight has more room.
  const below = rect ? vh - (rect.top + rect.height) > rect.top : false;
  const cardPos: CSSProperties = !rect
    ? { top: '50%', translate: '-50% -50%' }
    : below
      ? { top: `max(calc(env(safe-area-inset-top) + 12px), ${rect.top + rect.height + 12}px)` }
      : { bottom: `max(calc(env(safe-area-inset-bottom) + 12px), ${vh - rect.top + 12}px)` };
  const Icon = current.icon;
  const last = step === STEPS.length - 1;
  const spring = reduce ? { duration: 0 } : { type: 'spring' as const, stiffness: 380, damping: 36 };

  return createPortal(
    <AnimatePresence>
      {active && (
        <motion.div
          key="guide"
          className="fixed inset-0 z-[60]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Catches taps so the app underneath stays still during the tour. */}
          <div className="absolute inset-0" aria-hidden />
          {rect ? (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute rounded-[20px] shadow-[0_0_0_9999px_rgb(7_8_11/0.78)]"
              initial={false}
              animate={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
              transition={spring}
            >
              <span className="absolute inset-0 rounded-[20px] ring-2 ring-accent/70" />
              {!reduce && (
                <motion.span
                  className="absolute inset-0 rounded-[20px] ring-2 ring-accent/50"
                  animate={{ opacity: [0.8, 0], scale: [1, 1.08] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                />
              )}
            </motion.div>
          ) : (
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-ink/80" />
          )}

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="guide-title"
            aria-describedby="guide-body"
            className="absolute left-1/2 w-[calc(min(100vw,var(--container-app))-2rem)] -translate-x-1/2"
            style={cardPos}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ opacity: 0, y: below ? -6 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-card border border-line bg-surface-2 bg-[linear-gradient(180deg,rgb(255_255_255/0.05),rgb(255_255_255/0)_120px)] p-4 shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_24px_60px_-12px_rgb(0_0_0/0.8)]"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-accent-soft text-accent-strong edge-current">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xs font-semibold tracking-[0.12em] text-fg-subtle uppercase tnum">
                      {step + 1} of {STEPS.length}
                    </p>
                    <h2 id="guide-title" className="mt-0.5 text-lg leading-snug font-semibold">
                      {current.title}
                    </h2>
                  </div>
                </div>
                <p id="guide-body" className="mt-2.5 text-sm leading-relaxed text-fg-muted">
                  {current.body}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex flex-1 items-center gap-1" aria-hidden>
                    {STEPS.map((_, i) => (
                      <span key={i} className={cn('h-1.5 rounded-full transition-all', i === step ? 'w-4 bg-accent' : 'w-1.5 bg-line-strong')} />
                    ))}
                  </div>
                  {!last && (
                    <Button variant="ghost" className="px-3" onClick={finishWalkthrough}>
                      Skip
                    </Button>
                  )}
                  {step > 0 && (
                    <Button className="px-3" onClick={() => go(-1)}>
                      Back
                    </Button>
                  )}
                  <Button autoFocus variant="primary" onClick={() => go(1)}>
                    {last ? 'Done' : step === 0 ? 'Show me' : 'Next'}
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
