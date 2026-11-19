import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Chess, type Square } from 'chess.js';
import { Chessboard, type Arrow, type PieceDropHandlerArgs, type PieceHandlerArgs, type SquareHandlerArgs } from 'react-chessboard';
import { useBoardTheme } from '../../../components/chess/Board';
import { useMoveSound } from '../../../hooks/useMoveSound';
import { useSettings } from '../../../hooks/useServices';
import { playSound } from '../../../lib/sound';
import { cssVar } from '../../../lib/cssVar';
import type { Color } from '../../../lib/types';
import { PromotionPicker } from '../../puzzles/solve/PromotionPicker';

export interface SquarePair {
  from: string;
  to: string;
}

interface LessonBoardProps {
  fen: string;
  orientation: Color;
  /** Whether the learner may move now. */
  interactive: boolean;
  onMove: (uci: string) => void;
  lastMove: SquarePair | null;
  /** The move to play, drawn as an arrow (guided mode, or the second hint). */
  arrow: SquarePair | null;
  /** Square glowing as a hint (the piece to move). */
  glow: string | null;
  flash: { square: string; tone: 'good' | 'bad' } | null;
}

const tint = (color: string): CSSProperties => ({ backgroundImage: `linear-gradient(${color}, ${color})` });
const dot: CSSProperties = { backgroundImage: 'radial-gradient(circle, rgb(12 14 18 / 0.32) 17%, transparent 19%)' };
const ring: CSSProperties = { backgroundImage: 'radial-gradient(circle, transparent 62%, rgb(12 14 18 / 0.32) 64%)' };
const glowStyle: CSSProperties = {
  boxShadow: 'inset 0 0 0 3px var(--color-accent-strong)',
  backgroundImage: 'linear-gradient(var(--color-accent-soft), var(--color-accent-soft))',
};

/**
 * Interactive lesson board: drag or tap-tap, legal-move dots and promotion choice, the same
 * interaction as the puzzle board. It reports legal moves only; the player decides what they mean.
 */
export function LessonBoard({ fen, orientation, interactive, onMove, lastMove, arrow, glow, flash }: LessonBoardProps) {
  const theme = useBoardTheme();
  const showLegal = useSettings().showLegalMoves;
  useMoveSound(fen, lastMove, null, true, orientation);
  const [selected, setSelected] = useState<string | null>(null);
  const [promotion, setPromotion] = useState<SquarePair | null>(null);
  const turn = fen.split(' ')[1] === 'b' ? 'b' : 'w';

  const legal = useMemo(() => {
    const map = new Map<string, { to: string; capture: boolean; promotion: boolean }[]>();
    for (const m of new Chess(fen).moves({ verbose: true })) {
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
      styles[sq] =
        prev?.backgroundImage && style.backgroundImage
          ? { ...prev, ...style, backgroundImage: `${style.backgroundImage}, ${prev.backgroundImage}` }
          : { ...prev, ...style };
    };
    if (lastMove) {
      add(lastMove.from, tint('var(--color-board-highlight)'));
      add(lastMove.to, tint('var(--color-board-highlight)'));
    }
    if (flash) add(flash.square, tint(flash.tone === 'good' ? 'rgb(60 200 147 / 0.55)' : 'rgb(240 93 93 / 0.6)'));
    if (glow) add(glow, glowStyle);
    if (selected) {
      add(selected, tint('var(--color-board-select)'));
      if (showLegal) for (const m of legal.get(selected) ?? []) add(m.to, m.capture ? ring : dot);
    }
    return styles;
  }, [lastMove, flash, glow, selected, legal, showLegal]);

  const arrows = useMemo<Arrow[]>(
    () => (arrow ? [{ startSquare: arrow.from, endSquare: arrow.to, color: cssVar('--color-board-arrow') }] : []),
    [arrow],
  );

  return (
    <div className="relative">
      <Chessboard
        options={{
          ...theme,
          id: 'lesson-board',
          position: fen,
          boardOrientation: orientation,
          squareStyles,
          arrows,
          allowDragging: interactive,
          dragActivationDistance: 6,
          allowDragOffBoard: false,
          canDragPiece: ({ piece }) => interactive && ownPiece(piece.pieceType),
          onSquareClick,
          onPieceDrag,
          onPieceDrop,
        }}
      />
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
