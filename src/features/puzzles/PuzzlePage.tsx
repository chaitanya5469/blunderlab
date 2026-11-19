import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { SearchX } from 'lucide-react';
import { ClassMarker } from '../../components/chess/ClassMarker';
import { Board } from '../../components/chess/Board';
import { Page } from '../../components/layout/Page';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge, Button, EmptyState, Skeleton } from '../../components/ui';
import { db } from '../../lib/db';
import { capitalize } from '../../lib/format';
import type { Puzzle } from '../../lib/types';
import { movePrefix, puzzleState, shortDate } from './model/labels';
import { trainingOrder } from './model/schedule';
import { useNow } from './model/usePuzzleData';
import { SolutionDetails } from './solve/SolutionDetails';
import { SolveView } from './solve/SolveView';

/**
 * A single puzzle (`/puzzles/p/:id`). Opened from the list it is a normal attempt that ends with
 * "Back to puzzles" and "Train"; opened from a set summary (`state.explain`) it starts as the explanation.
 */
export function PuzzlePage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [explaining, setExplaining] = useState(() => (location.state as { explain?: boolean } | null)?.explain === true);
  // Live row; the solver keeps its own state, so rescheduling after an attempt does not reset the board.
  const puzzle = useLiveQuery(async () => (await db.puzzles.get(id)) ?? null, [id]);
  const others = useLiveQuery(async () => (await db.puzzles.toArray()).filter((p) => p.id !== id), [id]);
  const now = useNow(others);
  const trainable = others ? trainingOrder(others, now).length : 0;
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/puzzles'));

  if (puzzle === undefined) {
    return (
      <Page className="space-y-3 pt-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="-mx-gutter aspect-square rounded-none" />
      </Page>
    );
  }
  if (puzzle === null) {
    return (
      <Page>
        <PageHeader title="Puzzle" backTo="/puzzles" />
        <EmptyState icon={<SearchX />} title="Puzzle not found" body="It may have been cleared from this device." />
      </Page>
    );
  }
  if (explaining) return <Explain puzzle={puzzle} now={now} onBack={back} onTryAgain={() => setExplaining(false)} />;
  return (
    <Page>
      <SolveView
        key={puzzle.id}
        puzzle={puzzle}
        backTo="/puzzles"
        title="Puzzle"
        actions={
          <div className="flex gap-2">
            <Button variant={trainable ? 'secondary' : 'primary'} size="lg" className="flex-1" onClick={back}>
              Back to puzzles
            </Button>
            {trainable > 0 && (
              <Button variant="primary" size="lg" className="flex-1" onClick={() => navigate('/puzzles/train')}>
                Train
              </Button>
            )}
          </div>
        }
      />
    </Page>
  );
}

/** Read-only explanation: the position with the best move, then the details, with a way to try it again. */
function Explain({ puzzle, now, onBack, onTryAgain }: { puzzle: Puzzle; now: number; onBack: () => void; onTryAgain: () => void }) {
  const best = puzzle.steps[0]!.accepted[0]!;
  const state = useMemo(() => puzzleState(puzzle, now), [puzzle, now]);
  return (
    <Page className="space-y-3">
      <PageHeader
        backTo="/puzzles"
        title={`Move ${puzzle.moveNumber}`}
        subtitle={`vs ${puzzle.opponent.username} · ${capitalize(puzzle.timeClass)} · ${shortDate(puzzle.gameEndTime)}`}
        className="pb-0"
        actions={<Badge tone={state.tone}>{state.label}</Badge>}
      />
      <p className="flex items-center gap-2 text-sm text-fg-muted">
        <ClassMarker cls={puzzle.source} />
        <span className="min-w-0">
          You played{' '}
          <span className="font-semibold text-fg">
            {movePrefix(puzzle.moveNumber, puzzle.ownerColor)}
            {puzzle.played.san}
          </span>
          . The arrow shows the best move.
        </span>
      </p>
      <div className="-mx-gutter sm:mx-0">
        <Board
          id="puzzle-explain-board"
          fen={puzzle.fen}
          orientation={puzzle.ownerColor}
          lastMove={puzzle.lastMove ? { from: puzzle.lastMove.slice(0, 2), to: puzzle.lastMove.slice(2, 4) } : null}
          arrowUci={best}
        />
      </div>
      <SolutionDetails puzzle={puzzle} />
      <div className="flex gap-2">
        <Button size="lg" className="flex-1" onClick={onBack}>
          Back
        </Button>
        <Button variant="primary" size="lg" className="flex-1" onClick={onTryAgain}>
          Try it again
        </Button>
      </div>
    </Page>
  );
}
