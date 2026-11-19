import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight, CircleCheck } from 'lucide-react';
import { Page } from '../../../components/layout/Page';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button, EmptyState, ErrorState, Skeleton } from '../../../components/ui';
import { db } from '../../../lib/db';
import type { LichessPuzzle, PuzzleResult } from '../../../lib/types';
import { LichessSolveView } from './LichessSolveView';
import { loadPack, pickNear } from './model/pack';
import { currentRating } from './model/rating';

const HOME = '/puzzles/lichess';

type Load = { status: 'loading' } | { status: 'error' } | { status: 'empty' } | { status: 'ready'; puzzle: LichessPuzzle; rating: number };

/** Next pack puzzle near the current rating, never one played before. */
async function next(pack: LichessPuzzle[], extra: Set<string>): Promise<Load> {
  const [rating, played] = await Promise.all([currentRating(), db.lichessAttempts.orderBy('puzzleId').uniqueKeys()]);
  const exclude = new Set([...(played as string[]), ...extra]);
  const puzzle = pickNear(pack, rating.rating, exclude);
  return puzzle ? { status: 'ready', puzzle, rating: Math.round(rating.rating) } : { status: 'empty' };
}

/** Rated Lichess puzzles from the bundled pack, one after another, matched to the owner's rating. */
export function LichessTrainPage() {
  const navigate = useNavigate();
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [tally, setTally] = useState<{ solved: number; missed: number; results: PuzzleResult[] }>({ solved: 0, missed: 0, results: [] });
  const pack = useRef<LichessPuzzle[] | null>(null);
  const seen = useRef(new Set<string>());

  const advance = useCallback(async () => {
    try {
      pack.current ??= await loadPack();
      const l = await next(pack.current, seen.current);
      if (l.status === 'ready') seen.current.add(l.puzzle.id);
      window.scrollTo({ top: 0 });
      setLoad(l);
    } catch {
      setLoad({ status: 'error' });
    }
  }, []);

  useEffect(() => {
    void advance();
  }, [advance]);

  const onResult = useCallback((result: PuzzleResult) => {
    setTally((t) => ({
      solved: t.solved + (result === 'solved' ? 1 : 0),
      missed: t.missed + (result === 'solved' ? 0 : 1),
      results: [...t.results, result].slice(-12),
    }));
  }, []);

  if (load.status === 'loading') {
    return (
      <Page className="space-y-3 pt-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="-mx-gutter aspect-square rounded-none" />
        <Skeleton className="h-16 w-full rounded-card" />
      </Page>
    );
  }
  if (load.status === 'error') {
    return (
      <Page>
        <PageHeader title="Lichess puzzles" backTo={HOME} />
        <ErrorState message="Could not load the puzzle pack." onRetry={() => void advance()} />
      </Page>
    );
  }
  if (load.status === 'empty') {
    return (
      <Page>
        <PageHeader title="Lichess puzzles" backTo={HOME} />
        <EmptyState icon={<CircleCheck />} title="Every puzzle played" body="You have played the whole bundled pack. The daily puzzle still brings a new one each day." action={<Button onClick={() => navigate(HOME)}>Back</Button>} />
      </Page>
    );
  }

  const { puzzle } = load;
  return (
    <Page>
      <motion.div key={puzzle.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}>
        <LichessSolveView
          key={puzzle.id}
          puzzle={puzzle}
          origin="pack"
          backTo={HOME}
          title={
            <span className="tnum">
              {load.rating} <span className="text-base font-medium text-fg-subtle">your rating</span>
            </span>
          }
          progress={<Tally {...tally} />}
          onResult={onResult}
          onAdvance={() => void advance()}
          actions={
            <Button variant="lichess" size="lg" className="w-full" onClick={() => void advance()} icon={<ArrowRight className="size-5" />}>
              Next puzzle
            </Button>
          }
        />
      </motion.div>
    </Page>
  );
}

/** This run so far: a dot per puzzle (green solved, red missed) and the counts. */
function Tally({ solved, missed, results }: { solved: number; missed: number; results: PuzzleResult[] }) {
  if (solved + missed === 0) return null;
  return (
    <div className="flex items-center gap-2 px-1 text-2xs text-fg-muted">
      <div className="flex gap-1" aria-hidden>
        {results.map((r, i) => (
          <span key={i} className={r === 'solved' ? 'size-2 rounded-full bg-best' : 'size-2 rounded-full bg-blunder'} />
        ))}
      </div>
      <span className="tnum">
        {solved} solved · {missed} missed
      </span>
    </div>
  );
}
