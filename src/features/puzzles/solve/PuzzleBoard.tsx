import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Chess, type Square } from 'chess.js';
import { Chessboard, type PieceDropHandlerArgs, type PieceHandlerArgs, type SquareHandlerArgs } from 'react-chessboard';
import { useBoardTheme } from '../../../components/chess/Board';
import type { Color } from '../../../lib/types';
import { useMoveSound } from '../../../hooks/useMoveSound';
import { useSettings } from '../../../hooks/useServices';
import { playSound } from '../../../lib/sound';
import { PromotionPicker } from './PromotionPicker';
import type { LastMove } from './usePuzzleSolver';

interface PuzzleBoardProps {
  fen: string;
  orientation: Color;
  /** Whether the owner may move now. */
  interactive: boolean;
  onMove: (uci: string) => void;
  lastMove: LastMove | null;
  flash: { square: string; tone: 'good' | 'bad' } | null;
  hint: { from: string; to: string | null } | null;
}

const tint = (color: string): CSSProperties => ({ backgroundImage: `linear-gradient(${color}, ${color})` });
const dot: CSSProperties = { backgroundImage: 'radial-gradient(circle, rgb(12 14 18 / 0.32) 17%, transparent 19%)' };
const ring: CSSProperties = { backgroundImage: 'radial-gradient(circle, transparent 62%, rgb(12 14 18 / 0.32) 64%)' };
const hintGlow: CSSProperties = { boxShadow: 'inset 0 0 0 3px var(--color-accent-strong)', backgroundImage: 'linear-gradient(var(--color-accent-soft), var(--color-accent-soft))' };

type Pending = { from: string; to: string };

/**
 * Interactive themed board: drag or tap-tap to move, legal-move dots, promotion choice.
 * It only reports legal moves; the parent decides what happens to them.
 */
export function PuzzleBoard({ fen, orientation, interactive, onMove, lastMove, flash, hint }: PuzzleBoardProps) {
  const theme = useBoardTheme();
  const showLegal = useSettings().showLegalMoves;
  useMoveSound(fen, lastMove, null, true, orientation);
  const [selected, setSelected] = useState<string | null>(null);
  const [promotion, setPromotion] = useState<Pending | null>(null);
  const turn = fen.split(' ')[1] === 'b' ? 'b' : 'w';

  // Legal moves of the side to move, grouped by origin square.
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

  // react-chessboard keeps the drop handler from drag start; read the latest props through refs.
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
      styles[sq] = prev?.backgroundImage && style.backgroundImage ? { ...prev, ...style, backgroundImage: `${style.backgroundImage}, ${prev.backgroundImage}` } : { ...prev, ...style };
    };
    if (lastMove) {
      add(lastMove.from, tint('var(--color-board-highlight)'));
      add(lastMove.to, tint('var(--color-board-highlight)'));
    }
    if (flash) add(flash.square, tint(flash.tone === 'good' ? 'rgb(60 200 147 / 0.55)' : 'rgb(240 93 93 / 0.6)'));
    if (hint) {
      add(hint.from, hintGlow);
      if (hint.to) add(hint.to, hintGlow);
    }
    if (selected) {
      add(selected, tint('var(--color-board-select)'));
      if (showLegal) for (const m of legal.get(selected) ?? []) add(m.to, m.capture ? ring : dot);
    }
    return styles;
  }, [lastMove, flash, hint, selected, legal, showLegal]);

  return (
    <div className="relative">
      <Chessboard
        options={{
          ...theme,
          id: 'puzzle-board',
          position: fen,
          boardOrientation: orientation,
          squareStyles,
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
