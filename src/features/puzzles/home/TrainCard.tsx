import { useNavigate } from 'react-router';
import { CircleCheck, Play } from 'lucide-react';
import { Button, Card, StatTile, StatTileGroup } from '../../../components/ui';
import { whenPhrase } from '../model/labels';
import type { PuzzleCounts } from '../model/usePuzzleData';

interface TrainCardProps {
  counts: PuzzleCounts;
  now: number;
  /** Query string carrying the active filters into the session. */
  search: string;
}

/** The primary action: start a session of due puzzles, then new ones. */
export function TrainCard({ counts, now, search }: TrainCardProps) {
  const navigate = useNavigate();
  const ready = counts.due + counts.fresh;
  const headline =
    counts.due > 0
      ? `${counts.due} due for review${counts.fresh ? ` · ${counts.fresh} new` : ''}`
      : counts.fresh > 0
        ? `${counts.fresh} new puzzle${counts.fresh === 1 ? '' : 's'} waiting`
        : 'All caught up';

  return (
    <Card className="relative overflow-hidden border-blunder/20 bg-gradient-to-br from-blunder/12 to-surface-1">
      <div className="absolute -top-20 -right-16 size-52 rounded-full bg-blunder/10 blur-2xl" aria-hidden />
      <div className="relative">
        <h2 className="text-2xl font-semibold">Train</h2>
        <p className="mt-0.5 text-sm text-fg-muted">
          {ready > 0 ? (
            headline
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <CircleCheck className="size-4 text-best" aria-hidden />
              {headline}
              {counts.nextDueAt !== null && <span className="text-fg-subtle">· next review {whenPhrase(counts.nextDueAt, now)}</span>}
            </span>
          )}
        </p>
        <Button
          variant="primary"
          size="lg"
          className="mt-4 w-full"
          disabled={ready === 0}
          onClick={() => navigate(`/puzzles/train${search}`)}
          icon={<Play className="size-4.5 fill-current" />}
        >
          {ready > 0 ? 'Start a set' : 'Nothing due right now'}
        </Button>
        <StatTileGroup className="mt-3">
          <StatTile label="Due now" value={counts.due} hint="to review" valueClassName={counts.due ? 'text-mistake' : undefined} />
          <StatTile label="New" value={counts.fresh} hint="not tried yet" valueClassName={counts.fresh ? 'text-accent-strong' : undefined} />
          <StatTile label="Mastered" value={counts.mastered} hint="4× clean" valueClassName={counts.mastered ? 'text-best' : undefined} />
        </StatTileGroup>
        <p className="mt-3 text-xs text-fg-subtle">
          Training runs in sets of 3. Solved puzzles come back after a day, then a few days, then weeks, until they stick. A miss brings one back within minutes.
        </p>
      </div>
    </Card>
  );
}
