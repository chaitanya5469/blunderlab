import { Chess } from 'chess.js';
import type { ParsedPly } from './types';

/** Parses a PGN mainline into plies with FENs before/after each move. */
export function parsePgn(pgn: string): ParsedPly[] {
  const chess = new Chess();
  chess.loadPgn(pgn);
  return chess.history({ verbose: true }).map((m, i) => ({
    ply: i + 1,
    moveNumber: Math.floor(i / 2) + 1,
    color: m.color === 'w' ? 'white' : 'black',
    san: m.san,
    uci: m.lan,
    from: m.from,
    to: m.to,
    fenBefore: m.before,
    fenAfter: m.after,
  }));
}

/** UCI move to SAN in the given position, or null if illegal. */
export function uciToSan(fen: string, uci: string): string | null {
  try {
    const chess = new Chess(fen);
    const move = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    return move.san;
  } catch {
    return null;
  }
}

/** Converts a UCI line to SAN, stopping at the first illegal move. */
export function uciLineToSan(fen: string, line: string[], max = 8): string[] {
  const chess = new Chess(fen);
  const out: string[] = [];
  for (const uci of line.slice(0, max)) {
    try {
      out.push(chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san);
    } catch {
      break;
    }
  }
  return out;
}

export function sideToMove(fen: string): 'white' | 'black' {
  return fen.split(' ')[1] === 'b' ? 'black' : 'white';
}
