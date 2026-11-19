import { Chess } from 'chess.js';

/** Colour + piece letter, the same codes react-chessboard uses ("wK", "bP"). */
export type PieceCode = `${'w' | 'b'}${'K' | 'Q' | 'R' | 'B' | 'N' | 'P'}`;
export type Side = 'w' | 'b';
/** 64 squares, index = rank * 8 + file (a1 = 0, h8 = 63). */
export type BoardArray = (PieceCode | null)[];

export interface Castling {
  K: boolean;
  Q: boolean;
  k: boolean;
  q: boolean;
}

/** A position as the editor holds it (no move counters: they do not matter for analysis). */
export interface EditorPosition {
  board: BoardArray;
  turn: Side;
  castling: Castling;
  /** En-passant target square ("d6"), or null. */
  ep: string | null;
}

export const PIECE_CODES: PieceCode[] = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP'];
export const START_PLACEMENT = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
const FILES = 'abcdefgh';
const SIDE_NAME = { w: 'White', b: 'Black' } as const;
const PIECE_NAME = { K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight', P: 'pawn' } as const;

export const sqName = (i: number) => `${FILES[i % 8]}${Math.floor(i / 8) + 1}`;
export const sqIndex = (name: string) => (name.charCodeAt(1) - 49) * 8 + (name.charCodeAt(0) - 97);
const isSquareName = (s: string) => /^[a-h][1-8]$/.test(s);

export const emptyBoard = (): BoardArray => Array<PieceCode | null>(64).fill(null);
const noCastling = (): Castling => ({ K: false, Q: false, k: false, q: false });

export function emptyPosition(): EditorPosition {
  return { board: emptyBoard(), turn: 'w', castling: noCastling(), ep: null };
}

export function startPosition(): EditorPosition {
  return { ...parsePlacement(START_PLACEMENT)!, turn: 'w', castling: { K: true, Q: true, k: true, q: true }, ep: null };
}

function parsePlacement(placement: string): { board: BoardArray } | null {
  const ranks = placement.split('/');
  if (ranks.length !== 8) return null;
  const board = emptyBoard();
  for (let r = 0; r < 8; r++) {
    let file = 0;
    for (const ch of ranks[r]!) {
      if (/[1-8]/.test(ch)) {
        file += Number(ch);
      } else if (/[kqrbnpKQRBNP]/.test(ch)) {
        if (file > 7) return null;
        const color = ch === ch.toUpperCase() ? 'w' : 'b';
        board[(7 - r) * 8 + file] = `${color}${ch.toUpperCase()}` as PieceCode;
        file++;
      } else {
        return null;
      }
    }
    if (file !== 8) return null;
  }
  return { board };
}

export function placementOf(board: BoardArray): string {
  const rows: string[] = [];
  for (let r = 7; r >= 0; r--) {
    let row = '';
    let gap = 0;
    for (let f = 0; f < 8; f++) {
      const p = board[r * 8 + f];
      if (!p) {
        gap++;
        continue;
      }
      if (gap) row += gap;
      gap = 0;
      row += p[0] === 'w' ? p[1] : p[1]!.toLowerCase();
    }
    if (gap) row += gap;
    rows.push(row);
  }
  return rows.join('/');
}

export function toFen(pos: EditorPosition): string {
  const c = pos.castling;
  const castling = `${c.K ? 'K' : ''}${c.Q ? 'Q' : ''}${c.k ? 'k' : ''}${c.q ? 'q' : ''}` || '-';
  return `${placementOf(pos.board)} ${pos.turn} ${castling} ${pos.ep ?? '-'} 0 1`;
}

export type ParseResult = { ok: true; pos: EditorPosition } | { ok: false; error: string };

/**
 * Reads a FEN leniently: only the placement is required; missing fields default to
 * white to move, no castling, no en passant. Nothing is corrected here: the validator reports problems.
 */
export function parseFen(text: string): ParseResult {
  const parts = text.trim().split(/\s+/);
  if (!parts[0]) return { ok: false, error: 'Paste a FEN first.' };
  const placed = parsePlacement(parts[0]);
  if (!placed) return { ok: false, error: 'The piece placement is not valid FEN (8 ranks of 8 squares, pieces KQRBNP / kqrbnp).' };
  const turnField = parts[1] ?? 'w';
  if (turnField !== 'w' && turnField !== 'b') return { ok: false, error: 'The side to move must be "w" or "b".' };
  const castlingField = parts[2] ?? '-';
  if (!/^(-|K?Q?k?q?)$/.test(castlingField)) return { ok: false, error: 'Castling rights must be "-" or a combination of KQkq.' };
  const epField = parts[3] ?? '-';
  if (epField !== '-' && !isSquareName(epField)) return { ok: false, error: 'The en-passant field must be "-" or a square like e3.' };
  const castling = noCastling();
  for (const ch of castlingField.replace('-', '')) castling[ch as keyof Castling] = true;
  return { ok: true, pos: { board: placed.board, turn: turnField, castling, ep: epField === '-' ? null : epField } };
}

/** Castling rights that the king and rook squares allow. */
export function possibleCastling(board: BoardArray): Castling {
  const at = (sq: string, p: PieceCode) => board[sqIndex(sq)] === p;
  return {
    K: at('e1', 'wK') && at('h1', 'wR'),
    Q: at('e1', 'wK') && at('a1', 'wR'),
    k: at('e8', 'bK') && at('h8', 'bR'),
    q: at('e8', 'bK') && at('a8', 'bR'),
  };
}

/**
 * En-passant target squares that make sense for the side to move: the opponent's pawn could just
 * have advanced two squares (both squares behind it empty) and a pawn of the side to move can take it.
 */
export function epCandidates(board: BoardArray, turn: Side): string[] {
  const out: string[] = [];
  const pawnRank = turn === 'w' ? 4 : 3; // rank 5 / rank 4 (0-based)
  const dir = turn === 'w' ? 1 : -1; // towards the pawn's origin
  const them: PieceCode = turn === 'w' ? 'bP' : 'wP';
  const us: PieceCode = turn === 'w' ? 'wP' : 'bP';
  for (let f = 0; f < 8; f++) {
    if (board[pawnRank * 8 + f] !== them) continue;
    if (board[(pawnRank + dir) * 8 + f] || board[(pawnRank + 2 * dir) * 8 + f]) continue;
    const capturer = (f > 0 && board[pawnRank * 8 + f - 1] === us) || (f < 7 && board[pawnRank * 8 + f + 1] === us);
    if (capturer) out.push(sqName((pawnRank + dir) * 8 + f));
  }
  return out;
}

/** Drops castling rights and an en-passant square the board no longer supports (after an edit). */
export function sanitize(pos: EditorPosition): EditorPosition {
  const can = possibleCastling(pos.board);
  const castling = { K: pos.castling.K && can.K, Q: pos.castling.Q && can.Q, k: pos.castling.k && can.k, q: pos.castling.q && can.q };
  const ep = pos.ep && epCandidates(pos.board, pos.turn).includes(pos.ep) ? pos.ep : null;
  return { ...pos, castling, ep };
}

const KNIGHT = [
  [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2],
] as const;
const KING = [
  [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1],
] as const;
const ROOK_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;
const BISHOP_DIRS = [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const;

/** Pieces of `by` attacking square `target`. */
export function attackers(board: BoardArray, target: number, by: Side): { sq: number; type: string }[] {
  const tf = target % 8;
  const tr = Math.floor(target / 8);
  const out: { sq: number; type: string }[] = [];
  const at = (f: number, r: number) => (f >= 0 && f < 8 && r >= 0 && r < 8 ? board[r * 8 + f] : undefined);
  const push = (f: number, r: number, type: string) => out.push({ sq: r * 8 + f, type });

  const pawnRank = by === 'w' ? tr - 1 : tr + 1;
  for (const df of [-1, 1]) if (at(tf + df, pawnRank) === `${by}P`) push(tf + df, pawnRank, 'P');
  for (const [df, dr] of KNIGHT) if (at(tf + df, tr + dr) === `${by}N`) push(tf + df, tr + dr, 'N');
  for (const [df, dr] of KING) if (at(tf + df, tr + dr) === `${by}K`) push(tf + df, tr + dr, 'K');
  const slide = (dirs: readonly (readonly [number, number])[], types: string[]) => {
    for (const [df, dr] of dirs) {
      let f = tf + df;
      let r = tr + dr;
      while (f >= 0 && f < 8 && r >= 0 && r < 8) {
        const p = board[r * 8 + f];
        if (p) {
          if (p[0] === by && types.includes(p[1]!)) push(f, r, p[1]!);
          break;
        }
        f += df;
        r += dr;
      }
    }
  };
  slide(ROOK_DIRS, ['R', 'Q']);
  slide(BISHOP_DIRS, ['B', 'Q']);
  return out;
}

export interface Issue {
  id: string;
  message: string;
}

const list = (squares: number[]) => squares.map(sqName).join(', ');
const other = (s: Side): Side => (s === 'w' ? 'b' : 'w');

/**
 * Every reason the position cannot be analysed, with a specific message each. Empty = legal enough
 * to hand to the engine. The final check runs chess.js's own FEN validation as a safety net.
 */
export function validate(pos: EditorPosition): Issue[] {
  const issues: Issue[] = [];
  const { board } = pos;
  const kings: Record<Side, number[]> = { w: [], b: [] };
  board.forEach((p, i) => p?.[1] === 'K' && kings[p[0] as Side].push(i));

  for (const s of ['w', 'b'] as const) {
    const n = kings[s].length;
    if (n === 0) issues.push({ id: `king-${s}`, message: `${SIDE_NAME[s]} has no king. Each side needs exactly one.` });
    else if (n > 1) issues.push({ id: `king-${s}`, message: `${SIDE_NAME[s]} has ${n} kings (${list(kings[s])}). Each side needs exactly one.` });
  }

  const backRank = board.flatMap((p, i) => (p?.[1] === 'P' && (i < 8 || i >= 56) ? [i] : []));
  if (backRank.length) {
    issues.push({ id: 'pawn-rank', message: `Pawns can't stand on the 1st or 8th rank (${list(backRank)}). Promote or remove ${backRank.length > 1 ? 'them' : 'it'}.` });
  }

  for (const s of ['w', 'b'] as const) {
    const count = { K: 0, Q: 0, R: 0, B: 0, N: 0, P: 0 };
    let lightB = 0;
    let darkB = 0;
    board.forEach((p, i) => {
      if (p?.[0] !== s) return;
      count[p[1] as keyof typeof count]++;
      if (p[1] === 'B') ((i % 8) + Math.floor(i / 8)) % 2 === 1 ? lightB++ : darkB++;
    });
    const total = Object.values(count).reduce((a, b) => a + b, 0);
    const name = SIDE_NAME[s];
    if (total > 16) issues.push({ id: `count-${s}`, message: `${name} has ${total} pieces; a side can have at most 16.` });
    if (count.P > 8) {
      issues.push({ id: `pawns-${s}`, message: `${name} has ${count.P} pawns; a side can have at most 8.` });
    } else {
      // Every piece beyond the starting set (bishops counted per square colour) needs a promoted pawn.
      const extra = Math.max(0, count.Q - 1) + Math.max(0, count.R - 2) + Math.max(0, count.N - 2) + Math.max(0, lightB - 1) + Math.max(0, darkB - 1);
      const missing = 8 - count.P;
      if (extra > missing) {
        const sameColour = lightB > 1 || darkB > 1 ? ' (two bishops on the same square colour count as a promotion)' : '';
        issues.push({
          id: `promo-${s}`,
          message: `${name} has ${extra} more piece${extra === 1 ? '' : 's'} than the starting set${sameColour}, but only ${missing} missing pawn${missing === 1 ? '' : 's'} could have promoted.`,
        });
      }
    }
  }

  const wk = kings.w.length === 1 ? kings.w[0]! : null;
  const bk = kings.b.length === 1 ? kings.b[0]! : null;
  if (wk !== null && bk !== null) {
    const df = Math.abs((wk % 8) - (bk % 8));
    const dr = Math.abs(Math.floor(wk / 8) - Math.floor(bk / 8));
    if (df <= 1 && dr <= 1) issues.push({ id: 'kings-adjacent', message: `The kings (${sqName(wk)}, ${sqName(bk)}) can't stand next to each other.` });
  }

  const toMove = pos.turn;
  const waiting = other(toMove);
  const kingOf = { w: wk, b: bk };
  const waitingKing = kingOf[waiting];
  if (waitingKing !== null && attackers(board, waitingKing, toMove).length > 0) {
    issues.push({
      id: 'wrong-check',
      message: `${SIDE_NAME[waiting]} is in check, but it's ${SIDE_NAME[toMove]}'s turn. The side not to move can't be in check: switch the side to move or fix the position.`,
    });
  }
  const movingKing = kingOf[toMove];
  if (movingKing !== null) {
    const checkers = attackers(board, movingKing, waiting).filter((a) => a.type !== 'K');
    if (checkers.length > 2) {
      issues.push({ id: 'triple-check', message: `${SIDE_NAME[toMove]} is in check from ${checkers.length} pieces (${list(checkers.map((c) => c.sq))}); at most two pieces can give check at once.` });
    } else if (checkers.length === 2) {
      const types = checkers.map((c) => c.type).sort().join('');
      // One move can only add one checker plus one discovered checker; these pairs can't arise.
      const impossible: Record<string, string> = { NN: 'two knights', PP: 'two pawns', NP: 'a knight and a pawn', BB: 'two bishops' };
      if (impossible[types]) {
        issues.push({ id: 'double-check', message: `A double check by ${impossible[types]} (${list(checkers.map((c) => c.sq))}) can't arise in a game.` });
      }
    }
  }

  const can = possibleCastling(board);
  const castleText = { K: ['White', 'kingside', 'e1', 'h1'], Q: ['White', 'queenside', 'e1', 'a1'], k: ['Black', 'kingside', 'e8', 'h8'], q: ['Black', 'queenside', 'e8', 'a8'] } as const;
  for (const key of ['K', 'Q', 'k', 'q'] as const) {
    if (pos.castling[key] && !can[key]) {
      const [who, wing, k, r] = castleText[key];
      issues.push({ id: `castle-${key}`, message: `${who} can't castle ${wing}: that needs the king on ${k} and a rook on ${r}. Turn the right off or fix the pieces.` });
    }
  }

  if (pos.ep) {
    const epRank = toMove === 'w' ? '6' : '3';
    const pawnSq = `${pos.ep[0]}${toMove === 'w' ? '5' : '4'}`;
    const fromSq = `${pos.ep[0]}${toMove === 'w' ? '7' : '2'}`;
    const theirPawn: PieceCode = toMove === 'w' ? 'bP' : 'wP';
    if (pos.ep[1] !== epRank) {
      issues.push({ id: 'ep', message: `With ${SIDE_NAME[toMove]} to move, an en-passant square must be on rank ${epRank} (not ${pos.ep}).` });
    } else if (board[sqIndex(pawnSq)] !== theirPawn || board[sqIndex(pos.ep)] || board[sqIndex(fromSq)]) {
      issues.push({
        id: 'ep',
        message: `En passant on ${pos.ep} needs a ${toMove === 'w' ? 'black' : 'white'} pawn on ${pawnSq} that just moved from ${fromSq}, with ${pos.ep} and ${fromSq} empty.`,
      });
    }
  }

  if (issues.length === 0) {
    try {
      new Chess(toFen(pos));
    } catch (e) {
      issues.push({ id: 'chessjs', message: `This position isn't valid: ${e instanceof Error ? e.message : String(e)}` });
    }
  }
  return issues;
}

/** Human name of a piece code ("white knight"). */
export const pieceName = (p: PieceCode) => `${p[0] === 'w' ? 'white' : 'black'} ${PIECE_NAME[p[1] as keyof typeof PIECE_NAME]}`;

/**
 * Gate before anything reaches the engine: returns the normalised FEN of a fully valid position,
 * or null. Used by the analysis screen on whatever FEN it was given.
 */
export function engineSafeFen(fen: string): string | null {
  const parsed = parseFen(fen);
  if (!parsed.ok) return null;
  return validate(parsed.pos).length === 0 ? toFen(parsed.pos) : null;
}
