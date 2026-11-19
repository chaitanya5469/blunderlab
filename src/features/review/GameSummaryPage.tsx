import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { ChevronRight, ExternalLink, SearchX } from 'lucide-react';
import { EvalGraph } from '../../components/chess/EvalGraph';
import { Page } from '../../components/layout/Page';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge, Button, Card, EmptyState, ErrorState, SectionHeader, Skeleton } from '../../components/ui';
import { capitalize, formatDateTime, formatTimeControl } from '../../lib/format';
import { FLAGGED_CLASSES } from '../../lib/moveClass';
import { playSound, vibrate } from '../../lib/sound';
import type { GameRecord } from '../../lib/types';
import { analysisService } from '../../services/analysisService';
import { CoachBubble } from '../coach/CoachBubble';
import { gameNotes, introLine, summaryLine, useCoach } from '../coach/engine';
import { AnalysisPending } from './AnalysisPending';
import { DeepProgress, DepthChip } from './DeepAnalysis';
import { KeyMoments, MoveCounts, PhaseRatings, ScoreCard } from './SummarySections';
import { useGameReview } from './useGameReview';

const RESULT_LABEL = { win: 'Won', loss: 'Lost', draw: 'Drawn' } as const;

/** History entries that already buzzed: returning from the board (same entry) stays quiet; a fresh opening buzzes. */
const buzzedEntries = new Set<string>();

export const reviewPath = (id: string, ply?: number) => `/games/${encodeURIComponent(id)}/review${ply !== undefined ? `?ply=${ply}` : ''}`;

/** Header shared by both review screens: opponent, time control and date, and a link to Chess.com. */
export function ReviewHeader({ game, backTo }: { game: GameRecord; backTo: string }) {
  const oppColor = game.ownerColor === 'white' ? 'black' : 'white';
  return (
    <PageHeader
      backTo={backTo}
      title={`vs ${game[oppColor].username}`}
      subtitle={`${capitalize(game.timeClass)} ${formatTimeControl(game.timeControl)} · ${formatDateTime(game.endTime)}`}
      actions={
        <a
          href={game.url}
          target="_blank"
          rel="noreferrer"
          aria-label="Open on Chess.com"
          className="grid size-11 place-items-center rounded-full text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <ExternalLink className="size-5" />
        </a>
      }
      className="shrink-0 pb-1"
    />
  );
}

export function GameNotFound() {
  return (
    <Page>
      <PageHeader title="Game" backTo="/games" />
      <EmptyState icon={<SearchX />} title="Game not found" body="It may have been cleared from this device." />
    </Page>
  );
}

/**
 * The first Game Review screen: the coach's verdict on the whole game, the evaluation graph,
 * accuracy and game rating, move-class counts and phase grades. "Continue review" (pinned to the
 * bottom) opens the board screen.
 */
export function GameSummaryPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const ply = params.get('ply');
  // Old links (`/games/:id?ply=N`) open the board at that move.
  if (ply !== null) return <Navigate to={reviewPath(id, Math.max(0, Math.floor(Number(ply)) || 0))} replace />;
  return <GameSummary id={id} />;
}

