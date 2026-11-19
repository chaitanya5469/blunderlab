import { useEffect, useMemo, useRef } from 'react';
import { ArrowRight, Cpu, GitBranch, LoaderCircle, Undo2 } from 'lucide-react';
import { ClassMarker } from '../../components/chess/ClassMarker';
import { cn } from '../../lib/cn';
import { EP_THRESHOLDS } from '../../lib/constants';
import { formatScore } from '../../lib/evaluation';
import { MOVE_CLASS_META } from '../../lib/moveClass';
import type { Color, MoveAnalysis, ParsedPly, Score } from '../../lib/types';
import { CoachBubble } from '../coach/CoachBubble';
import { moveLine, sanOf } from '../coach/engine';
import type { Coach } from '../coach/types';
import { analysisService, LIVE_MAX_DEPTH, type LiveAnalysisState } from '../../services/analysisService';
import { moveLabel, pointsEdge, positionEval, sanLine, terminalState, variationVerdict, type JudgeContext, type Variation } from './variation';

interface VariationPanelProps {
  variation: Variation;
  vIndex: number;
  fen: string;
  plies: ParsedPly[];
  /** Stored per-move analysis (empty if the game is not analysed yet). */
  analysed: MoveAnalysis[];
  /** Ratings and book state for classifying variation moves like game moves. */
  judge: JudgeContext;
  live: LiveAnalysisState;
  onSelect: (i: number) => void;
  onPlay: (uci: string) => void;
  onExit: () => void;
  /** For coach comments on variation moves (framed from the owner's side). */
  owner: Color;
  gameId: string;
  coach: Coach | null;
}

const TERMINAL_LABEL = { checkmate: 'Checkmate', stalemate: 'Stalemate', draw: 'Draw by insufficient material' } as const;

/** Off-the-game banner: the variation's moves, how the last one compares, and live engine lines. */
export function VariationPanel({ variation, vIndex, fen, plies, analysed, judge, live, onSelect, onPlay, onExit, owner, gameId, coach }: VariationPanelProps) {
  const { base, moves } = variation;
  const branch = base > 0 ? plies[base - 1] : undefined;
  const current = vIndex > 0 ? moves[vIndex - 1] : undefined;

  return (
    <section className="overflow-hidden rounded-card border border-accent/35 bg-surface-1" aria-label="Variation">
      <div className="flex items-center gap-2 bg-accent-soft py-1.5 pr-1.5 pl-3">
        <GitBranch className="size-4 shrink-0 text-accent-strong" aria-hidden />
        <p className="min-w-0 flex-1 leading-tight">
          <span className="block text-sm font-semibold text-accent-strong">Your variation</span>
          <span className="block truncate text-xs text-fg-muted">
            {branch ? `Branched after ${moveLabel(branch.moveNumber, branch.color, branch.san)}` : 'Branched from the start'}
          </span>
        </p>
        <button
          type="button"
          onClick={onExit}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-control bg-surface-2 px-3 text-sm font-semibold text-fg transition-colors hover:bg-surface-3 active:bg-surface-3"
        >
          <Undo2 className="size-4" aria-hidden />
          Back to game
        </button>
      </div>

      <div className="space-y-3 px-3 pt-2.5 pb-3">
        <VariationMoves variation={variation} vIndex={vIndex} onSelect={onSelect} />
        {current ? (
          <MoveFeedback
            key={vIndex}
            variation={variation}
            index={vIndex - 1}
            plies={plies}
            analysed={analysed}
            judge={judge}
            live={live}
            owner={owner}
            gameId={gameId}
            coach={coach}
          />
        ) : (
          <p className="text-sm text-fg-muted">Branch point. Move a piece, or tap an engine line to play it.</p>
        )}
        <EngineLines fen={fen} live={live} onPlay={onPlay} />
      </div>
    </section>
  );
}

