import { useEffect } from 'react';
import { motion } from 'motion/react';
import type { Square } from 'chess.js';
import { usePieces } from '../../lib/boardStyle';
import type { Color } from '../../lib/types';

const CHOICES = [
  { piece: 'q', label: 'Queen' },
  { piece: 'n', label: 'Knight' },
  { piece: 'r', label: 'Rook' },
  { piece: 'b', label: 'Bishop' },
] as const;

interface PromotionPickerProps {
  square: Square;
  color: Color;
  orientation: Color;
  onPick: (piece: string) => void;
  onCancel: () => void;
}

/**
 * Column of promotion pieces over a dimmed board, dropping from the promotion square's edge
 * (top when the promoting side plays up the screen, bottom when it plays down).
 */
export function PromotionPicker({ square, color, orientation, onPick, onCancel }: PromotionPickerProps) {
  const file = square.charCodeAt(0) - 97;
  const column = orientation === 'white' ? file : 7 - file;
  const prefix = color === 'white' ? 'w' : 'b';
  const pieces = usePieces();
  const fromTop = color === orientation;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const choices = fromTop ? CHOICES : [...CHOICES].reverse();

  return (
    <div className="absolute inset-0 z-10" role="dialog" aria-label="Choose a promotion piece">
      <button type="button" aria-label="Cancel promotion" className="absolute inset-0 bg-ink/55" onClick={onCancel} />
      <motion.div
        className={
          'absolute flex w-[12.5%] flex-col overflow-hidden border border-line bg-surface-2 shadow-[0_16px_40px_rgb(0_0_0/0.55)] ' +
          (fromTop ? 'top-0 rounded-b-control border-t-0' : 'bottom-0 rounded-t-control border-b-0')
        }
        style={{ left: `${column * 12.5}%` }}
        initial={{ opacity: 0, y: fromTop ? -8 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      >
        {choices.map(({ piece, label }) => {
          const Piece = pieces[`${prefix}${piece.toUpperCase()}`];
          return (
            <button
              key={piece}
              type="button"
              aria-label={label}
              onClick={() => onPick(piece)}
              className="aspect-square w-full p-0.5 transition-colors hover:bg-surface-3 active:bg-accent-soft"
            >
              {Piece?.({ svgStyle: { width: '100%', height: '100%' } })}
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}
