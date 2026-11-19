import { useMemo } from 'react';
import { Chessboard, defaultArrowOptions, type Arrow } from 'react-chessboard';
import { usePieces } from '../../lib/boardStyle';
import { cssVar } from '../../lib/cssVar';
import type { Color } from '../../lib/types';

interface BoardProps {
  fen: string;
  orientation: Color;
  /** Squares of the last move, highlighted. */
  lastMove?: { from: string; to: string } | null;
  /** UCI move drawn as an arrow (e.g. the engine's better move). */
  arrowUci?: string | null;
  id?: string;
}

const tint = (color: string) => ({ backgroundImage: `linear-gradient(${color}, ${color})` });

/**
 * Read-only board with the BlunderLab theme. For interactive boards (puzzles),
 * pass extra options to react-chessboard directly but reuse `boardTheme`.
 */
export function Board({ fen, orientation, lastMove, arrowUci, id = 'board' }: BoardProps) {
  const squareStyles = useMemo(() => {
    if (!lastMove) return {};
    const t = tint('var(--color-board-highlight)');
    return { [lastMove.from]: t, [lastMove.to]: t };
  }, [lastMove]);

  const theme = useBoardTheme();
  const arrows = useMemo<Arrow[]>(
    () => (arrowUci ? [{ startSquare: arrowUci.slice(0, 2), endSquare: arrowUci.slice(2, 4), color: cssVar('--color-board-arrow') }] : []),
    [arrowUci],
  );

  return (
    <div className="overflow-hidden rounded-[10px] shadow-[0_10px_40px_-12px_rgb(0_0_0/0.7)] ring-1 ring-white/5">
      <Chessboard options={{ ...theme, id, position: fen, boardOrientation: orientation, squareStyles, arrows, allowDragging: false }} />
    </div>
  );
}

const HALO_ON_DARK = '0 0 2px var(--color-board-dark), 0 0 2px var(--color-board-dark)';
const HALO_ON_LIGHT = '0 0 2px var(--color-board-light), 0 0 2px var(--color-board-light)';
const NOTATION = { fontSize: '9px', lineHeight: 1, fontWeight: 700, position: 'absolute', zIndex: 5, pointerEvents: 'none', userSelect: 'none' } as const;

/** Shared board styling (colours from design tokens). */
export const boardTheme = {
  darkSquareStyle: { backgroundColor: 'var(--color-board-dark)' },
  lightSquareStyle: { backgroundColor: 'var(--color-board-light)' },
  // Notation sits in the square corners, above the piece layer, with a thin halo in the square's own
  // colour so it stays legible where it brushes a piece glyph.
  darkSquareNotationStyle: { color: 'var(--color-board-light)', textShadow: HALO_ON_DARK },
  lightSquareNotationStyle: { color: 'var(--color-board-notation)', textShadow: HALO_ON_LIGHT },
  alphaNotationStyle: { ...NOTATION, bottom: 1, right: 3 },
  numericNotationStyle: { ...NOTATION, top: 1, left: 3 },
  showAnimations: true,
  animationDurationInMs: 180,
  allowDrawingArrows: false,
  arrowOptions: { ...defaultArrowOptions, arrowWidthDenominator: 6, opacity: 0.85 },
} satisfies Parameters<typeof Chessboard>[0]['options'];

/** `boardTheme` plus the owner's chosen piece set; spread into react-chessboard options. */
export function useBoardTheme() {
  const pieces = usePieces();
  return useMemo(() => ({ ...boardTheme, pieces }), [pieces]);
}
