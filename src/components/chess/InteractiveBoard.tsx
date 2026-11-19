import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Chess, type Square } from 'chess.js';
import { Chessboard, type Arrow, type PieceDropHandlerArgs, type PieceHandlerArgs, type SquareHandlerArgs } from 'react-chessboard';
import { cn } from '../../lib/cn';
import { cssVar } from '../../lib/cssVar';
import type { Color, MoveClass } from '../../lib/types';
import { useMoveSound } from '../../hooks/useMoveSound';
import { useSettings } from '../../hooks/useServices';
import { playSound } from '../../lib/sound';
import { useBoardTheme } from './Board';
import { MoveBadge, type BoardBadge } from './MoveBadge';
import { PromotionPicker } from './PromotionPicker';

export interface SquarePair {
  from: string;
  to: string;
}

/** An arrow on the board; `color` is a CSS colour (defaults to the board arrow token). */
export interface BoardArrow extends SquarePair {
  color?: string;
}

/**
 * A square highlight: `good` / `bad` flash a move's result, `glow` marks a hint square,
 * `tint` paints the last-move colour.
 */
export interface SquareMark {
  square: string;
  kind: 'good' | 'bad' | 'glow' | 'tint';
}

export interface InteractiveBoardProps {
  fen: string;
  /** Colour at the bottom of the board. */
  orientation: Color;
  /** Whether moves may be made now (the side to move in `fen` moves). Default true. */
  interactive?: boolean;
  /** Called with each legal move as UCI (`e2e4`, `e7e8q`); the parent decides what it means. */
  onMove: (uci: string) => void;
  lastMove?: SquarePair | null;
  /** CSS colour for the last-move tint (default: the board highlight token). */
  lastMoveColor?: string;
  /** Move-quality badge on a square (Game Review). */
  badge?: BoardBadge | null;
  arrows?: BoardArrow[];
  marks?: SquareMark[];
  /** Distinct per board on a page (react-chessboard uses it for drag-and-drop). */
  id?: string;
  /** Adds the read-only board's frame (rounded corners, shadow). */
  framed?: boolean;
  /** Move sounds when the position advances by `lastMove` (default true). */
  sounds?: boolean;
  /** Extra chime for the shown move's class (great / brilliant), Game Review. */
  soundCue?: MoveClass | null;
  /** The colour whose moves sound as "yours"; the other side's sound as the opponent's (default: all yours). */
  soundSide?: Color;
  className?: string;
}

const tint = (color: string): CSSProperties => ({ backgroundImage: `linear-gradient(${color}, ${color})` });
const dot: CSSProperties = { backgroundImage: 'radial-gradient(circle, rgb(12 14 18 / 0.32) 17%, transparent 19%)' };
const ring: CSSProperties = { backgroundImage: 'radial-gradient(circle, transparent 62%, rgb(12 14 18 / 0.32) 64%)' };
const MARK_STYLES: Record<SquareMark['kind'], CSSProperties> = {
  good: tint('rgb(60 200 147 / 0.55)'),
  bad: tint('rgb(240 93 93 / 0.6)'),
  glow: { boxShadow: 'inset 0 0 0 3px var(--color-accent-strong)', backgroundImage: 'linear-gradient(var(--color-accent-soft), var(--color-accent-soft))' },
  tint: tint('var(--color-board-highlight)'),
};

type LegalTarget = { to: string; capture: boolean; promotion: boolean };

/**
 * Interactive themed board: drag or tap-tap to move, legal-move dots and rings, promotion choice.
 * It only reports legal moves for the side to move; it never changes the position itself.
 */
