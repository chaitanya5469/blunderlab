import { Cpu, Play, Sparkles } from 'lucide-react';
import { Button, Card, ErrorState, Progress } from '../../../components/ui';
import { useAnalysisState } from '../../../hooks/useServices';
import { analysisService } from '../../../services/analysisService';
import { pluralize } from '../../../lib/format';

/**
 * What the engine is doing for puzzles: checking candidates, analysing queued games, paused,
 * or failed. Renders nothing when there is no work left.
 */
export function GenerationStatus({ className }: { className?: string }) {
  const an = useAnalysisState();
  if (an.error) return <ErrorState className={className} message={an.error} onRetry={() => analysisService.retry()} />;

  const games = an.queueLength;
  if (games === 0 && an.puzzleRemaining === 0 && !an.puzzleChecking) return null;
  const checking = an.puzzleChecking || (!an.currentGameId && an.puzzleRemaining > 0);

  if (an.paused) {
    return (
      <Card className={className}>
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-control bg-surface-3 text-fg-muted">
            <Cpu className="size-4.5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Engine paused</p>
            <p className="truncate text-xs text-fg-muted">New puzzles wait until analysis resumes.</p>
          </div>
          <Button variant="primary" onClick={() => analysisService.resume()} icon={<Play className="size-4" />}>
            Resume
          </Button>
        </div>
      </Card>
    );
  }

  const total = an.puzzleChecked + an.puzzleRemaining;
  return (
    <Card className={className} aria-live="polite">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-control bg-blunder/14 text-blunder">
          {checking ? <Sparkles className="size-4.5 animate-pulse" aria-hidden /> : <Cpu className="size-4.5" aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{checking ? 'Finding puzzles in your games' : 'Analysing your games'}</p>
          <p className="truncate text-xs text-fg-muted tnum">
            {checking
              ? `Checking positions · ${an.puzzleRemaining} to go`
              : `${pluralize(games, 'game')} in queue · puzzles follow each game`}
          </p>
        </div>
      </div>
      <Progress
        className="mt-3"
        value={checking && total ? an.puzzleChecked / total : an.total ? an.done / an.total : undefined}
        barClassName="bg-blunder"
        label="Puzzle generation progress"
      />
    </Card>
  );
}
