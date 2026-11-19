import { memo } from 'react';
import { usePieces } from '../../../lib/boardStyle';
import { cn } from '../../../lib/cn';
import type { Color } from '../../../lib/types';

/** Board rows from a FEN, top rank first, each square a piece code like 'wN' or null. */
function rows(fen: string): (string | null)[][] {
  return fen
    .split(' ')[0]!
    .split('/')
    .map((rank) =>
      [...rank].flatMap((ch) => {
        if (/\d/.test(ch)) return Array<null>(Number(ch)).fill(null);
        return [`${ch === ch.toUpperCase() ? 'w' : 'b'}${ch.toUpperCase()}`];
      }),
    );
}

/**
 * Lightweight static board for cards: plain squares and the app's piece set, no
 * react-chessboard instance (lists show many of these at once).
 */
export const MiniBoard = memo(function MiniBoard({ fen, orientation, className }: { fen: string; orientation: Color; className?: string }) {
  const pieces = usePieces();
  let grid = rows(fen);
  if (orientation === 'black') grid = grid.map((r) => [...r].reverse()).reverse();
  return (
    <div className={cn('grid aspect-square grid-cols-8 overflow-hidden rounded-[6px] ring-1 ring-white/5', className)} aria-hidden>
      {grid.flatMap((row, r) =>
        row.map((piece, c) => {
          const Piece = piece ? pieces[piece] : undefined;
          return (
            <div key={`${r}-${c}`} className={(r + c) % 2 === 0 ? 'bg-board-light' : 'bg-board-dark'}>
              {Piece?.({ svgStyle: { width: '100%', height: '100%', display: 'block' } })}
            </div>
          );
        }),
      )}
    </div>
  );
});
