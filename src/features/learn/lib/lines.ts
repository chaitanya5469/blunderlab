import { Chess } from 'chess.js';
import type { Color } from '../../../lib/types';
import type { Glyph, Lesson, LessonSource, Playable, Ply } from '../types';

/*
 * Movetext parsing and line resolution. Pure (only chess.js), so the validation
 * script imports this file directly under Node.
 */

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const GLYPHS = new Set<string>(['!', '?', '!!', '??', '!?', '?!']);
const TOKEN = /\{([^}]*)\}|(\d+)(\.\.\.|\.)|([^\s{}]+)/g;

export class LessonError extends Error {}

interface Token {
  san: string;
  glyph?: Glyph;
  note?: string;
  /** Move number written before the move, with whether it used the Black `...` form. */
  number?: { n: number; black: boolean };
  /** The previous token was a comment. */
  afterComment: boolean;
}

/** Splits PGN-style movetext into moves with their numbers, glyphs and comments. */
export function parseMovetext(text: string): Token[] {
  const out: Token[] = [];
  let pending: Token['number'];
  let lastWasComment = false;
  let cursor = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (text.slice(cursor, m.index).trim()) throw new LessonError(`unreadable text near "${text.slice(cursor, m.index + 12)}"`);
    cursor = m.index + m[0].length;
    if (m[1] !== undefined) {
      const prev = out.at(-1);
      if (!prev || pending) throw new LessonError(`comment "${m[1].slice(0, 30)}…" does not follow a move`);
      if (prev.note) throw new LessonError(`two comments after ${prev.san}`);
      prev.note = m[1].replace(/\s+/g, ' ').trim();
      lastWasComment = true;
    } else if (m[2] !== undefined) {
      if (pending) throw new LessonError(`move number ${m[2]} without a move`);
      pending = { n: Number(m[2]), black: m[3] === '...' };
    } else {
      const g = /^([^!?]+)([!?]{1,2})?$/.exec(m[4]!);
      if (!g || (g[2] && !GLYPHS.has(g[2]))) throw new LessonError(`bad move token "${m[4]}"`);
      out.push({ san: g[1]!, glyph: g[2] as Glyph | undefined, number: pending, afterComment: lastWasComment });
      pending = undefined;
      lastWasComment = false;
    }
  }
  if (text.slice(cursor).trim()) throw new LessonError(`unreadable text near "${text.slice(cursor, cursor + 12)}"`);
  if (pending) throw new LessonError('movetext ends with a move number');
  return out;
}

/** Ply index (0-based) that a numbered token refers to. */
export const plyIndexOf = (n: number, black: boolean) => (n - 1) * 2 + (black ? 1 : 0);

/** Applies one SAN move, requiring it to be legal, unambiguous and written canonically. */
function applySan(chess: Chess, san: string): ReturnType<Chess['move']> {
  let move;
  try {
    move = chess.move(san);
  } catch {
    throw new LessonError(`illegal or ambiguous move ${san} in ${chess.fen()}`);
  }
  if (move.san !== san) throw new LessonError(`move ${san} should be written ${move.san}`);
  return move;
}

/** Resolves a line (following `from` parents) into plies, checking numbering and legality. */
export function buildLine(lesson: LessonSource, lineId: string, seen: string[] = []): Ply[] {
  const line = lesson.lines.find((l) => l.id === lineId);
  if (!line) throw new LessonError(`${lesson.id}: unknown line "${lineId}"`);
  if (seen.includes(lineId)) throw new LessonError(`${lesson.id}: circular "from" at ${lineId}`);
  const where = `${lesson.id}/${line.id}`;
  try {
    const tokens = parseMovetext(line.moves);
    const first = tokens[0];
    if (!first) throw new LessonError('no moves');
    if (!first.number) throw new LessonError('the first move must carry its number');

    let prefix: Ply[] = [];
    const start = plyIndexOf(first.number.n, first.number.black);
    if (line.from) {
      const parent = buildLine(lesson, line.from, [...seen, lineId]);
      if (parent.length < start) throw new LessonError(`branches at ply ${start + 1} but ${line.from} has only ${parent.length} plies`);
      prefix = parent.slice(0, start);
      if (parent[start]?.san === first.san) throw new LessonError(`does not branch: ${first.san} is also the move in ${line.from}`);
    } else if (start !== 0) {
      throw new LessonError('a line without "from" must start at move 1');
    }

    const chess = new Chess(prefix.at(-1)?.fenAfter ?? START_FEN);
    const plies = [...prefix];
    for (const t of tokens) {
      const index = plies.length;
      const color: Color = index % 2 === 0 ? 'white' : 'black';
      const moveNumber = Math.floor(index / 2) + 1;
      const label = `${moveNumber}${color === 'white' ? '.' : '...'}${t.san}`;
      if (t.number) {
        if (t.number.n !== moveNumber || t.number.black !== (color === 'black')) {
          throw new LessonError(`numbered ${t.number.n}${t.number.black ? '...' : '.'}${t.san} but it is ${label} (wrong side to move or count)`);
        }
      } else if (color === 'white') {
        throw new LessonError(`White move ${label} needs its move number`);
      } else if (t.afterComment) {
        throw new LessonError(`Black move ${label} after a comment needs "${moveNumber}..."`);
      }
      const fenBefore = chess.fen();
      const m = applySan(chess, t.san);
      plies.push({
        index,
        moveNumber,
        color,
        san: m.san,
        glyph: t.glyph,
        note: t.note,
        from: m.from,
        to: m.to,
        promotion: m.promotion,
        uci: m.lan,
        fenBefore,
        fenAfter: chess.fen(),
      });
    }
    return plies;
  } catch (e) {
    if (e instanceof LessonError && !e.message.startsWith(lesson.id)) throw new LessonError(`${where}: ${e.message}`);
    throw e;
  }
}

const opposite = (c: Color): Color => (c === 'white' ? 'black' : 'white');

/** Index of the victim's mistake (`?` or `??`) in a trap line, if any. */
export function mistakeIndexOf(plies: Ply[], setter: Color): number | undefined {
  const i = plies.findIndex((p) => p.color !== setter && (p.glyph === '?' || p.glyph === '??'));
  return i < 0 ? undefined : i;
}

/** Resolves a lesson's lines into playables (traps add a "defend" version of each decline line). */
export function resolveLesson(source: LessonSource): Lesson {
  const playables: Playable[] = [];
  for (const line of source.lines) {
    const plies = buildLine(source, line.id);
    const base: Playable = { key: line.id, line, plies, learner: source.side };
    if (source.kind === 'trap' && line.role === 'trap') base.mistakeIndex = mistakeIndexOf(plies, source.side);
    playables.push(base);
    if (source.kind === 'trap' && line.role === 'decline') {
      playables.push({ key: `${line.id}:defend`, line, plies, learner: opposite(source.side), defend: true });
    }
  }
  const first = playables[0];
  if (!first) throw new LessonError(`${source.id}: no lines`);
  const thumbPly =
    source.kind === 'opening' ? first.plies[source.thumb - 1] : first.plies[first.mistakeIndex ?? first.plies.length - 1];
  return { source, playables, thumbFen: thumbPly?.fenAfter ?? START_FEN };
}

/** SAN without check/mate marks, for comparing against game records. */
export const sanKey = (san: string) => san.replace(/[+#!?]/g, '');

/** SAN sequence of a line, normalised with `sanKey`. */
export const lineKeys = (plies: Ply[]) => plies.map((p) => sanKey(p.san));
