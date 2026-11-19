import { Chess, type PieceSymbol, type Square } from 'chess.js';
import { BRILLIANT } from './constants';
import type { Color } from './types';

/** Material values for the sacrifice test (the king never counts as material). */
const VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/** The opponent's move just before (for the recapture test). */
export interface PreviousMove {
  uci: string;
  fenBefore: string;
}

export interface BrilliantInput {
  color: Color;
  rating: number;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  isBest: boolean;
  /** Mover's expected-points loss, and expected points after the move. */
  loss: number;
  epAfter: number;
  /** Mover's expected points with the best move other than this one (or the position's value when unknown). */
  epWithout: number;
}

/**
 * Material the mover offers after the move: the largest net loss if the opponent captures one of
 * the mover's non-pawn pieces. A legal capture of an undefended piece loses the whole piece; of a
 * defended one, the piece minus the cheapest capturer (so only captures by a cheaper piece count).
 */
function offeredBySquare(fen: string, mover: 'w' | 'b'): Map<Square, number> {
  const out = new Map<Square, number>();
  const chess = new Chess(fen);
  // Opponent to move in `fen`: its legal captures already respect pins and checks.
  const captures = chess.moves({ verbose: true }).filter((m) => m.captured && m.captured !== 'p' && m.captured !== 'k');
  const byTarget = new Map<Square, number>();
  for (const m of captures) {
    const cheapest = byTarget.get(m.to);
    const v = VALUE[m.piece];
    if (cheapest === undefined || v < cheapest) byTarget.set(m.to, v);
  }
  for (const [sq, attacker] of byTarget) {
    const piece = chess.get(sq);
    if (!piece || piece.color !== mover) continue;
    const defended = chess.attackers(sq, mover).length > 0;
    const loss = defended ? VALUE[piece.type] - attacker : VALUE[piece.type];
    if (loss > 0) out.set(sq, loss);
  }
  return out;
}

/** What the opponent could already take before the move (the mover "passes"); empty if that isn't a legal position. */
function alreadyHanging(fenBefore: string, mover: 'w' | 'b'): Map<Square, number> {
  const parts = fenBefore.split(' ');
  parts[1] = mover === 'w' ? 'b' : 'w';
  parts[3] = '-';
  try {
    return offeredBySquare(parts.join(' '), mover);
  } catch {
    return new Map();
  }
}

/**
 * Material the move newly offers: the largest net loss if the opponent captures one of the mover's
 * non-pawn pieces, counting only pieces the move put at (greater) risk. A piece that was already
 * hanging before the move and is simply left there is not a sacrifice; neither is a moved piece
 * that was already hanging and stays hanging for the same amount.
 */
function offeredMaterial(fenBefore: string, fenAfter: string, mover: 'w' | 'b', from: Square, to: Square): number {
  const before = alreadyHanging(fenBefore, mover);
  let worst = 0;
  for (const [sq, loss] of offeredBySquare(fenAfter, mover)) {
    const was = before.get(sq === to ? from : sq) ?? 0;
    if (loss > was) worst = Math.max(worst, loss);
  }
  return worst;
}

/** True when `uci` captures the piece the opponent just moved (accepting an offered piece). */
function takesLastMovedPiece(fenBefore: string, uci: string, previous: PreviousMove | null | undefined): boolean {
  if (!previous) return false;
  return uci.slice(2, 4) === previous.uci.slice(2, 4) && !!new Chess(fenBefore).get(uci.slice(2, 4) as Square);
}

/** True when `uci` captures on the square the opponent's previous move just captured on. */
export function isRecapture(fenBefore: string, uci: string, previous: PreviousMove | null | undefined): boolean {
  if (!previous) return false;
  try {
    const played = new Chess(fenBefore).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    if (!played.captured) return false;
    const prev = new Chess(previous.fenBefore).move({ from: previous.uci.slice(0, 2), to: previous.uci.slice(2, 4), promotion: previous.uci[4] });
    return !!prev.captured && prev.to === played.to;
  } catch {
    return false;
  }
}

/**
 * Brilliant: a sound piece sacrifice (Chess.com: a best or nearly best move that is a good piece
 * sacrifice; not in a bad position after it, and not completely winning even without it; more
 * generous for newer players). Derived from move data only (no extra engine work), so it applies
 * to stored games too. See `BRILLIANT`.
 *
 * - the move is the engine's best, or loses less than `maxLoss` expected points;
 * - the best alternative leaves the mover below `maxWithout` (not completely winning anyway), and
 *   after the move the mover has at least `minAfter`;
 * - not a promotion, not a recapture on the square the opponent just captured on, and not taking
 *   the piece the opponent just moved (accepting their sacrifice);
 * - after the move, a non-pawn piece of the mover that the move newly put at risk can be taken
 *   for a net gain of at least `minOffered` points beyond what the move itself captured (so plain
 *   trades, and pieces that were already hanging, do not count).
 */
export function isBrilliant(move: BrilliantInput, previous: PreviousMove | null | undefined): boolean {
  const generous = move.rating < BRILLIANT.generousBelow;
  const minAfter = generous ? BRILLIANT.generous.minAfter : BRILLIANT.minAfter;
  const minOffered = generous ? BRILLIANT.generous.minOffered : BRILLIANT.minOffered;
  if (!move.isBest && move.loss >= BRILLIANT.maxLoss) return false;
  if (move.epWithout >= BRILLIANT.maxWithout) return false;
  if (move.epAfter < minAfter) return false;
  if (move.uci.length > 4) return false;
  if (isRecapture(move.fenBefore, move.uci, previous)) return false;

  try {
    // Taking the piece the opponent just moved accepts their offer; it isn't a sacrifice of ours.
    if (takesLastMovedPiece(move.fenBefore, move.uci, previous)) return false;
    const played = new Chess(move.fenBefore).move({ from: move.uci.slice(0, 2), to: move.uci.slice(2, 4) });
    let captured = played.captured ? VALUE[played.captured] : 0;
    if (played.isEnPassant()) captured = VALUE.p;
    const offered = offeredMaterial(move.fenBefore, move.fenAfter, move.color === 'white' ? 'w' : 'b', played.from, played.to);
    return offered - captured >= minOffered;
  } catch {
    return false;
  }
}
