import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Hourglass, Lightbulb, Undo2 } from 'lucide-react';
import { cn } from '../../../lib/cn';
import type { Playable, Ply } from '../types';
import type { Mode } from '../lib/progress';
import { moveLabel, sideName } from '../lib/catalog';
import type { PlayerState } from './useLessonPlayer';

interface CoachPanelProps {
  playable: Playable;
  mode: Mode;
  state: PlayerState;
}

const label = (p: Ply) => moveLabel(p.moveNumber, p.color, p.san);

/** The teaching text under the board: the move just played and what to do next. */
export function CoachPanel({ playable, mode, state }: CoachPanelProps) {
  const prev = state.index > 0 ? playable.plies[state.index - 1] : undefined;
  const cur = playable.plies[state.index];
  const yours = (p: Ply) => p.color === playable.learner;

  return (
    <div className="overflow-hidden rounded-card bg-surface-1" aria-live="polite">
      {prev && <Recap ply={prev} yours={yours(prev)} mistake={prev.index === playable.mistakeIndex} />}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={`${state.index}-${state.phase === 'auto' ? 'auto' : 'move'}-${state.wrong?.san ?? ''}-${state.hintLevel}`}
          className="px-4 py-3.5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.08 } }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {cur && <Prompt cur={cur} playable={playable} mode={mode} state={state} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Recap({ ply, yours, mistake }: { ply: Ply; yours: boolean; mistake: boolean }) {
  return (
    <div className={cn('flex gap-2.5 border-b border-line-soft px-4 py-2.5 text-sm', mistake && 'bg-blunder/8')}>
      <span
        className={cn(
          'mt-px inline-flex h-6 shrink-0 items-center gap-1 rounded-chip px-2 text-xs font-semibold tnum',
          mistake ? 'bg-blunder/16 text-blunder' : yours ? 'bg-best/14 text-best' : 'bg-surface-3 text-fg',
        )}
      >
        {yours && <Check className="size-3.5" aria-hidden />}
        {label(ply)}
        {ply.glyph}
      </span>
      <p className="min-w-0 text-fg-muted">
        {mistake && <span className="font-semibold text-blunder">The mistake. </span>}
        {ply.note ?? `${sideName(ply.color)} plays this.`}
      </p>
    </div>
  );
}

function Prompt({ cur, playable, mode, state }: { cur: Ply; playable: Playable; mode: Mode; state: PlayerState }) {
  if (state.phase === 'auto' || cur.color !== playable.learner) {
    return (
      <Row icon={<Hourglass />} tone="bg-surface-3 text-fg-muted" title={`${sideName(cur.color)} to move`}>
        Watch the reply.
      </Row>
    );
  }
  const side = sideName(playable.learner);
  if (mode === 'learn') {
    return (
      <Row icon={<Swatch side={playable.learner} />} tone="bg-surface-3" title={<>Play <span className="text-best">{label(cur)}</span></>}>
        {state.wrong && <span className="mb-1 block font-medium text-blunder">Not {state.wrong.san}. Follow the arrow.</span>}
        {cur.note}
      </Row>
    );
  }
  if (state.hintLevel > 0) {
    return (
      <Row icon={<Lightbulb />} tone="bg-inaccuracy/14 text-inaccuracy" title={state.hintLevel === 2 ? `Play ${label(cur)}` : 'Hint: the glowing piece moves'}>
        {cur.note}
      </Row>
    );
  }
  if (state.wrong) {
    return (
      <Row icon={<Undo2 />} tone="bg-blunder/14 text-blunder" title={`${state.wrong.san} is not the move in this line`}>
        <span className="text-fg-subtle">The idea here: </span>
        {cur.note} Try again.
      </Row>
    );
  }
  return (
    <Row icon={<Swatch side={playable.learner} />} tone="bg-surface-3" title="Your move">
      Find {side}'s move {cur.moveNumber} from memory.
    </Row>
  );
}

function Row({ icon, tone, title, children }: { icon: ReactNode; tone: string; title: ReactNode; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className={cn('grid size-9 shrink-0 place-items-center rounded-control [&_svg]:size-4.5', tone)}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-base leading-snug font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-fg-muted">{children}</p>
      </div>
    </div>
  );
}

const Swatch = ({ side }: { side: 'white' | 'black' }) => (
  <span className={cn('size-3.5 rounded-[3px] ring-1 ring-line', side === 'white' ? 'bg-eval-white' : 'bg-eval-black')} />
);
