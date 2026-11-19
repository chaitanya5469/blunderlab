import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Chessboard, ChessboardProvider, SparePiece, type PieceDropHandlerArgs, type PositionDataType, type SquareHandlerArgs } from 'react-chessboard';
import { Eraser, Hand } from 'lucide-react';
import { useBoardTheme } from '../../../components/chess/Board';
import { useBoardFit } from '../../../hooks/useBoardFit';
import { cn } from '../../../lib/cn';
import type { Color } from '../../../lib/types';
import { edit, editorStore } from '../model/editorStore';
import { PIECE_CODES, pieceName, sqIndex, sqName, type BoardArray, type PieceCode } from '../model/position';

/** What a tap on the board does: move (select then tap a target), place a piece, or erase. */
export type Brush = PieceCode | 'erase' | null;

interface EditorBoardProps {
  board: BoardArray;
  orientation: Color;
  /** Recognition confidence of unsure squares (0..1), shown as a faint marker. */
  confidence: Record<string, number> | null;
  loadId: number;
  /** Extra controls at the end of the tool row (undo, flip, side to move). */
  tools?: ReactNode;
  /** Short status shown before the tool hint (e.g. "White to move"). */
  status?: string;
}

const tint = (color: string): CSSProperties => ({ backgroundImage: `linear-gradient(${color}, ${color})` });
// Unsure squares: a soft amber inner ring, stronger the less sure the recogniser was.
export const unsureSquareStyle = (c: number): CSSProperties => ({
  boxShadow: `inset 0 0 0 ${c < 0.6 ? 3 : 2}px rgb(233 196 94 / ${c < 0.6 ? 0.95 : 0.6})`,
  backgroundImage: `linear-gradient(rgb(233 196 94 / ${c < 0.6 ? 0.22 : 0.12}), rgb(233 196 94 / ${c < 0.6 ? 0.22 : 0.12}))`,
});

/** Drops a square's "check me" marker once the user has edited it. */
function clearMarks(squares: string[]) {
  const conf = editorStore.get().confidence;
  if (!conf || !squares.some((s) => s in conf)) return;
  const next = { ...conf };
  for (const s of squares) delete next[s];
  editorStore.set({ confidence: next });
}

function setSquares(changes: [string, PieceCode | null][]) {
  edit((pos) => {
    const board = pos.board.slice();
    for (const [sq, p] of changes) board[sqIndex(sq)] = p;
    return { ...pos, board };
  });
  clearMarks(changes.map(([sq]) => sq));
}

/**
 * The editing board, sized to fit the screen, plus its one-row piece tray and tool row. Drag pieces between squares, drag a tray piece on,
 * drag a piece off the board to remove it; or pick a tray piece / the eraser and tap squares.
 */