function VariationMoves({ variation, vIndex, onSelect }: { variation: Variation; vIndex: number; onSelect: (i: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.querySelector<HTMLElement>(`[data-vi="${vIndex}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [vIndex]);

  return (
    <div ref={box} className="-mx-1 flex max-h-[4.75rem] flex-wrap gap-0.5 overflow-y-auto overscroll-contain">
      {variation.moves.map((m, i) => {
        const showNumber = i === 0 || m.color === 'white';
        const active = i + 1 === vIndex;
        return (
          <button
            key={i}
            type="button"
            data-vi={i + 1}
            onClick={() => onSelect(i + 1)}
            className={cn(
              'h-8 rounded-chip px-1.5 text-sm font-medium tnum transition-colors',
              active ? 'bg-accent-soft text-fg ring-1 ring-accent/40' : i + 1 > vIndex ? 'text-fg-subtle hover:text-fg-muted' : 'text-fg-muted hover:text-fg',
            )}
          >
            {showNumber ? moveLabel(m.moveNumber, m.color, m.san) : m.san}
          </button>
        );
      })}
    </div>
  );
}

function MoveFeedback({
  variation,
  index,
  plies,
  analysed,
  judge,
  live,
  owner,
  gameId,
  coach,
}: {
  variation: Variation;
  index: number;
  plies: ParsedPly[];
  analysed: MoveAnalysis[];
  judge: JudgeContext;
  live: LiveAnalysisState;
  owner: Color;
  gameId: string;
  coach: Coach | null;
}) {
  const move = variation.moves[index]!;
  // `live.version` changes whenever cached results change; recompute then.
  const { verdict, after } = useMemo(() => {
    const liveResult = (f: string) => analysisService.liveResult(f);
    const after = positionEval(move.fenAfter, liveResult(move.fenAfter), null);
    return { verdict: variationVerdict(variation, index, analysed, liveResult, judge, false), after };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [move, variation, index, analysed, judge, live.version]);

  // The coach comments once the verdict has settled (deep enough), so his line does not change under you.
  const coachLine = useMemo(() => {
    if (!coach) return null;
    const liveResult = (f: string) => analysisService.liveResult(f);
    const settled = variationVerdict(variation, index, analysed, liveResult, judge, true);
    if (!settled) return null;
    const bestUci = liveResult(move.fenBefore)?.lines[0]?.pv[0] ?? (index === 0 ? analysed[variation.base]?.bestMove : null);
    const path = variation.moves.slice(0, index + 1).map((m) => m.uci).join(' ');
    return moveLine(coach, {
      key: `v:${gameId}:${variation.base}:${path}:${settled.cls}`,
      cls: settled.cls,
      actor: move.color === owner ? 'owner' : 'opponent',
      san: move.san,
      best: sanOf(move.fenBefore, bestUci),
      fenBefore: move.fenBefore,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coach, move, variation, index, analysed, judge, owner, gameId, live.version]);

  // The game's own move from the branch point, for "what if I had played this instead?".
  const gameMove = index === 0 ? analysed[variation.base] : undefined;
  const gamePly = index === 0 ? plies[variation.base] : undefined;
  const meta = verdict ? MOVE_CLASS_META[verdict.cls] : null;

  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex min-h-7 items-center gap-2">
        {verdict ? (
          <ClassMarker cls={verdict.cls} className="size-5" />
        ) : !after ? (
          <LoaderCircle className="size-5 animate-spin text-fg-subtle" aria-hidden />
        ) : null}
        <span className="font-display text-base font-semibold">{moveLabel(move.moveNumber, move.color, move.san)}</span>
        {meta ? (
          <span className={cn('text-sm font-semibold', meta.textClass)}>{meta.label}</span>
        ) : (
          <span className="text-sm text-fg-subtle">{after ? 'Not rated' : 'Evaluating…'}</span>
        )}
        {verdict ? (
          <EvalChange before={verdict.before} after={verdict.after} />
        ) : (
          after && <span className="ml-auto rounded-chip bg-surface-3 px-2 py-0.5 text-sm font-semibold tnum">{formatScore(after.score)}</span>
        )}
      </div>
      {coach && coachLine ? (
        <CoachBubble coach={coach} line={coachLine} compact />
      ) : (
        move.san.endsWith('#') && <p className="text-sm text-fg-muted">Checkmate! Checkmate is always the best move.</p>
      )}
      {gamePly && (
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-fg-muted">
          <span>In the game:</span>
          <span className="font-semibold text-fg">{moveLabel(gamePly.moveNumber, gamePly.color, gamePly.san)}</span>
          {gameMove && <ClassMarker cls={gameMove.classification} />}
          {gameMove && <span className="tnum">{formatScore(gameMove.evalAfter)}</span>}
          {gameMove && verdict && <Comparison edge={pointsEdge(move.color, judge.ratings[move.color], verdict.after, gameMove.evalAfter)} />}
        </p>
      )}
    </div>
  );
}

function EvalChange({ before, after }: { before: Score; after: Score }) {
  return (
    <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-chip bg-surface-3 px-2 py-0.5 text-sm font-semibold tnum">
      <span className="text-fg-muted">{formatScore(before)}</span>
      <ArrowRight className="size-3 text-fg-subtle" aria-label="to" />
      <span>{formatScore(after)}</span>
    </span>
  );
}

function Comparison({ edge }: { edge: number }) {
  // Same scale as move quality: a difference smaller than an inaccuracy is "about the same".
  const tone = edge >= EP_THRESHOLDS.inaccuracy ? 'better' : edge <= -EP_THRESHOLDS.inaccuracy ? 'worse' : 'same';
  return (
    <span className={cn('font-semibold', tone === 'better' ? 'text-best' : tone === 'worse' ? 'text-mistake' : 'text-fg-muted')}>
      · {tone === 'better' ? 'Yours is better' : tone === 'worse' ? 'The game move was better' : 'About the same'}
    </span>
  );
}

/** Stockfish's top lines for `fen` (tap one to play its first move); shared with the position analyser. */
export function EngineLines({ fen, live, onPlay }: { fen: string; live: LiveAnalysisState; onPlay: (uci: string) => void }) {
  const terminal = useMemo(() => terminalState(fen), [fen]);
  const fresh = live.fen === fen;
  const lines = fresh ? live.lines : [];
  const shown = useMemo(() => lines.map((l) => ({ score: l.score, line: sanLine(fen, l.pv) })).filter((l) => l.line), [fen, lines]);

  if (terminal) {
    return (
      <p className="flex items-center gap-2 border-t border-line-soft pt-2.5 text-sm font-semibold">
        {TERMINAL_LABEL[terminal.kind]}
        <span className="rounded-chip bg-surface-3 px-2 py-0.5 tnum">{formatScore(terminal.score)}</span>
      </p>
    );
  }

  const searching = fresh && live.searching;
  return (
    <div className="border-t border-line-soft pt-2">
      <div className="mb-1 flex h-6 items-center gap-1.5 text-xs text-fg-subtle">
        <Cpu className="size-3.5" aria-hidden />
        <span>Stockfish</span>
        <span className="tnum" aria-live="off">
          {fresh && live.depth > 0 ? `· depth ${live.depth}/${LIVE_MAX_DEPTH}` : searching ? '· starting' : ''}
        </span>
        {searching && <LoaderCircle className="size-3.5 animate-spin" aria-label="Analysing" />}
        {fresh && live.error && <span className="text-blunder">· {live.error}</span>}
      </div>
      <ul className="space-y-0.5">
        {[0, 1, 2].map((i) => {
          const l = shown[i];
          if (!l?.line) return <li key={i} className="h-9 rounded-chip bg-surface-2/40" aria-hidden />;
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => onPlay(l.line!.uci)}
                aria-label={`Play ${l.line.first}`}
                className="flex h-9 w-full items-center gap-2 rounded-chip px-1 text-left text-sm transition-colors hover:bg-surface-2 active:bg-surface-3"
              >
                <span
                  className={cn(
                    'w-12 shrink-0 rounded-[6px] py-0.5 text-center text-xs font-bold tnum',
                    whiteBetter(l.score) ? 'bg-eval-white text-eval-black' : 'bg-eval-black text-eval-white ring-1 ring-white/10',
                  )}
                >
                  {formatScore(l.score)}
                </span>
                <span className="shrink-0 font-semibold text-accent-strong">{l.line.first}</span>
                <span className="min-w-0 truncate text-fg-muted">{l.line.rest}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const whiteBetter = (s: Score) => (s.kind === 'checkmate' ? s.winner === 'white' : s.value >= 0);
