import { Chess } from 'chess.js';
import type { Color, LichessPuzzle, PuzzleStep } from '../../../../lib/types';
import type { SolvablePuzzle } from '../../solve/usePuzzleSolver';

const play = (chess: Chess, uci: string) => chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });

/**
 * Converts a Lichess puzzle into solver steps: each player move with the forced reply after it.
 * As on Lichess, any checkmating move is accepted wherever one exists (mates in one can have several).
 */
export function toSolvable(p: LichessPuzzle): SolvablePuzzle & { color: Color } {
  const chess = new Chess(p.fen);
  const color: Color = chess.turn() === 'w' ? 'white' : 'black';
  const steps: PuzzleStep[] = [];
  for (let i = 0; i < p.solution.length; i += 2) {
    const main = p.solution[i]!;
    const mates = chess
      .moves({ verbose: true })
      .filter((m) => m.san.endsWith('#'))
      .map((m) => m.from + m.to + (m.promotion ?? ''));
    steps.push({ accepted: [main, ...mates.filter((u) => u !== main)], reply: p.solution[i + 1] ?? null });
    play(chess, main);
    if (p.solution[i + 1]) play(chess, p.solution[i + 1]!);
  }
  return { fen: p.fen, lastMove: p.lastMove, steps, color };
}

/** Link to the puzzle on lichess.org. */
export const lichessUrl = (id: string) => `https://lichess.org/training/${id}`;
