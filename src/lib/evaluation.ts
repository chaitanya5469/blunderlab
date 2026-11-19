import { ACCURACY_CURVE, GAME_ACCURACY, MOVE_CLASSES, WIN_PROB_K } from './constants';
import type { ClassCounts, Color, Score } from './types';

/** White-POV win% (0..100) for a White-POV score. */
export function winPercent(score: Score): number {
  if (score.kind === 'checkmate') return score.winner === 'white' ? 100 : 0;
  if (score.kind === 'mate') return score.value > 0 ? 100 : 0;
  return 50 + 50 * (2 / (1 + Math.exp(-WIN_PROB_K * score.value)) - 1);
}

/** Win% from the given colour's point of view. */
export function winPercentFor(color: Color, whiteWin: number): number {
  return color === 'white' ? whiteWin : 100 - whiteWin;
}

/** Win% lost by the mover, never negative. */
export function moverDrop(color: Color, whiteWinBefore: number, whiteWinAfter: number): number {
  return Math.max(0, winPercentFor(color, whiteWinBefore) - winPercentFor(color, whiteWinAfter));
}

/** Per-move accuracy 0..100 from the mover's win% drop (0 or less = 100). */
export function moveAccuracy(drop: number): number {
  if (drop <= 0) return 100;
  const { a, b, c, bonus } = ACCURACY_CURVE;
  return Math.min(100, Math.max(0, a * Math.exp(-b * drop) - c + bonus));
}

const WIN_CEILING = 50 + 50 * (2 / (1 + Math.exp(-WIN_PROB_K * GAME_ACCURACY.cpCeiling)) - 1);
const WIN_FLOOR = 100 - WIN_CEILING;

function populationStdDev(xs: number[]): number {
  const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
  return Math.sqrt(xs.reduce((s, x) => s + (x - mean) ** 2, 0) / xs.length);
}

/**
 * Game accuracy per colour, Lichess's method (`AccuracyPercent.gameAccuracy` in lila):
 * per-move accuracies weighted by how volatile the position was around each move, then
 * averaged with their harmonic mean, so a few big errors weigh far more than in a plain mean.
 *
 * @param whiteWins White-POV win% of every position in order, starting position included
 *   (`GameAnalysis.winCurve`). Values are clamped to Lichess's ±1000 cp range.
 * @param firstMover Colour that makes the first move (White for a normal game).
 * @returns Accuracy 0..100 per colour, or null for a colour without moves.
 */
export function gameAccuracy(
  whiteWins: number[],
  firstMover: Color = 'white',
): Record<Color, number | null> {
  const wins = whiteWins.map((w) => Math.min(WIN_CEILING, Math.max(WIN_FLOOR, w)));
  const n = wins.length;
  const result: Record<Color, number | null> = { white: null, black: null };
  if (n < 2) return result;

  const { window, weight } = GAME_ACCURACY;
  const size = Math.min(window.max, Math.max(window.min, Math.floor((n - 1) / 10)));
  // Lichess pads the start with copies of the first window, then slides one position at a time.
  const first = wins.slice(0, size);
  const windows: number[][] = [];
  for (let i = 0; i < Math.min(size, n) - 2; i++) windows.push(first);
  if (n <= size) windows.push(wins);
  else for (let i = 0; i + size <= n; i++) windows.push(wins.slice(i, i + size));
  const weights = windows.map((w) => Math.min(weight.max, Math.max(weight.min, populationStdDev(w))));

  const per: Record<Color, { acc: number; w: number }[]> = { white: [], black: [] };
  const second: Color = firstMover === 'white' ? 'black' : 'white';
  // Move i goes from position i to i + 1 and pairs with weight i (Scala's zip drops the rest).
  for (let i = 0; i < n - 1 && i < weights.length; i++) {
    const color = i % 2 === 0 ? firstMover : second;
    const before = winPercentFor(color, wins[i]!);
    const after = winPercentFor(color, wins[i + 1]!);
    per[color].push({ acc: moveAccuracy(before - after), w: weights[i]! });
  }

  for (const color of ['white', 'black'] as const) {
    const xs = per[color];
    if (!xs.length) continue;
    const wSum = xs.reduce((s, x) => s + x.w, 0);
    const weighted = xs.reduce((s, x) => s + x.acc * x.w, 0) / wSum;
    // Lichess guards the harmonic mean with max(1, v).
    const harmonic = xs.length / xs.reduce((s, x) => s + 1 / Math.max(1, x.acc), 0);
    result[color] = (weighted + harmonic) / 2;
  }
  return result;
}

/** Stored form of `gameAccuracy`: one decimal, 0 for a colour without moves. */
export function storedGameAccuracy(winCurve: number[]): Record<Color, number> {
  const acc = gameAccuracy(winCurve);
  const round = (v: number | null) => (v === null ? 0 : Math.round(v * 10) / 10);
  return { white: round(acc.white), black: round(acc.black) };
}

export function emptyCounts(): ClassCounts {
  return Object.fromEntries(MOVE_CLASSES.map((c) => [c, 0])) as ClassCounts;
}

/** Signed centipawn-ish value for charts and bars (mates clamp to ±limit). */
export function scoreToCp(score: Score, limit = 1000): number {
  if (score.kind === 'checkmate') return score.winner === 'white' ? limit : -limit;
  if (score.kind === 'mate') return score.value > 0 ? limit : -limit;
  return Math.max(-limit, Math.min(limit, score.value));
}

/** Human eval label, White's POV: "+1.3", "-0.4", "M3", "-M2", "1-0". */
export function formatScore(score: Score): string {
  if (score.kind === 'checkmate') return score.winner === 'white' ? '1-0' : '0-1';
  if (score.kind === 'mate') return `${score.value < 0 ? '-' : ''}M${Math.abs(score.value)}`;
  const pawns = score.value / 100;
  if (Math.abs(pawns) < 0.05) return '0.0';
  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(1)}`;
}
