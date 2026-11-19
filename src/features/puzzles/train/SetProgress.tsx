import { cn } from '../../../lib/cn';
import type { PuzzleResult } from '../../../lib/types';

const DONE: Record<PuzzleResult, string> = { solved: 'bg-best', assisted: 'bg-inaccuracy', failed: 'bg-mistake' };

/** One segment per puzzle in the set: finished ones take their result colour, the current one is lit. */
export function SetProgress({ results, index }: { results: (PuzzleResult | undefined)[]; index: number }) {
  return (
    <div className="flex gap-1.5" role="progressbar" aria-label={`Puzzle ${Math.min(index + 1, results.length)} of ${results.length}`} aria-valuemin={0} aria-valuemax={results.length} aria-valuenow={index}>
      {results.map((r, i) => (
        <span key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors duration-300', r ? DONE[r] : i === index ? 'bg-fg-muted' : 'bg-surface-3')} />
      ))}
    </div>
  );
}
