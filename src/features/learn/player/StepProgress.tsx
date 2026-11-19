import { cn } from '../../../lib/cn';
import type { Playable } from '../types';

/** One segment per learner move: done, current, to come. */
export function StepProgress({ playable, index, done }: { playable: Playable; index: number; done: boolean }) {
  const mine = playable.plies.filter((p) => p.color === playable.learner);
  const played = done ? mine.length : mine.filter((p) => p.index < index).length;
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-1 gap-1" role="progressbar" aria-label="Moves played" aria-valuemin={0} aria-valuemax={mine.length} aria-valuenow={played}>
        {mine.map((p, i) => (
          <span
            key={p.index}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-300',
              i < played ? 'bg-best' : i === played && !done ? 'bg-accent' : 'bg-surface-3',
            )}
          />
        ))}
      </div>
      <span className="shrink-0 text-xs text-fg-subtle tnum">
        {played}/{mine.length}
      </span>
    </div>
  );
}
