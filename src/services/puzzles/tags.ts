import { Chess } from 'chess.js';
import type { Color, GamePhase, PuzzleMotif } from '../../lib/types';

const VALUE: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/** Material of `color` minus the other side's, in pawns. */
function balance(chess: Chess, color: Color): number {
  const me = color === 'white' ? 'w' : 'b';
  let sum = 0;
  for (const row of chess.board()) for (const p of row) if (p) sum += (p.color === me ? 1 : -1) * VALUE[p.type]!;
  return sum;
}

/**
 * Opening: move 12 or earlier with at most two minor/major pieces traded off.
 * Endgame: six or fewer queens, rooks, bishops and knights left in total.
 * Everything else is middlegame.
 */
export function gamePhase(fen: string): GamePhase {
  const chess = new Chess(fen);
  const pieces = chess.board().flat().filter((p) => p && p.type !== 'p' && p.type !== 'k').length;
  if (pieces <= 6) return 'endgame';
  const fullMove = Number(fen.split(' ')[5]) || 1;
  return fullMove <= 12 && pieces >= 12 ? 'opening' : 'middlegame';
}

const apply = (chess: Chess, uci: string) => chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });

/** Plies of the engine line followed before the material count, extended while captures continue. */
const MATERIAL_PLIES = 6;
const MATERIAL_MAX_PLIES = 12;
/** Net gain (pawns) along the line that counts as winning material. */
const MATERIAL_GAIN = 2;

interface MotifInput {
  fen: string;
  owner: Color;
  /** Engine main line from the puzzle position (owner's move first). */
  line: string[];
  playedUci: string;
  mateIn: number | null;
}

/**
 * Motifs that can be read off the verified solution:
 * - mate: the solution is a forced mate.
 * - hangingPiece: the first move captures a knight, bishop, rook or queen the opponent cannot recapture.
 * - missedCapture: the first move is a capture and the owner's game move was not (when not already "hanging").
 * - winsMaterial: following the engine line until captures stop nets at least two pawns of material.
 */
export function detectMotifs({ fen, owner, line, playedUci, mateIn }: MotifInput): PuzzleMotif[] {
  if (mateIn) return ['mate'];
  const motifs: PuzzleMotif[] = [];
  const chess = new Chess(fen);
  const start = balance(chess, owner);
  const first = line[0] ? apply(chess, line[0]) : null;
  if (!first) return motifs;

  const capture = first.isCapture();
  if (capture && first.captured && first.captured !== 'p') {
    const recapture = chess.moves({ verbose: true }).some((m) => m.to === first.to && m.isCapture());
    if (!recapture) motifs.push('hangingPiece');
  }
  if (capture && !motifs.includes('hangingPiece') && !isCapture(fen, playedUci)) motifs.push('missedCapture');

  let i = 1;
  for (; i < line.length && i < MATERIAL_MAX_PLIES; i++) {
    const uci = line[i]!;
    if (i >= MATERIAL_PLIES && !isCapture(chess.fen(), uci)) break;
    try {
      apply(chess, uci);
    } catch {
      break;
    }
  }
  if (balance(chess, owner) - start >= MATERIAL_GAIN) motifs.push('winsMaterial');
  return motifs;
}

function isCapture(fen: string, uci: string): boolean {
  try {
    return apply(new Chess(fen), uci).isCapture();
  } catch {
    return false;
  }
}