export function InteractiveBoard({
  fen,
  orientation,
  interactive = true,
  onMove,
  lastMove,
  lastMoveColor,
  badge,
  arrows,
  marks,
  id = 'interactive-board',
  framed,
  className,
  sounds = true,
  soundCue,
  soundSide,
}: InteractiveBoardProps) {
  const theme = useBoardTheme();
  const showLegal = useSettings().showLegalMoves;
  useMoveSound(fen, lastMove, soundCue, sounds, soundSide);
  const [selected, setSelected] = useState<string | null>(null);
  const [promotion, setPromotion] = useState<SquarePair | null>(null);
  const turn = fen.split(' ')[1] === 'b' ? 'b' : 'w';

  // Legal moves of the side to move, grouped by origin square.
  const legal = useMemo(() => {
    const map = new Map<string, LegalTarget[]>();
    for (const m of legalMoves(fen)) {
      const list = map.get(m.from) ?? [];
      if (!list.some((x) => x.to === m.to)) list.push({ to: m.to, capture: m.isCapture(), promotion: m.isPromotion() });
      map.set(m.from, list);
    }
    return map;
  }, [fen]);

  useEffect(() => {
    setSelected(null);
    setPromotion(null);
  }, [fen, interactive]);

  // react-chessboard keeps the drop handler from drag start; read the latest props through a ref.
  const latest = useRef({ legal, interactive, onMove });
  useEffect(() => {
    latest.current = { legal, interactive, onMove };
  });

  /** Plays from -> to if legal; asks for the piece when promoting. Returns whether a move was made. */
  const attempt = useCallback((from: string, to: string): boolean => {
    const target = latest.current.legal.get(from)?.find((m) => m.to === to);
    if (!target || !latest.current.interactive) return false;
    setSelected(null);
    if (target.promotion) {
      setPromotion({ from, to });
      return false;
    }
    latest.current.onMove(from + to);
    return true;
  }, []);

  const ownPiece = (pieceType: string | undefined) => !!pieceType && pieceType[0] === turn;

  const onSquareClick = ({ square, piece }: SquareHandlerArgs) => {
    if (!interactive) return;
    if (selected && selected !== square && attempt(selected, square)) return;
    if (promotion) return;
    if (ownPiece(piece?.pieceType) && legal.has(square)) setSelected(selected === square ? null : square);
    else setSelected(null);
  };

  const onPieceDrag = ({ square }: PieceHandlerArgs) => {
    if (square && latest.current.legal.has(square)) setSelected(square);
  };

  const onPieceDrop = ({ sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
    if (!targetSquare || targetSquare === sourceSquare) return false;
    const ok = attempt(sourceSquare, targetSquare);
    if (!ok && interactive && !latest.current.legal.get(sourceSquare)?.some((m) => m.to === targetSquare)) playSound('illegal');
    return ok;
  };

  const squareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {};
    const add = (sq: string, style: CSSProperties) => {
      const prev = styles[sq];
      // Layer background images so a dot can sit on a highlighted square.
      styles[sq] =
        prev?.backgroundImage && style.backgroundImage
          ? { ...prev, ...style, backgroundImage: `${style.backgroundImage}, ${prev.backgroundImage}` }
          : { ...prev, ...style };
    };
    if (lastMove) {
      const t = lastMoveColor ? tint(`color-mix(in srgb, ${lastMoveColor} 46%, transparent)`) : MARK_STYLES.tint;
      add(lastMove.from, t);
      add(lastMove.to, t);
    }
    for (const m of marks ?? []) add(m.square, MARK_STYLES[m.kind]);
    if (selected) {
      add(selected, tint('var(--color-board-select)'));
      if (showLegal) for (const m of legal.get(selected) ?? []) add(m.to, m.capture ? ring : dot);
    }
    return styles;
  }, [lastMove, lastMoveColor, marks, selected, legal, showLegal]);

  const boardArrows = useMemo<Arrow[]>(
    () => (arrows ?? []).map((a) => ({ startSquare: a.from, endSquare: a.to, color: a.color ?? cssVar('--color-board-arrow') })),
    [arrows],
  );

  return (
    <div className={cn('relative', framed && 'overflow-hidden rounded-[10px] shadow-[0_10px_40px_-12px_rgb(0_0_0/0.7)] ring-1 ring-white/5', className)}>
      <Chessboard
        options={{
          ...theme,
          id,
          position: fen,
          boardOrientation: orientation,
          squareStyles,
          arrows: boardArrows,
          allowDragging: interactive,
          dragActivationDistance: 6,
          allowDragOffBoard: false,
          canDragPiece: ({ piece }) => interactive && ownPiece(piece.pieceType),
          onSquareClick,
          onPieceDrag,
          onPieceDrop,
        }}
      />
      {badge !== undefined && <MoveBadge badge={badge} orientation={orientation} />}
      {promotion && (
        <PromotionPicker
          square={promotion.to as Square}
          color={turn === 'w' ? 'white' : 'black'}
          orientation={orientation}
          onPick={(piece) => {
            setPromotion(null);
            onMove(promotion.from + promotion.to + piece);
          }}
          onCancel={() => setPromotion(null)}
        />
      )}
    </div>
  );
}

function legalMoves(fen: string) {
  try {
    return new Chess(fen).moves({ verbose: true });
  } catch {
    return [];
  }
}
