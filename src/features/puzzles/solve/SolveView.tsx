import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Eye, Lightbulb } from 'lucide-react';
import { ClassMarker } from '../../../components/chess/ClassMarker';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui';
import { cn } from '../../../lib/cn';
import { capitalize } from '../../../lib/format';
import type { Puzzle } from '../../../lib/types';
import { comesBack, movePrefix, shortDate } from '../model/labels';
import { nextSchedule, recordAttempt, type AttemptInput } from '../model/schedule';
import { ownPuzzleTheme } from '../../coach/engine';
import { PuzzleCoach } from '../../coach/PuzzleCoach';
import { FeedbackBar } from './FeedbackBar';
import { PuzzleBoard } from './PuzzleBoard';
import { SolutionDetails } from './SolutionDetails';
import { SuccessBeat } from './SuccessBeat';
import { usePuzzleSolver } from './usePuzzleSolver';

/** How long the success beat stays on the board before moving on: clean solve, solve with help. */
const BEAT_MS = 1100;
const BEAT_ASSISTED_MS = 1500;

interface SolveViewProps {
  puzzle: Puzzle;
  /** Header title, e.g. "1 of 3". */
  title: ReactNode;
  backTo: string;
  /** Extra row under the header (e.g. the set's progress segments). */
  progress?: ReactNode;
  /** Shown once the puzzle is over (always after "Solution"; after a solve only when not auto-advancing). */
  actions: ReactNode;
  /** When set, a solved puzzle shows a short success beat and then calls this, without a tap. */
  onAdvance?: () => void;
  /** Called after the attempt is stored; `dueAt` is when the puzzle comes back. */
  onAttempt?: (attempt: AttemptInput, dueAt: number) => void;
}

/**
 * One puzzle: context, full-width board, feedback, thumb-reachable controls, and the
 * explanation once solved or revealed. Mount with `key={puzzle.id}` to reset between puzzles.
 */
export function SolveView({ puzzle, title, backTo, progress, actions, onAdvance, onAttempt }: SolveViewProps) {
  const [dueAt, setDueAt] = useState<number | null>(null);
  const recorded = useRef<Promise<void>>(Promise.resolve());
  const advance = useRef(onAdvance);
  useEffect(() => {
    advance.current = onAdvance;
  });

  const onFinish = useCallback(
    (attempt: AttemptInput) => {
      const due = nextSchedule(puzzle.box, attempt.result, Date.now()).dueAt;
      setDueAt(due);
      recorded.current = recordAttempt(puzzle.id, attempt);
      onAttempt?.(attempt, due);
    },
    [puzzle.id, puzzle.box, onAttempt],
  );
  const { state, move, hint, reveal, hintSquares } = usePuzzleSolver(puzzle, onFinish);
  const solved = state.phase === 'solved';
  const over = solved || state.phase === 'revealed';
  const canReveal = state.phase === 'play' || state.phase === 'wrong';
  const auto = !!onAdvance;
  const clean = state.feedback.kind === 'solved' && state.feedback.clean;
  const beat = clean ? BEAT_MS : BEAT_ASSISTED_MS;

  // Auto-advance: once the beat has played and the attempt is safely stored, move on.
  useEffect(() => {
    if (!auto || !solved) return;
    const t = window.setTimeout(() => {
      void recorded.current.then(() => advance.current?.());
    }, beat);
    return () => clearTimeout(t);
  }, [auto, solved, beat]);

  return (
    <div className="space-y-3">
      <PageHeader
        backTo={backTo}
        title={title}
        subtitle={`vs ${puzzle.opponent.username} · ${capitalize(puzzle.timeClass)} · ${shortDate(puzzle.gameEndTime)}`}
        className="pb-0"
      />
      {progress}
      <p className="flex items-center gap-2 text-sm text-fg-muted">
        <ClassMarker cls={puzzle.source} />
        <span className="min-w-0 truncate">
          Move {puzzle.moveNumber}: you played{' '}
          <span className="font-semibold text-fg">
            {movePrefix(puzzle.moveNumber, puzzle.ownerColor)}
            {puzzle.played.san}
          </span>
        </span>
      </p>

      <motion.div
        className={cn(
          'relative -mx-gutter transition-shadow duration-300 sm:mx-0 sm:overflow-hidden sm:rounded-[10px]',
          state.phase === 'solved' && 'shadow-[0_0_0_2px_var(--color-best),0_10px_40px_-12px_rgb(60_200_147/0.5)]',
          state.phase === 'wrong' && 'shadow-[0_0_0_2px_rgb(240_93_93/0.7)]',
          state.phase !== 'solved' && state.phase !== 'wrong' && 'shadow-[0_10px_40px_-12px_rgb(0_0_0/0.7)]',
        )}
        animate={state.phase === 'wrong' ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.36 }}
      >
        <PuzzleBoard
          fen={state.fen}
          orientation={puzzle.ownerColor}
          interactive={state.phase === 'play'}
          onMove={move}
          lastMove={state.lastMove}
          flash={state.flash}
          hint={hintSquares}
        />
        {solved && <SuccessBeat clean={clean} />}
      </motion.div>

      <FeedbackBar state={state} owner={puzzle.ownerColor} steps={puzzle.steps.length} returns={over && dueAt !== null ? comesBack(dueAt) : null} />

      {solved && auto ? (
        // Holds the controls' place while the beat plays; the bar fills as the next puzzle approaches.
        <div className="flex h-11 items-center px-1" aria-hidden>
          <div className="h-1 w-full overflow-hidden rounded-full bg-surface-3">
            <motion.div className="h-full rounded-full bg-best" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: beat / 1000, ease: 'linear' }} />
          </div>
        </div>
      ) : over ? (
        actions
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

      <PuzzleCoach puzzleKey={`o:${puzzle.id}`} state={state} theme={ownPuzzleTheme(puzzle)} played={puzzle.played.san} />

      {over && !(solved && auto) && <SolutionDetails puzzle={puzzle} />}
    </div>
  );
}
