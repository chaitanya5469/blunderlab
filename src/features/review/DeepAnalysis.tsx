import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, Gauge, X } from 'lucide-react';
import { Button, Progress, Sheet } from '../../components/ui';
import { useAnalysisState, useDeepAnalysisState } from '../../hooks/useServices';
import { cn } from '../../lib/cn';
import { REANALYSIS_DEPTHS } from '../../lib/constants';
import { analysisService } from '../../services/analysisService';

interface DeepAnalysisProps {
  gameId: string;
  /** Depth the stored analysis was made at. */
  depth: number;
}

/** Compact chip showing the game's analysis depth; opens a sheet to re-analyse it deeper. */
export function DepthChip({ gameId, depth }: DeepAnalysisProps) {
  const [open, setOpen] = useState(false);
  const deep = useDeepAnalysisState();
  const options = REANALYSIS_DEPTHS.filter((o) => o.depth > depth);
  const busyElsewhere = deep.gameId !== null && deep.gameId !== gameId;
  const runningHere = deep.gameId === gameId;

  const start = (d: number) => {
    analysisService.reanalyze(gameId, d);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Analysed at depth ${depth}. Analyse deeper`}
        className="ml-auto inline-flex min-h-6 items-center gap-1 rounded-chip bg-surface-3 py-0.5 pr-1 pl-2 text-2xs font-semibold text-fg-muted tnum edge-current pressable hover:text-fg"
      >
        <Gauge className="size-3.5" aria-hidden />
        Depth {depth}
        <ChevronRight className="size-3.5 text-fg-subtle" aria-hidden />
      </button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Analyse deeper"
        description={
          options.length
            ? `This game was analysed at depth ${depth}. A deeper pass re-checks every move with Stockfish; the current review stays usable until it finishes.`
            : `This game was analysed at depth ${depth}, the deepest offered here.`
        }
        actions={
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {options.length ? 'Not now' : 'Close'}
          </Button>
        }
      >
        {options.length > 0 && (
          <div className="space-y-2">
            {options.map((o) => (
              <button
                key={o.depth}
                type="button"
                disabled={runningHere && deep.depth === o.depth}
                onClick={() => start(o.depth)}
                className="flex min-h-14 w-full items-center gap-3 rounded-control surface-raised-2 px-4 py-2.5 text-left pressable disabled:opacity-50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{o.label}</span>
                  <span className="mt-0.5 block text-xs text-fg-muted">{o.hint}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-fg-subtle" aria-hidden />
              </button>
            ))}
            {(busyElsewhere || runningHere) && (
              <p className="pt-1 text-xs text-fg-subtle">
                {busyElsewhere ? 'This replaces the deeper analysis running for another game.' : 'This replaces the deeper analysis already running.'}
              </p>
            )}
          </div>
        )}
      </Sheet>
    </>
  );
}

/** Slim progress strip for this game's deeper re-analysis (nothing when none is running). */
export function DeepProgress({ gameId, moves }: { gameId: string; moves: number }) {
  const deep = useDeepAnalysisState();
  const an = useAnalysisState();
  const show = deep.gameId === gameId;
  const move = Math.min(moves, Math.max(0, deep.done - 1));
  const status = deep.error
    ? 'Could not finish'
    : an.interactive
      ? 'On hold while you explore'
      : deep.total
        ? `Move ${move} of ${moves}`
        : 'Starting…';

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="flex items-center gap-3 rounded-control surface-base py-2 pr-1 pl-3" role="status">
            <Gauge className={cn('size-4 shrink-0', deep.error ? 'text-blunder' : 'text-accent-strong')} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">
                Depth {deep.depth} analysis <span className="font-normal text-fg-muted tnum">· {status}</span>
              </p>
              {!deep.error && (
                <Progress
                  className="mt-1.5 h-1"
                  value={deep.total ? deep.done / deep.total : undefined}
                  label="Deeper analysis progress"
                />
              )}
            </div>
            {deep.error && an.status === 'error' && (
              <Button variant="ghost" className="min-h-9 px-3 text-xs" onClick={() => analysisService.retry()}>
                Retry
              </Button>
            )}
            <button
              type="button"
              aria-label={deep.error ? 'Dismiss' : 'Cancel deeper analysis'}
              onClick={() => analysisService.cancelDeep()}
              className="grid size-9 shrink-0 place-items-center rounded-full text-fg-muted pressable hover:bg-surface-2 hover:text-fg"
            >
              <X className="size-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
