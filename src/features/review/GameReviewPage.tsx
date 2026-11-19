import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { EvalBar } from '../../components/chess/EvalBar';
import { InteractiveBoard } from '../../components/chess/InteractiveBoard';
import { MoveList } from '../../components/chess/MoveList';
import { Page } from '../../components/layout/Page';
import { Screen } from '../../components/layout/Screen';
import { Confetti } from '../../components/ui/Confetti';
import { ErrorState, Skeleton } from '../../components/ui';
import { useBoardFit } from '../../hooks/useBoardFit';
import { FLAGGED_CLASSES, MOVE_CLASS_META } from '../../lib/moveClass';
import type { Score } from '../../lib/types';
import { analysisService } from '../../services/analysisService';
import { CoachBubble } from '../coach/CoachBubble';
import { AnalysisPending } from './AnalysisPending';
import { GameNotFound, ReviewHeader } from './GameSummaryPage';
import { MoveInsight } from './MoveInsight';
import { PlayerStrip } from './PlayerStrip';
import { ReviewControls } from './ReviewControls';
import { useGameReview } from './useGameReview';
import { useLiveAnalysis } from './useLiveAnalysis';
import { usePlayground } from './usePlayground';
import { VariationPanel } from './VariationPanel';
import { introLine, moveLine, useCoach } from '../coach/engine';
import { useOpeningBook } from './useOpeningBook';
import { judgeContext, terminalState, variationVerdict } from './variation';

/** Eval bar (w-5) plus gap beside the board. */
const BOARD_SIDE = 28;
/** Height kept for the scrolling panel under the board on short screens. */
const PANEL_MIN = 120;

/**
 * The second Game Review screen (`/games/:id/review`): the board with eval bar, the coach on the
 * current move, the move list, stepping controls and variations. Back returns to the summary.
 */
