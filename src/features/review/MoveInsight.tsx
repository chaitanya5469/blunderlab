import { useMemo } from 'react';
import { FlaskConical } from 'lucide-react';
import { ClassMarker } from '../../components/chess/ClassMarker';
import { cn } from '../../lib/cn';
import { formatScore } from '../../lib/evaluation';
import { FLAGGED_CLASSES, MOVE_CLASS_META } from '../../lib/moveClass';
import { uciLineToSan } from '../../lib/pgn';
import type { MoveAnalysis, ParsedPly } from '../../lib/types';

interface MoveInsightProps {
  ply: ParsedPly | undefined;
  move: MoveAnalysis | undefined;
  /** Plays the engine's better move instead of this one (opens a variation). */
  onTryBest?: (uci: string) => void;
  /** The coach comments on this position elsewhere (his bubble replaces the plain explanation). */
  coached?: boolean;
}

/** What happened on the current move: class, eval, and the engine's better line. */
export function MoveInsight({ ply, move, onTryBest, coached }: MoveInsightProps) {
  const line = useMemo(() => (move?.pv.length ? uciLineToSan(move.fenBefore, move.pv, 6) : []), [move]);

  if (!ply) {
    if (coached) return <p className="px-1 text-xs text-fg-subtle">Step through the game, or move a piece to try your own line.</p>;
    return (
      <div className="flex min-h-16 items-center rounded-card bg-surface-1 px-4 text-sm text-fg-muted">
        Starting position. Step through the game, or move a piece to try your own line.
      </div>
    );
  }

  const prefix = `${ply.moveNumber}${ply.color === 'white' ? '.' : '…'}`;
  const flagged = move && FLAGGED_CLASSES.includes(move.classification);

  return (
    <div className="min-h-16 rounded-card bg-surface-1 px-4 py-3" aria-live="polite">
      <div className="flex items-center gap-2">
        {move && <ClassMarker cls={move.classification} className="size-5" />}
        <span className="font-display text-lg font-semibold">
          {prefix} {ply.san}
        </span>
        {move && (
          <span className={cn('text-sm font-semibold', MOVE_CLASS_META[move.classification].textClass)}>{MOVE_CLASS_META[move.classification].label}</span>
        )}
        {move && <span className="ml-auto rounded-chip bg-surface-3 px-2 py-0.5 text-sm font-semibold tnum">{formatScore(move.evalAfter)}</span>}
      </div>
      {flagged && move.bestMoveSan && (
        <div className="mt-1.5 flex items-center gap-3">
          <p className="min-w-0 flex-1 text-sm text-fg-muted">
            Best was <span className="font-semibold text-best">{move.bestMoveSan}</span>
            {line.length > 1 && <span className="text-fg-subtle"> · {line.slice(1).join(' ')}</span>}
          </p>
          {onTryBest && move.bestMove && (
            <button
              type="button"
              onClick={() => onTryBest(move.bestMove!)}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-control border border-best/30 bg-best/12 px-3 text-sm font-semibold text-best transition-colors hover:bg-best/20 active:bg-best/20"
            >
              <FlaskConical className="size-4" aria-hidden />
              Try best move
            </button>
          )}
        </div>
      )}
      {!coached && (
        <>
      {ply.san.endsWith('#') && <p className="mt-1.5 text-sm text-fg-muted">Checkmate! Checkmate is always the best move.</p>}
      {move && !ply.san.endsWith('#') && move.classification === 'best' && <p className="mt-1.5 text-sm text-fg-muted">The engine's top choice.</p>}
      {move && move.classification === 'brilliant' && <p className="mt-1.5 text-sm text-fg-muted">A sound sacrifice: material offered, and the engine agrees.</p>}
      {move && move.classification === 'great' && (
        <p className="mt-1.5 text-sm text-fg-muted">
          A critical find: the engine's top choice, and the alternatives were clearly worse
          {move.secondBest?.san && (
            <span className="text-fg-subtle">
              {' '}
              (next best {move.secondBest.san} {formatScore(move.secondBest.score)})
            </span>
          )}
          .
        </p>
      )}
      {move && move.classification === 'book' && <p className="mt-1.5 text-sm text-fg-muted">Opening theory.</p>}
        </>
      )}
    </div>
  );
}
