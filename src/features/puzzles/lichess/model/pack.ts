import { Chess } from 'chess.js';
import type { LichessPuzzle } from '../../../../lib/types';

/** Row of data/pack.json: [id, fen before the set-up move, set-up move + solution (UCI), rating, theme indexes]. */
type PackRow = [string, string, string, number, number[]];
interface PackFile {
  v: number;
  themes: string[];
  puzzles: PackRow[];
}

/** Plays the opponent's set-up move so the puzzle starts with the player to move. */
export function fromPackRow([id, fen, moves, rating, themeIdx]: PackRow, themes: string[]): LichessPuzzle {
  const [setup, ...solution] = moves.split(' ');
  const chess = new Chess(fen);
  chess.move({ from: setup!.slice(0, 2), to: setup!.slice(2, 4), promotion: setup![4] });
  return { id, fen: chess.fen(), lastMove: setup!, solution, rating, themes: themeIdx.map((i) => themes[i]!).filter(Boolean) };
}

let cached: Promise<LichessPuzzle[]> | null = null;

/**
 * The bundled pack (built by scripts/build-lichess-pack.mjs), sorted by rating. Loaded on first
 * use as its own chunk, so it costs nothing until the Lichess tab opens.
 */
export function loadPack(): Promise<LichessPuzzle[]> {
  cached ??= import('../data/pack.json').then((m) => {
    const file = (m.default ?? m) as unknown as PackFile;
    return file.puzzles.map((row) => fromPackRow(row, file.themes));
  });
  return cached;
}

/**
 * A puzzle near `rating`, not in `exclude`: random within ±75, widening to ±150, ±300, then
 * the closest left. Null only when every puzzle has been played.
 */
export function pickNear(pack: LichessPuzzle[], rating: number, exclude: Set<string>): LichessPuzzle | null {
  const open = pack.filter((p) => !exclude.has(p.id));
  if (open.length === 0) return null;
  for (const width of [75, 150, 300]) {
    const near = open.filter((p) => Math.abs(p.rating - rating) <= width);
    if (near.length) return near[Math.floor(Math.random() * near.length)]!;
  }
  return open.reduce((best, p) => (Math.abs(p.rating - rating) < Math.abs(best.rating - rating) ? p : best));
}
