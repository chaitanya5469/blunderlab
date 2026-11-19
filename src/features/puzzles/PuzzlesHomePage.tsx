import { useState } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { FilterX, Inbox, Puzzle as PuzzleIcon, Sparkles } from 'lucide-react';
import { Page } from '../../components/layout/Page';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button, Card, EmptyState, SectionHeader, Skeleton } from '../../components/ui';
import { useAnalysisState } from '../../hooks/useServices';
import { db } from '../../lib/db';
import type { Puzzle } from '../../lib/types';
import { FilterBar } from './home/FilterBar';
import { GenerationStatus } from './home/GenerationStatus';
import { pluralize } from '../../lib/format';
import { ProgressStats } from './home/ProgressStats';
import { PuzzleRow } from './home/PuzzleRow';
import { listOrder } from './model/schedule';
import { SourceTabs } from './home/SourceTabs';
import { TrainCard } from './home/TrainCard';
import { filtersToSearch, matches, usePuzzleFilters } from './model/filters';
import { countPuzzles, useAttemptStats, useNow, usePuzzles } from './model/usePuzzleData';

const LIST_PAGE = 8;

export function PuzzlesHomePage() {
  const puzzles = usePuzzles();
  const [filters, setFilters] = usePuzzleFilters();
  const now = useNow(puzzles);
  const stats = useAttemptStats();

  return (
    <Page className="space-y-5">
      <div>
        <PageHeader title="Puzzles" subtitle="Built from your own mistakes" />
        <SourceTabs value="own" />
      </div>
      {!puzzles ? (
        <HomeSkeleton />
      ) : puzzles.length === 0 ? (
        <NoPuzzles />
      ) : (
        <>
          <FilterBar puzzles={puzzles} filters={filters} onChange={setFilters} />
          <Filtered puzzles={puzzles.filter((p) => matches(p, filters))} now={now} search={filtersToSearch(filters)} onClear={() => setFilters({ source: null, phase: null, timeClass: null, motif: null })} />
          <GenerationStatus />
          {stats && (
            <section>
              <SectionHeader title="Progress" />
              <ProgressStats stats={stats} />
            </section>
          )}
        </>
      )}
    </Page>
  );
}

function Filtered({ puzzles, now, search, onClear }: { puzzles: Puzzle[]; now: number; search: string; onClear: () => void }) {
  const [limit, setLimit] = useState(LIST_PAGE);
  if (puzzles.length === 0) {
    return (
      <Card padded={false}>
        <EmptyState
          icon={<FilterX />}
          title="No puzzles match"
          body="Try fewer filters to see more of your positions."
          action={<Button onClick={onClear}>Clear filters</Button>}
        />
      </Card>
    );
  }
  return (
    <>
      <TrainCard counts={countPuzzles(puzzles, now)} now={now} search={search} />
      <section>
        <SectionHeader title="Your puzzles" action={<span className="text-xs text-fg-subtle tnum">{pluralize(puzzles.length, 'puzzle')}</span>} />
        <Card padded={false} className="p-1.5">
          {listOrder(puzzles, now).slice(0, limit).map((p) => (
            <PuzzleRow key={p.id} puzzle={p} now={now} />
          ))}
        </Card>
        {puzzles.length > limit && (
          <Button variant="ghost" className="mt-2 w-full" onClick={() => setLimit((l) => l + 20)}>
            Show more
          </Button>
        )}
      </section>
    </>
  );
}

/** Designed empty states before the first puzzle exists. */
function NoPuzzles() {
  const an = useAnalysisState();
  const info = useLiveQuery(async () => ({ analysed: await db.analyses.count(), checked: await db.puzzleCandidates.count() }), []);
  if (!info) return <HomeSkeleton />;
  const working = an.queueLength > 0 || an.puzzleChecking || an.puzzleRemaining > 0;

  if (info.analysed === 0) {
    return (
      <>
        <Card padded={false} className="relative overflow-hidden">
          <div className="absolute -top-16 -right-16 size-48 rounded-full bg-blunder/10 blur-2xl" aria-hidden />
          <EmptyState
            icon={<PuzzleIcon />}
            title="No games analysed yet"
            body={
              working
                ? 'Stockfish is reviewing your games on this device. Puzzles appear as soon as the first ones are done.'
                : 'Once your games are synced and analysed, every blunder, mistake and missed chance becomes a puzzle.'
            }
            action={
              !working && (
                <Link to="/games" className="inline-flex h-11 items-center rounded-control bg-surface-3 px-4 text-sm font-medium">
                  Go to games
                </Link>
              )
            }
          />
        </Card>
        <GenerationStatus />
      </>
    );
  }

  return (
    <>
      <Card padded={false} className="relative overflow-hidden">
        <div className="absolute -top-16 -right-16 size-48 rounded-full bg-blunder/10 blur-2xl" aria-hidden />
        <EmptyState
          icon={working ? <Sparkles /> : <Inbox />}
          title={working ? 'Finding your first puzzles' : 'No puzzles yet'}
          body={
            working
              ? 'Each mistake is re-checked with a deeper search. Only positions with one clear answer become puzzles.'
              : `${pluralize(info.checked, 'position')} from ${pluralize(info.analysed, 'game')} checked, none with one clear answer yet. New games bring new puzzles.`
          }
        />
      </Card>
      <GenerationStatus />
    </>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-5" aria-hidden>
      <Skeleton className="h-11 w-28 rounded-full" />
      <Skeleton className="h-60 w-full rounded-card" />
      <Skeleton className="h-48 w-full rounded-card" />
    </div>
  );
}
