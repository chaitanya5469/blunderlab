import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BookOpenCheck, Brain, RotateCcw, Sparkles, TriangleAlert } from 'lucide-react';
import { Button } from '../../../components/ui';
import { cn } from '../../../lib/cn';
import { pluralize } from '../../../lib/format';
import type { Mode } from '../lib/progress';
import { formatIn } from '../lib/time';
import type { PlayerState } from './useLessonPlayer';

interface RunSummaryProps {
  mode: Mode;
  state: PlayerState;
  /** Closing explanation: the last move's note. */
  closing?: string;
  onPractice: () => void;
  onRestart: () => void;
  next: { label: string; onClick: () => void } | null;
}

/** End of a run: how it went, when it comes back, and what to do next. */
export function RunSummary({ mode, state, closing, onPractice, onRestart, next }: RunSummaryProps) {
  const clean = state.mistakes === 0 && state.hints === 0;
  const due = state.result?.dueAt;
  const view =
    mode === 'learn'
      ? { icon: <BookOpenCheck />, tone: 'bg-accent-soft text-accent-strong', title: 'Line learned', body: 'Now play it from memory to lock it in.' }
      : clean
        ? { icon: <Sparkles />, tone: 'bg-best text-canvas', title: 'Perfect run', body: due ? `No slips. It comes back for review ${formatIn(due)}.` : 'No slips.' }
        : {
            icon: <TriangleAlert />,
            tone: 'bg-mistake/14 text-mistake',
            title: 'Done, with a little help',
            body: `${[state.mistakes && pluralize(state.mistakes, 'wrong move'), state.hints && pluralize(state.hints, 'hint')].filter(Boolean).join(' and ')}. It comes back ${due ? formatIn(due) : 'soon'} so it sticks.`,
          };

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="rounded-card bg-surface-1 px-4 py-3.5">
        <div className="flex gap-3">
          <span className={cn('grid size-9 shrink-0 place-items-center rounded-control [&_svg]:size-4.5', view.tone)}>{view.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-semibold">{view.title}</p>
            <p className="mt-0.5 text-sm text-fg-muted">{view.body}</p>
          </div>
        </div>
        {closing && <p className="mt-3 border-t border-line-soft pt-3 text-sm text-fg-muted">{closing}</p>}
      </div>
      {mode === 'learn' ? (
        <Actions primary={<Button variant="primary" size="lg" className="w-full" onClick={onPractice} icon={<Brain className="size-5" />}>Practise from memory</Button>} onRestart={onRestart} restartLabel="Watch again" />
      ) : (
        <Actions
          primary={
            next ? (
              <Button variant="primary" size="lg" className="w-full" onClick={next.onClick} icon={<ArrowRight className="size-5" />}>
                {next.label}
              </Button>
            ) : null
          }
          onRestart={onRestart}
          restartLabel="Practise again"
        />
      )}
    </motion.div>
  );
}

function Actions({ primary, onRestart, restartLabel }: { primary: ReactNode; onRestart: () => void; restartLabel: string }) {
  return (
    <div className="space-y-2">
      {primary}
      <Button variant={primary ? 'secondary' : 'primary'} size={primary ? 'md' : 'lg'} className="w-full" onClick={onRestart} icon={<RotateCcw className="size-4" />}>
        {restartLabel}
      </Button>
    </div>
  );
}
