import { AnimatePresence, motion } from 'motion/react';
import { MOVE_CLASS_META } from '../../lib/moveClass';
import type { Color, MoveClass } from '../../lib/types';
import { ClassGlyph } from './ClassMarker';

export interface BoardBadge {
  /** Square the badge sits on (the move's destination). */
  square: string;
  cls: MoveClass;
  /** Changes per move, so the badge pops in again on every step. */
  id: string | number;
}

/** Badge diameter as a fraction of one square. */
const SIZE = 0.48;
/** How far the badge hangs past the square's top-right corner, as a fraction of the badge. */
const OVERHANG = 0.3;

/**
 * Chess.com-style move-quality badge on the top-right corner of a square. Sized in container
 * units so it scales with the board, and clamped inside the board on the top rank / right file.
 * Render inside a positioned box exactly covering the board.
 */
export function MoveBadge({ badge, orientation }: { badge: BoardBadge | null | undefined; orientation: Color }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 [container-type:size]">
      <AnimatePresence>{badge && <Badge key={badge.id} badge={badge} orientation={orientation} />}</AnimatePresence>
    </div>
  );
}

function Badge({ badge, orientation }: { badge: BoardBadge; orientation: Color }) {
  const file = badge.square.charCodeAt(0) - 97;
  const rank = Number(badge.square[1]) - 1;
  const col = orientation === 'white' ? file : 7 - file;
  const row = orientation === 'white' ? 7 - rank : rank;
  const sq = 100 / 8;
  const size = sq * SIZE;
  // Top-right corner of the square, the badge hanging slightly past it, kept on the board.
  const left = Math.min(100 - size, (col + 1) * sq - size * (1 - OVERHANG));
  const top = Math.max(0, row * sq - size * OVERHANG);
  const meta = MOVE_CLASS_META[badge.cls];

  return (
    <motion.span
      className="absolute grid place-items-center rounded-full leading-none font-bold tracking-[-0.06em] text-white shadow-[0_1px_3px_rgb(0_0_0/0.45)] ring-[0.3cqw] ring-black/15"
      style={{
        left: `${left}cqw`,
        top: `${top}cqh`,
        width: `${size}cqw`,
        height: `${size}cqw`,
        fontSize: `${size * 0.48}cqw`,
        backgroundColor: meta.color,
        textShadow: '0 1px 1px rgb(0 0 0 / 0.3)',
      }}
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.08 } }}
      transition={{ type: 'spring', stiffness: 520, damping: 22, delay: 0.12 }}
    >
      <ClassGlyph cls={badge.cls} iconClassName="size-[58%] [filter:drop-shadow(0_1px_1px_rgb(0_0_0/0.3))]" />
    </motion.span>
  );
}
