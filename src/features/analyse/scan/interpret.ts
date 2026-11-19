import type { Color } from '../../../lib/types';
import { emptyPosition, possibleCastling, sqName, type BoardArray, type EditorPosition, type PieceCode } from '../model/position';

/** What the classifier saw, in the image's own grid (row 0 = the board's top edge in the image). */
export interface ImageGrid {
  pieces: (PieceCode | null)[];
  confidence: number[];
  /** Squares below this confidence are flagged (calibrated per model on validation data). */
  unsureBelow: number;
}

export function gridFromProbs(probs: Float32Array, classes: string[], unsureBelow: number): ImageGrid {
  const n = classes.length;
  const pieces: (PieceCode | null)[] = [];
  const confidence: number[] = [];
  for (let i = 0; i < 64; i++) {
    let best = 0;
    for (let c = 1; c < n; c++) if (probs[i * n + c]! > probs[i * n + best]!) best = c;
    pieces.push(classes[best] === 'empty' ? null : (classes[best] as PieceCode));
    confidence.push(probs[i * n + best]!);
  }
  return { pieces, confidence, unsureBelow };
}

/**
 * Image grid -> chess grid (row 0 = rank 8, column 0 = file a) after turning the image a quarter
 * turn clockwise `k` times.
 */
export function rotate<T>(grid: T[], k: number): T[] {
  let g = grid;
  for (let t = 0; t < ((k % 4) + 4) % 4; t++) {
    const next: T[] = new Array(64);
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) next[r * 8 + c] = g[(7 - c) * 8 + r]!;
    g = next;
  }
  return g;
}

const WEIGHT: Record<string, number> = { P: 1, K: 1.5, Q: 0.4, R: 0.6, B: 0.4, N: 0.4 };

/** How much a chess grid looks like White plays up the board (pawns and king near White's side). */
function homeScore(grid: (PieceCode | null)[]): number {
  let s = 0;
  grid.forEach((p, i) => {
    if (!p) return;
    const row = Math.floor(i / 8) - 3.5; // + = towards rank 1
    s += (p[0] === 'w' ? 1 : -1) * (WEIGHT[p[1]!] ?? 0.5) * row;
  });
  return s;
}

/** The likeliest quarter turns: screenshots are upright (0 or 2), photos can be taken from any side. */
export function guessRotation(grid: ImageGrid, allowQuarter: boolean): number {
  const options = allowQuarter ? [0, 1, 2, 3] : [0, 2];
  let best = options[0]!;
  let bestScore = -Infinity;
  for (const k of options) {
    const s = homeScore(rotate(grid.pieces, k));
    if (s > bestScore + 1e-9) {
      best = k;
      bestScore = s;
    }
  }
  return best;
}

export interface Recognised {
  pos: EditorPosition;
  /** Board view matching the image when it was a 180-degree turn (Black at the bottom). */
  orientation: Color;
  /** Unsure squares by name, with the classifier's confidence. */
  unsure: Record<string, number>;
}

export function toEditor(grid: ImageGrid, k: number, sideToMove: 'w' | 'b' = 'w'): Recognised {
  const pieces = rotate(grid.pieces, k);
  const conf = rotate(grid.confidence, k);
  const board: BoardArray = emptyPosition().board;
  const unsure: Record<string, number> = {};
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const idx = (7 - r) * 8 + c;
      board[idx] = pieces[r * 8 + c] ?? null;
      const p = conf[r * 8 + c]!;
      if (p < grid.unsureBelow) unsure[sqName(idx)] = Math.round(p * 100) / 100;
    }
  }
  return {
    // Kings and rooks on their home squares: assume castling is still allowed (the banner asks to check).
    pos: { board, turn: sideToMove, castling: possibleCastling(board), ep: null },
    orientation: k === 2 ? 'black' : 'white',
    unsure,
  };
}
