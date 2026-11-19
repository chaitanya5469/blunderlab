import type { MoveClass } from './types';

export interface MoveClassMeta {
  label: string;
  /** Short annotation glyph shown in markers (null = icon/none). */
  symbol: string | null;
  /** CSS colour (token variable) for SVG/inline-style use. */
  color: string;
  /** Tailwind classes using the same token. */
  textClass: string;
  bgClass: string;
}

export const MOVE_CLASS_META: Record<MoveClass, MoveClassMeta> = {
  book: { label: 'Book', symbol: null, color: 'var(--color-book)', textClass: 'text-book', bgClass: 'bg-book' },
  brilliant: { label: 'Brilliant', symbol: '!!', color: 'var(--color-brilliant)', textClass: 'text-brilliant', bgClass: 'bg-brilliant' },
  great: { label: 'Great', symbol: '!', color: 'var(--color-great)', textClass: 'text-great', bgClass: 'bg-great' },
  best: { label: 'Best', symbol: null, color: 'var(--color-best)', textClass: 'text-best', bgClass: 'bg-best' },
  excellent: { label: 'Excellent', symbol: null, color: 'var(--color-excellent)', textClass: 'text-excellent', bgClass: 'bg-excellent' },
  good: { label: 'Good', symbol: null, color: 'var(--color-good)', textClass: 'text-good', bgClass: 'bg-good' },
  inaccuracy: { label: 'Inaccuracy', symbol: '?!', color: 'var(--color-inaccuracy)', textClass: 'text-inaccuracy', bgClass: 'bg-inaccuracy' },
  mistake: { label: 'Mistake', symbol: '?', color: 'var(--color-mistake)', textClass: 'text-mistake', bgClass: 'bg-mistake' },
  miss: { label: 'Miss', symbol: null, color: 'var(--color-miss)', textClass: 'text-miss', bgClass: 'bg-miss' },
  blunder: { label: 'Blunder', symbol: '??', color: 'var(--color-blunder)', textClass: 'text-blunder', bgClass: 'bg-blunder' },
};

/** Classes worth flagging on the board/graph (the played move was meaningfully worse). */
export const FLAGGED_CLASSES: MoveClass[] = ['inaccuracy', 'mistake', 'miss', 'blunder'];
