import { Cpu, Play } from 'lucide-react';
import { Button, Card, ErrorState, Progress } from '../../components/ui';
import { useAnalysisState } from '../../hooks/useServices';
import type { GameRecord } from '../../lib/types';
import { analysisService } from '../../services/analysisService';

/** Live analysis status for a game that has not been analysed yet. */
export function AnalysisPending({ game }: { game: GameRecord }) {
  const an = useAnalysisState();

  if (game.analysisStatus === 'failed') {
    return <ErrorState message="This game's move record could not be read, so it can't be analysed." />;
  }
  if (an.error) return <ErrorState message={an.error} onRetry={() => analysisService.retry()} />;

  const isCurrent = an.currentGameId === game.uuid;
  const value = isCurrent && an.total ? an.done / an.total : undefined;

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-control bg-best/14 text-best">
          <Cpu className="size-4.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {an.paused ? 'Analysis is paused' : an.interactive ? 'Waiting for the engine' : isCurrent ? 'Analysing this game' : 'Up next for analysis'}
          </p>
          <p className="text-xs text-fg-muted tnum">
            {an.paused
              ? 'Resume to review this game with Stockfish.'
              : an.interactive
                ? 'Game analysis continues shortly after you stop exploring.'
                : isCurrent && an.total
                ? `Position ${an.done} of ${an.total}`
                : 'Moved to the front of the queue'}
          </p>
        </div>
        {an.paused && (
          <Button variant="primary" onClick={() => analysisService.resume()} icon={<Play className="size-4" />}>
            Resume
          </Button>
        )}
      </div>
      {!an.paused && !an.interactive && <Progress value={value} barClassName="bg-best" label="Analysis progress" />}
    </Card>
  );
}
