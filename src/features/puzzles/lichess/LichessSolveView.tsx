import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, Eye, Lightbulb } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui';
import { cn } from '../../../lib/cn';
import type { LichessOrigin, LichessPuzzle, PuzzleResult } from '../../../lib/types';
import { SourceMark } from '../home/SourceTabs';
import { lichessTheme } from '../../coach/engine';
import { PuzzleCoach } from '../../coach/PuzzleCoach';
import { FeedbackBar } from '../solve/FeedbackBar';
import { PuzzleBoard } from '../solve/PuzzleBoard';
import { SuccessBeat } from '../solve/SuccessBeat';
import { usePuzzleSolver } from '../solve/usePuzzleSolver';
import { ratingChange, recordLichessAttempt, type LichessAttemptInput } from './model/rating';
import { lichessUrl, toSolvable } from './model/solvable';
import { themeLabel, visibleThemes } from './model/themes';

const BEAT_MS = 1100;
const BEAT_ASSISTED_MS = 1500;

interface LichessSolveViewProps {
  puzzle: LichessPuzzle;
  origin: LichessOrigin;
  title: ReactNode;
  backTo: string;
  progress?: ReactNode;
  /** False for a replay (e.g. the daily puzzle played again): nothing is stored or rated. */
  rated?: boolean;
  /** Shown once the puzzle is over (after a solve only when not auto-advancing). */
  actions: ReactNode;
  /** When set, a solved puzzle shows the success beat and then calls this. */
  onAdvance?: () => void;
  onResult?: (result: PuzzleResult, change: { before: number; after: number } | null) => void;
}

/** "Open on lichess.org" link for a puzzle. */
export function LichessLink({ id, className }: { id: string; className?: string }) {
  return (
    <a
      href={lichessUrl(id)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('inline-flex min-h-11 items-center justify-center gap-1.5 rounded-control px-3 text-sm font-medium text-lichess pressable hover:bg-lichess-soft active:bg-lichess-soft', className)}
    >
      Open on lichess.org <ExternalLink className="size-3.5" aria-hidden />
    </a>
  );
}

/**
 * One Lichess puzzle on the shared puzzle board. The first move (the opponent's set-up move) is
 * already on the board as the last move; the player then plays the solution against forced replies.
 * Mount with `key={puzzle.id}`.
 */
export function LichessSolveView({ puzzle, origin, title, backTo, progress, rated = true, actions, onAdvance, onResult }: LichessSolveViewProps) {
  const solvable = useMemo(() => toSolvable(puzzle), [puzzle]);
  const [change, setChange] = useState<{ before: number; after: number } | null>(null);
  const recorded = useRef<Promise<unknown>>(Promise.resolve());
  const advance = useRef(onAdvance);
  const report = useRef(onResult);
  useEffect(() => {
    advance.current = onAdvance;
    report.current = onResult;
  });

  const onFinish = useCallback(
    (a: LichessAttemptInput) => {
      if (!rated) {
        report.current?.(a.result, null);
        return;
      }
      const p = recordLichessAttempt(puzzle, origin, a).then((c) => {
        setChange(c);
        report.current?.(a.result, c);
      });
      recorded.current = p.catch(() => undefined);
    },
    [puzzle, origin, rated],
  );
  const { state, move, hint, reveal, hintSquares } = usePuzzleSolver(solvable, onFinish);
  const solved = state.phase === 'solved';
  const over = solved || state.phase === 'revealed';
  const canReveal = state.phase === 'play' || state.phase === 'wrong';
  const auto = !!onAdvance;
  const clean = state.feedback.kind === 'solved' && state.feedback.clean;
  const beat = clean ? BEAT_MS : BEAT_ASSISTED_MS;

  useEffect(() => {
    if (!auto || !solved) return;
    const t = window.setTimeout(() => void recorded.current.then(() => advance.current?.()), beat);
    return () => clearTimeout(t);
  }, [auto, solved, beat]);

  const outcome = !rated ? 'Played before, so not rated again' : change ? ratingChange(change) : 'Updating your rating';
  const themes = visibleThemes(puzzle.themes);

  return (
    <div className="space-y-3">
      <PageHeader
        backTo={backTo}
        title={title}
        subtitle={`Puzzle rated ${puzzle.rating}${origin === 'daily' ? ' · Daily puzzle' : ''}`}
        className="pb-0"
        actions={
          <a
            href={lichessUrl(puzzle.id)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open on lichess.org"
            className="-mr-2 grid size-11 place-items-center rounded-full text-fg-muted pressable hover:bg-surface-2 hover:text-lichess active:bg-surface-3"
          >
            <ExternalLink className="size-5" />
          </a>
        }
      />
      {progress}
      <div className="no-scrollbar -mx-gutter flex items-center gap-1.5 overflow-x-auto px-gutter">
        <SourceMark source="lichess" />
        {themes.map((t) => (
          <span key={t} className="inline-flex min-h-6 shrink-0 items-center rounded-chip bg-surface-2 px-2 text-2xs font-medium text-fg-muted">
            {themeLabel(t)}
          </span>
        ))}
      </div>

      <motion.div
        className={cn(
          'relative -mx-gutter transition-shadow duration-300 sm:mx-0 sm:overflow-hidden sm:rounded-[10px]',
          solved && 'shadow-[0_0_0_2px_var(--color-best),0_10px_40px_-12px_rgb(60_200_147/0.5)]',
          state.phase === 'wrong' && 'shadow-[0_0_0_2px_rgb(240_93_93/0.7)]',
          !solved && state.phase !== 'wrong' && 'shadow-[0_0_0_1px_rgb(180_156_255/0.35),0_10px_40px_-12px_rgb(180_156_255/0.35)]',
        )}
        animate={state.phase === 'wrong' ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.36 }}
      >
        <PuzzleBoard
          fen={state.fen}
          orientation={solvable.color}
          interactive={state.phase === 'play'}
          onMove={move}
          lastMove={state.lastMove}
          flash={state.flash}
          hint={hintSquares}
        />
        {solved && <SuccessBeat clean={clean} />}
      </motion.div>

      <FeedbackBar state={state} owner={solvable.color} steps={solvable.steps.length} outcome={over || state.phase === 'revealing' ? outcome : null} />

      {solved && auto ? (
        <div className="flex h-11 items-center px-1" aria-hidden>
          <div className="h-1 w-full overflow-hidden rounded-full bg-surface-3">
            <motion.div className="h-full rounded-full bg-lichess" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: beat / 1000, ease: 'linear' }} />
          </div>
        </div>
      ) : over ? (
        <div className="space-y-1">
          {actions}
          <LichessLink id={puzzle.id} className="w-full" />
        </div>
      ) : (
        <div className="flex gap-2">
          <Button className="flex-1" disabled={state.phase !== 'play' || state.hintLevel === 2} onClick={hint} icon={<Lightbulb className="size-4" />}>
            {state.hintLevel === 0 ? 'Hint' : state.hintLevel === 1 ? 'Show square' : 'Hint shown'}
          </Button>
          <Button className="flex-1" disabled={!canReveal} onClick={reveal} icon={<Eye className="size-4" />}>
            Solution
          </Button>
        </div>
      )}
      <PuzzleCoach puzzleKey={`l:${puzzle.id}`} state={state} theme={lichessTheme(puzzle.themes)} />
      {!over && rated && <p className="px-1 text-center text-2xs text-fg-subtle">Rated: a wrong move, hint or the solution counts as a miss.</p>}
    </div>
  );
}
