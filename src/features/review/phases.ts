import { moveAccuracy } from '../../lib/evaluation';
import type { Color, GamePhase, MoveAnalysis, MoveClass } from '../../lib/types';
import { gamePhase } from '../../services/puzzles/tags';

/**
 * Phase ratings for the game summary (Chess.com style): every move is put in a phase, and each
 * player's moves in a phase get one grade drawn with the move-class icons.
 *
 * Phase of a move: book moves are always the opening; otherwise `gamePhase(fenBefore)`
 * (services/puzzles/tags.ts). Phases only move forward (opening -> middlegame -> endgame), so a
 * promotion that adds a piece back never returns the game to the middlegame.
 *
 * Phase accuracy: each move's accuracy from the mover's win% drop (`moveAccuracy`, the same curve
 * as game accuracy), combined like Lichess's game accuracy without the volatility weights: the
 * mean of the arithmetic and harmonic means, so one big error pulls a phase down hard.
 *
 * Grade from phase accuracy (A) and the moves in the phase:
 * - book:       every move of the phase was a book move
 * - brilliant:  A >= 90 and the phase holds a brilliant move
 * - great:      A >= 90 and the phase holds a great move
 * - best:       A >= 90
 * - excellent:  A >= 80
 * - good:       A >= 70
 * - inaccuracy: A >= 60
 * - mistake:    A >= 45
 * - blunder:    A <  45
 */
export const PHASE_GRADE_THRESHOLDS = { best: 90, excellent: 80, good: 70, inaccuracy: 60, mistake: 45 } as const;

export const PHASES: GamePhase[] = ['opening', 'middlegame', 'endgame'];
export const PHASE_NAME: Record<GamePhase, string> = { opening: 'Opening', middlegame: 'Middlegame', endgame: 'Endgame' };

export interface PhaseGrade {
  cls: MoveClass;
  accuracy: number;
  moves: number;
}

export interface PhaseReport {
  phase: GamePhase;
  /** null when this player made no move in the phase. */
  white: PhaseGrade | null;
  black: PhaseGrade | null;
}

const ORDER: Record<GamePhase, number> = { opening: 0, middlegame: 1, endgame: 2 };

function phaseOf(fen: string): GamePhase {
  try {
    return gamePhase(fen);
  } catch {
    return 'middlegame';
  }
}

/** Phase of every move, in ply order (monotonic). */
export function movePhases(moves: MoveAnalysis[]): GamePhase[] {
  let reached: GamePhase = 'opening';
  return moves.map((m) => {
    const p: GamePhase = m.classification === 'book' ? 'opening' : phaseOf(m.fenBefore);
    if (ORDER[p] > ORDER[reached]) reached = p;
    return reached;
  });
}

export function phaseAccuracy(moves: MoveAnalysis[]): number {
  const accs = moves.map((m) => moveAccuracy(m.moverWinDrop));
  const mean = accs.reduce((s, a) => s + a, 0) / accs.length;
  const harmonic = accs.length / accs.reduce((s, a) => s + 1 / Math.max(1, a), 0);
  return (mean + harmonic) / 2;
}

export function gradePhase(moves: MoveAnalysis[]): PhaseGrade | null {
  if (moves.length === 0) return null;
  const accuracy = phaseAccuracy(moves);
  const has = (c: MoveClass) => moves.some((m) => m.classification === c);
  const T = PHASE_GRADE_THRESHOLDS;
  let cls: MoveClass;
  if (moves.every((m) => m.classification === 'book')) cls = 'book';
  else if (accuracy >= T.best) cls = has('brilliant') ? 'brilliant' : has('great') ? 'great' : 'best';
  else if (accuracy >= T.excellent) cls = 'excellent';
  else if (accuracy >= T.good) cls = 'good';
  else if (accuracy >= T.inaccuracy) cls = 'inaccuracy';
  else if (accuracy >= T.mistake) cls = 'mistake';
  else cls = 'blunder';
  return { cls, accuracy, moves: moves.length };
}

/** The phases the game reached, each graded for both players. */
export function phaseReports(moves: MoveAnalysis[]): PhaseReport[] {
  const phases = movePhases(moves);
  return PHASES.flatMap((phase) => {
    const inPhase = moves.filter((_, i) => phases[i] === phase);
    if (inPhase.length === 0) return [];
    const of = (c: Color) => gradePhase(inPhase.filter((m) => m.color === c));
    return [{ phase, white: of('white'), black: of('black') }];
  });
}
