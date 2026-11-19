import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Eye, Sparkles, X } from 'lucide-react';
import { cn } from '../../../lib/cn';
import type { Color } from '../../../lib/types';
import type { SolverState } from './usePuzzleSolver';

interface FeedbackBarProps {
  state: SolverState;
  owner: Color;
  steps: number;
  /** What happens next once the puzzle is over, e.g. "Comes back in 3 days". */
  returns?: string | null;
  /** Replaces the "comes back" copy once over, e.g. a rating change for rated puzzles. */
  outcome?: string | null;
}

interface View {
  key: string;
  icon: ReactNode;
  tone: string;
  title: string;
  body: string;
}

function view({ feedback, step, phase, wrongMoves }: SolverState, owner: Color, steps: number, returns: string | null, outcome: string | null): View {
  const side = owner === 'white' ? 'White' : 'Black';
  const swatch = <span className={cn('size-3.5 rounded-[3px] ring-1 ring-line', owner === 'white' ? 'bg-eval-white' : 'bg-eval-black')} />;
  switch (feedback.kind) {
    case 'wrong':
      return feedback.wasPlayed
        ? {
            key: `wrong-${wrongMoves}`,
            icon: <X />,
            tone: 'bg-blunder/14 text-blunder',
            title: `${feedback.san} is what you played in the game`,
            body: 'It did not work then either. Look for something stronger.',
          }
        : { key: `wrong-${wrongMoves}`, icon: <X />, tone: 'bg-blunder/14 text-blunder', title: `${feedback.san} is not it`, body: 'Close, but not the move. Have another look.' };
    case 'good':
      return { key: `good-${step}`, icon: <Check />, tone: 'bg-best/14 text-best', title: `${feedback.san} is right`, body: 'Now watch the reply…' };
    case 'solved':
      if (outcome !== null)
        return feedback.clean
          ? { key: 'solved', icon: <Sparkles />, tone: 'bg-best text-canvas', title: 'Solved', body: `${feedback.san} was the move. ${outcome}.` }
          : { key: 'solved', icon: <Check />, tone: 'bg-best/14 text-best', title: 'Solved with a little help', body: `${outcome}.` };
      return feedback.clean
        ? { key: 'solved', icon: <Sparkles />, tone: 'bg-best text-canvas', title: 'Solved', body: returns ? `${feedback.san} was the move. ${returns}.` : `${feedback.san} was the move. Lovely.` }
        : { key: 'solved', icon: <Check />, tone: 'bg-best/14 text-best', title: 'Solved with a little help', body: returns ? `${returns} so it sticks.` : 'It will come back soon so it sticks.' };
    case 'revealed':
      return {
        key: 'revealed',
        icon: <Eye />,
        tone: 'bg-accent-soft text-accent-strong',
        title: phase === 'revealing' ? 'Here is the solution' : 'That is the line',
        body: outcome !== null ? `${outcome}.` : returns ? `${returns}.` : 'This one comes back soon.',
      };
    case 'start':
      return step > 0
        ? { key: `next-${step}`, icon: swatch, tone: 'bg-surface-3', title: 'Keep going', body: `Find the next move for ${side}.` }
        : {
            key: 'start',
            icon: swatch,
            tone: 'bg-surface-3',
            title: 'Your move',
            body: steps > 1 ? `Find the best move for ${side}. It takes a few moves.` : `Find the best move for ${side}.`,
          };
  }
}

/** One-line status under the board: whose move, right / wrong, solved. Announced to screen readers. */
export function FeedbackBar({ state, owner, steps, returns = null, outcome = null }: FeedbackBarProps) {
  // After a correct reply the next step starts with neutral "keep going" copy.
  const effective = state.phase === 'play' && state.feedback.kind === 'good' ? { ...state, feedback: { kind: 'start' as const } } : state;
  const v = view(effective, owner, steps, returns, outcome);
  return (
    <div className="relative min-h-[4.25rem] overflow-hidden rounded-card bg-surface-1" aria-live="polite">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={v.key}
          className="flex items-center gap-3 px-4 py-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className={cn('grid size-9 shrink-0 place-items-center rounded-control [&_svg]:size-4.5', v.tone)}>{v.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{v.title}</p>
            <p className="text-xs text-fg-muted">{v.body}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
