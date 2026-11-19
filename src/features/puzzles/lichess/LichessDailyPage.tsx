import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { CloudOff } from 'lucide-react';
import { Page } from '../../../components/layout/Page';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button, EmptyState, Skeleton } from '../../../components/ui';
import { db } from '../../../lib/db';
import { LichessSolveView } from './LichessSolveView';
import { getDaily, type DailyState } from './model/daily';

const HOME = '/puzzles/lichess';

/** The Lichess daily puzzle (cached for the day). Rated the first time it is played. */
export function LichessDailyPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<DailyState | null>(null);
  const [retrying, setRetrying] = useState(false);
  // Whether it was played before this visit; read once so finishing it now does not flip the view.
  const [playedBefore, setPlayedBefore] = useState<boolean | null>(null);
  const id = state?.status === 'ready' ? state.daily.puzzle.id : null;
  const count = useLiveQuery(async () => (id ? db.lichessAttempts.where('puzzleId').equals(id).count() : null), [id]);

  useEffect(() => {
    void getDaily().then(setState);
  }, []);
  useEffect(() => {
    if (playedBefore === null && typeof count === 'number') setPlayedBefore(count > 0);
  }, [count, playedBefore]);

  const retry = async () => {
    setRetrying(true);
    setState(await getDaily(true));
    setRetrying(false);
  };

  if (!state || (state.status === 'ready' && playedBefore === null)) {
    return (
      <Page className="space-y-3 pt-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="-mx-gutter aspect-square rounded-none" />
      </Page>
    );
  }
  if (state.status === 'error') {
    return (
      <Page>
        <PageHeader title="Daily puzzle" backTo={HOME} />
        <EmptyState
          icon={<CloudOff />}
          title="Could not reach Lichess"
          body="The daily puzzle needs a connection once a day; after that it works offline. Rated puzzles from the bundled pack work any time."
          action={
            <div className="flex flex-col gap-2">
              <Button loading={retrying} onClick={() => void retry()}>
                Try again
              </Button>
              <Button variant="lichess" onClick={() => navigate('/puzzles/lichess/play')}>
                Play rated puzzles
              </Button>
            </div>
          }
        />
      </Page>
    );
  }

  const { puzzle } = state.daily;
  return (
    <Page>
      <LichessSolveView
        key={puzzle.id}
        puzzle={puzzle}
        origin="daily"
        rated={!playedBefore}
        backTo={HOME}
        title="Daily puzzle"
        progress={
          state.stale ? (
            <p className="px-1 text-2xs text-fg-subtle">Offline: showing the daily puzzle from {state.daily.date}.</p>
          ) : undefined
        }
        actions={
          <div className="flex gap-2">
            <Button size="lg" className="flex-1" onClick={() => navigate(HOME)}>
              Done
            </Button>
            <Button variant="lichess" size="lg" className="flex-1" onClick={() => navigate('/puzzles/lichess/play')}>
              Rated puzzles
            </Button>
          </div>
        }
      />
    </Page>
  );
}