export function EditorBoard({ board, orientation, confidence, loadId, tools, status }: EditorBoardProps) {
  const theme = useBoardTheme();
  const [brush, setBrush] = useState<Brush>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => setSelected(null), [loadId, brush]);

  const position = useMemo(() => {
    const p: PositionDataType = {};
    board.forEach((piece, i) => {
      if (piece) p[sqName(i)] = { pieceType: piece };
    });
    return p;
  }, [board]);

  const onSquareClick = ({ square }: SquareHandlerArgs) => {
    const here = board[sqIndex(square)] ?? null;
    if (brush === 'erase') {
      if (here) setSquares([[square, null]]);
      return;
    }
    if (brush) {
      // Tapping the same piece again takes it off: quick to correct a mis-tap.
      setSquares([[square, here === brush ? null : brush]]);
      return;
    }
    if (selected) {
      if (selected !== square) setSquares([[square, board[sqIndex(selected)] ?? null], [selected, null]]);
      setSelected(null);
      return;
    }
    if (here) setSelected(square);
  };

  const onPieceDrop = ({ piece, sourceSquare, targetSquare }: PieceDropHandlerArgs) => {
    setSelected(null);
    const type = piece.pieceType as PieceCode;
    if (piece.isSparePiece) {
      if (!targetSquare) return false;
      setSquares([[targetSquare, type]]);
      return true;
    }
    if (!targetSquare) {
      setSquares([[sourceSquare, null]]);
      return true;
    }
    if (targetSquare === sourceSquare) return false;
    setSquares([[targetSquare, type], [sourceSquare, null]]);
    return true;
  };

  // react-chessboard keeps handlers from the start of a drag; route them through a ref.
  const latest = useRef({ onSquareClick, onPieceDrop });
  useEffect(() => {
    latest.current = { onSquareClick, onPieceDrop };
  });

  const squareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {};
    for (const [sq, c] of Object.entries(confidence ?? {})) styles[sq] = unsureSquareStyle(c);
    if (selected) styles[selected] = { ...styles[selected], ...tint('var(--color-board-select)') };
    return styles;
  }, [confidence, selected]);

  // One tray row: the colour at the bottom of the board first.
  const tray: PieceCode[] = orientation === 'white' ? PIECE_CODES : [...PIECE_CODES.slice(6), ...PIECE_CODES.slice(0, 6)];
  const fit = useBoardFit();

  return (
    <ChessboardProvider
      options={{
        ...theme,
        id: 'editor-board',
        position,
        boardOrientation: orientation,
        squareStyles,
        showAnimations: false,
        allowDragging: true,
        allowDragOffBoard: true,
        dragActivationDistance: 6,
        onSquareClick: (a) => latest.current.onSquareClick(a),
        onPieceDrop: (a) => latest.current.onPieceDrop(a),
      }}
    >
      {/* Fills the space between the header and the bottom bar; the board takes min(width, height left). */}
      <div ref={fit.area} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div ref={fit.block} className="shrink-0">
          <div
            ref={fit.board}
            className="mx-auto touch-none overflow-hidden rounded-[10px] shadow-[0_10px_40px_-12px_rgb(0_0_0/0.7)] ring-1 ring-white/5"
            style={fit.size ? { width: fit.size } : undefined}
          >
            <Chessboard />
          </div>
          <Tray pieces={tray} brush={brush} onBrush={setBrush} />
          <div className="mt-2 flex items-center gap-1.5">
            <ToolChip active={brush === null} onClick={() => setBrush(null)} icon={<Hand className="size-4" aria-hidden />} label="Move" />
            <ToolChip active={brush === 'erase'} onClick={() => setBrush(brush === 'erase' ? null : 'erase')} icon={<Eraser className="size-4" aria-hidden />} label="Erase" />
            {tools}
          </div>
          <p className="mt-1.5 truncate px-0.5 text-2xs leading-tight text-fg-subtle">
            {status && <span className="font-semibold text-fg-muted">{status} · </span>}
            {brush === 'erase'
              ? 'Tap pieces to remove them'
              : brush
                ? `Tap squares to place a ${pieceName(brush)}`
                : 'Drag pieces, or drag one off the board to remove it'}
          </p>
        </div>
      </div>
    </ChessboardProvider>
  );
}

function Tray({ pieces, brush, onBrush }: { pieces: PieceCode[]; brush: Brush; onBrush: (b: Brush) => void }) {
  return (
    <div className="mt-2 grid grid-cols-12 gap-0.5 rounded-control bg-board-dark/45 p-1 ring-1 ring-line-soft" role="group" aria-label="Pieces">
      {pieces.map((p) => {
        const active = brush === p;
        return (
          <div
            key={p}
            role="button"
            tabIndex={0}
            aria-pressed={active}
            aria-label={`Place ${pieceName(p)}`}
            onClick={() => onBrush(active ? null : p)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onBrush(active ? null : p)}
            className={cn(
              'aspect-square touch-none rounded-[6px] transition-colors',
              active ? 'bg-accent/30 ring-2 ring-accent-strong' : 'hover:bg-surface-3',
            )}
          >
            <SparePiece pieceType={p} />
          </div>
        );
      })}
    </div>
  );
}

function ToolChip({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1 rounded-chip px-2.5 text-sm font-semibold transition-colors',
        active ? 'bg-accent-soft text-accent-strong ring-1 ring-accent/40' : 'bg-surface-2 text-fg-muted hover:text-fg',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