export function GameReviewPage() {
  const { id = '' } = useParams();
  const { game, analysis, moves, plies, parseError } = useGameReview(id);
  // `?ply=N` opens the game on the position after half-move N (e.g. from a puzzle).
  const [params] = useSearchParams();
  const [initialPly] = useState(() => Math.max(0, Math.floor(Number(params.get('ply'))) || 0));
  const pg = usePlayground(plies, initialPly);
  const { ply, variation, fen } = pg;
  const analysed = !!analysis && moves.length === plies.length;
  const analysedMoves = useMemo(() => (analysed ? moves : []), [analysed, moves]);
  // Live engine analysis runs only off the game line (the game line has its stored analysis).
  const live = useLiveAnalysis(variation ? fen : null);

  useEffect(() => {
    if (game?.analysisStatus === 'pending') analysisService.prioritize(game.uuid);
  }, [game?.uuid, game?.analysisStatus]);

  const go = pg.goGame;
  const fit = useBoardFit({ side: BOARD_SIDE, minRest: PANEL_MIN });

  const classes = useMemo(() => (analysed ? moves.map((m) => m.classification) : undefined), [analysed, moves]);

  // The coach's line for every game move, picked in game order so lines rarely repeat and stay put when revisited.
  const coach = useCoach();
  const coachLines = useMemo(
    () =>
      coach && game
        ? analysedMoves.map((m) =>
            moveLine(coach, {
              key: `${game.uuid}:${m.ply}`,
              cls: m.classification,
              actor: m.actor,
              san: m.san,
              best: m.bestMoveSan,
              fenBefore: m.fenBefore,
              drop: m.moverWinDrop,
              opening: game.openingName,
            }),
          )
        : [],
    [coach, game, analysedMoves],
  );
  const coachIntro = useMemo(() => (coach && game ? introLine(coach, game.uuid, game.openingName) : null), [coach, game]);

  const book = useOpeningBook();
  const judge = useMemo(() => (game && variation ? judgeContext(game, analysedMoves, variation.base, book) : null), [game, analysedMoves, variation, book]);
  const varIndex = variation && pg.vIndex > 0 ? pg.vIndex - 1 : -1;
  // `live.version` changes whenever cached live results change; recompute then.
  const varVerdict = useMemo(
    () => (variation && judge && varIndex >= 0 ? variationVerdict(variation, varIndex, analysedMoves, (f) => analysisService.liveResult(f), judge, true) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [variation, varIndex, analysedMoves, judge, live.version],
  );

  if (game === undefined) return <ReviewSkeleton />;
  if (game === null) return <GameNotFound />;

  const owner = game.ownerColor;
  const oppColor = owner === 'white' ? 'black' : 'white';
  const current = ply > 0 ? plies[ply - 1] : undefined;
  const move = analysed && ply > 0 ? moves[ply - 1] : undefined;
  const fresh = live.fen === fen ? live.lines[0] : undefined;
  let score: Score | null;
  let arrow: string | null;
  if (variation) {
    score = fresh?.score ?? terminalState(fen)?.score ?? null;
    arrow = fresh?.pv[0] ?? null;
  } else {
    score = analysed ? ((ply === 0 ? moves[0]?.evalBefore : move?.evalAfter) ?? null) : null;
    const showBest = move && (FLAGGED_CLASSES.includes(move.classification) || ((move.classification === 'good' || move.classification === 'excellent') && move.bestMove !== move.uci));
    arrow = move && showBest ? move.bestMove : null;
  }
  const opponent = game[oppColor];
  const shownLine = coach ? (ply === 0 ? coachIntro : (coachLines[ply - 1] ?? null)) : null;
  // Move-quality badge and tint on the game line only (not in a variation, not at the start).
  const varMove = variation && varIndex >= 0 ? variation.moves[varIndex] : undefined;
  // Confetti plays when a checkmating move is shown; the key changes per position so it replays on return.
  const shownSan = variation ? varMove?.san : current?.san;
  const mateKey = shownSan?.endsWith('#') ? (variation ? `v${variation.base}:${varIndex}:${varMove?.uci}` : `g${ply}`) : null;
  const badge = variation
    ? varMove && varVerdict
      ? { square: varMove.to, cls: varVerdict.cls, id: `v${varIndex}:${varMove.uci}` }
      : null
    : move && current
      ? { square: current.to, cls: move.classification, id: ply }
      : null;

  return (
    <Screen>
      <ReviewHeader game={game} backTo={`/games/${encodeURIComponent(game.uuid)}`} />

      <div ref={fit.area} className="relative flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
        {/* Pinned: player strips, eval bar and board. Swipes here never scroll. */}
        <div ref={fit.block} className="w-full shrink-0 touch-none">
          <PlayerStrip
            player={opponent}
            color={oppColor}
            isOwner={false}
            accuracy={analysed ? analysis[oppColor].accuracy : undefined}
            compact
          />
          <div className="mx-auto flex gap-2" style={fit.size ? { width: fit.size + BOARD_SIDE } : undefined}>
            <EvalBar score={score} orientation={owner} />
            <div ref={fit.board} className="relative min-w-0 flex-1">
              {mateKey && <Confetti key={mateKey} />}
              <InteractiveBoard
                id="review-board"
                framed
                fen={fen}
                orientation={owner}
                interactive={!parseError}
                onMove={pg.play}
                lastMove={pg.lastMove}
                lastMoveColor={badge ? MOVE_CLASS_META[badge.cls].color : undefined}
                badge={badge}
                soundCue={badge?.cls}
                soundSide={owner}
                arrows={arrow ? [{ from: arrow.slice(0, 2), to: arrow.slice(2, 4) }] : undefined}
              />
            </div>
          </div>
          <PlayerStrip
            player={game[owner]}
            color={owner}
            isOwner
            accuracy={analysed ? analysis[owner].accuracy : undefined}
            compact
          />
        </div>

        {/* The only scrolling part: everything between the board and the controls. */}
        <div className="relative min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pt-1 pb-1">
          {/* The coach on the current game move, first in the panel (variations carry their own). */}
          {coach && !variation && shownLine && <CoachBubble coach={coach} line={shownLine} avatarClassName="size-14" />}

          {parseError ? (
            <ErrorState message="This game's move record could not be read." />
          ) : (
            <>
              {variation ? (
                <VariationPanel
                  variation={variation}
                  vIndex={pg.vIndex}
                  fen={fen}
                  plies={plies}
                  analysed={analysedMoves}
                  judge={judge!}
                  live={live}
                  owner={game.ownerColor}
                  gameId={game.uuid}
                  coach={coach}
                  onSelect={pg.goVar}
                  onPlay={pg.play}
                  onExit={pg.exit}
                />
              ) : (
                <MoveInsight
                  ply={current}
                  move={move}
                  onTryBest={(uci) => pg.tryFrom(ply - 1, uci)}
                  coached={!!shownLine}
                />
              )}
              {!analysed && <AnalysisPending game={game} />}
              <MoveList plies={plies} classes={classes} current={ply} onSelect={go} />
            </>
          )}
        </div>
      </div>

      {!parseError && (
        <ReviewControls
          canPrev={pg.canPrev}
          canNext={pg.canNext}
          atStart={pg.atStart}
          atEnd={pg.atEnd}
          onFirst={pg.first}
          onPrev={pg.prev}
          onNext={pg.next}
          onLast={pg.last}
          onExit={variation ? pg.exit : undefined}
          inVariation={!!variation}
        />
      )}
    </Screen>
  );
}

function ReviewSkeleton() {
  return (
    <Page className="space-y-4 pt-4">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="aspect-square w-full rounded-[10px]" />
      <Skeleton className="h-16 w-full rounded-card" />
      <Skeleton className="h-12 w-full rounded-control" />
    </Page>
  );
}
