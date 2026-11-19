import { Bolt, Rabbit, Sun, Timer, type LucideIcon } from 'lucide-react';
import type { GameRecord, GameResult } from '../../lib/types';

/** Same icon per time class as the rating chips. */
export const TIME_CLASS_ICON: Record<string, LucideIcon> = {
  rapid: Timer,
  blitz: Bolt,
  bullet: Rabbit,
  daily: Sun,
};

export const RESULT_LABEL: Record<GameResult, string> = { win: 'Win', draw: 'Draw', loss: 'Loss' };

/** Card tint per result filter (accent when showing everything). */
export const RESULT_TINT = { all: 'accent', win: 'win', draw: 'draw', loss: 'loss' } as const;

export const opponentOf = (g: GameRecord) => (g.ownerColor === 'white' ? g.black : g.white);

/** Accuracy -> semantic text colour, using the move-quality scale. */
export function accuracyTone(acc: number): string {
  if (acc >= 90) return 'text-best';
  if (acc >= 80) return 'text-good';
  if (acc >= 70) return 'text-inaccuracy';
  if (acc >= 55) return 'text-mistake';
  return 'text-blunder';
}

/** '+71', '−40', '±0' with a real minus sign. */
export function formatDiff(n: number): string {
  const r = Math.round(n);
  if (r === 0) return '±0';
  return r > 0 ? `+${r}` : `−${Math.abs(r)}`;
}