function GameSummary({ id }: { id: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { game, analysis, moves, plies, parseError, analysisLoaded } = useGameReview(id);
  const analysed = !!analysis && moves.length === plies.length && plies.length > 0;
  const coach = useCoach();
  const [peek, setPeek] = useState<number | null>(null);

  useEffect(() => {
    if (game?.analysisStatus === 'pending') analysisService.prioritize(game.uuid);
  }, [game?.uuid, game?.analysisStatus]);

  // One short buzz per opening, once the game has loaded.
  const loaded = !!game;
  useEffect(() => {
    if (!loaded || buzzedEntries.has(location.key)) return;
    buzzedEntries.add(location.key);
    vibrate(18);
    playSound('game-start');
  }, [loaded, location.key]);

  const markers = useMemo(
    () =>
      analysed
        ? moves
            .filter((m) => m.actor === 'owner' && (FLAGGED_CLASSES.includes(m.classification) || m.classification === 'brilliant' || m.classification === 'great'))
            .map((m) => ({ ply: m.ply, cls: m.classification }))
        : [],
    [analysed, moves],
  );

  const owner = game?.ownerColor ?? 'white';
  const notes = useMemo(
    () => (game && analysed ? gameNotes({ result: game.result, rating: game[owner].rating, gameRating: analysis[owner].gameRating, moves }) : []),
    [game, analysed, analysis, owner, moves],
  );
  const line = useMemo(() => {
    if (!coach || !game || !analysisLoaded) return null;
    return analysed ? summaryLine(coach, game.uuid, game.result, analysis[owner].accuracy) : introLine(coach, game.uuid, game.openingName);
  }, [coach, game, analysisLoaded, analysed, analysis, owner]);

  if (game === undefined || !analysisLoaded) return <SummarySkeleton />;
  if (game === null) return <GameNotFound />;

  const open = (p?: number) => navigate(reviewPath(game.uuid, p));
  const peekMove = peek !== null && peek > 0 ? plies[peek - 1] : undefined;

  return (
    <>
      <Page className="space-y-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
        <div>
          <ReviewHeader game={game} backTo="/games" />
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge tone={game.result}>{RESULT_LABEL[game.result]}</Badge>
            {game.openingName && <Badge>{game.openingName}</Badge>}
            {analysed && <DepthChip gameId={game.uuid} depth={analysis.depth} />}
          </div>
          {analysed && (
            <div className="mt-2">
              <DeepProgress gameId={game.uuid} moves={plies.length} />
            </div>
          )}
        </div>

        {coach && line ? (
          <CoachBubble coach={coach} line={line} notes={notes} avatarClassName="size-20" className="gap-3" />
        ) : (
          notes.length > 0 && (
            <Card>
              <p className="text-2xs font-semibold tracking-[0.14em] text-fg-subtle uppercase">The game in brief</p>
              <ul className="mt-2 space-y-1.5">
                {notes.map((n) => (
                  <li key={n} className="text-sm leading-snug text-fg">
                    {n}
                  </li>
                ))}
              </ul>
            </Card>
          )
        )}

        {parseError ? (
          <ErrorState message="This game's move record could not be read." />
        ) : analysed ? (
          <>
            <section>
              <SectionHeader
                title="Evaluation"
                meta={peekMove ? `${peekMove.moveNumber}${peekMove.color === 'white' ? '.' : '…'} ${peekMove.san}` : 'tap to open a move'}
              />
              <EvalGraph
                curve={analysis.winCurve}
                markers={markers}
                current={peek ?? undefined}
                onSelect={setPeek}
                onRelease={(p) => {
                  setPeek(null);
                  open(p);
                }}
              />
            </section>
            <ScoreCard game={game} analysis={analysis} />
            <MoveCounts game={game} moves={moves} />
            <PhaseRatings game={game} moves={moves} />
            <KeyMoments moves={moves} onOpen={open} />
          </>
        ) : (
          <div className="space-y-2">
            <AnalysisPending game={game} />
            <p className="px-1 text-sm text-fg-muted">
              The board and moves are ready now. Accuracy, move ratings and phase grades appear here once Stockfish finishes.
            </p>
          </div>
        )}
      </Page>

      {/* Pinned above the gesture bar; never scrolls. */}
      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-app bg-gradient-to-t from-canvas from-65% to-transparent px-gutter pt-6 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button variant="primary" size="lg" className="w-full" disabled={parseError} onClick={() => open()}>
          Continue review
          <ChevronRight className="size-5" aria-hidden />
        </Button>
      </div>
    </>
  );
}

function SummarySkeleton() {
  return (
    <Page className="space-y-5 pt-4">
      <Skeleton className="h-8 w-2/3" />
      <div className="flex gap-3">
        <Skeleton className="size-20 rounded-full" />
        <Skeleton className="h-24 flex-1 rounded-card" />
      </div>
      <Skeleton className="h-20 w-full rounded-control" />
      <Skeleton className="h-40 w-full rounded-card" />
    </Page>
  );
}
