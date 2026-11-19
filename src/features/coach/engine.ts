import { Chess } from 'chess.js';
import { useSettings } from '../../hooks/useServices';
import type { Actor, GamePhase, GameResult, MoveClass, Puzzle } from '../../lib/types';
import { gamePhase } from '../../services/puzzles/tags';
import { alekhine } from './coaches/alekhine';
import { capablanca } from './coaches/capablanca';
import { lasker } from './coaches/lasker';
import { morphy } from './coaches/morphy';
import { nimzowitsch } from './coaches/nimzowitsch';
import { steinitz } from './coaches/steinitz';
import { tal } from './coaches/tal';
import type { AccuracyTier, Coach, CoachChoice, CoachId, CoachLine, MotifKey, OppKey, Pool, QuoteSlot, Mood } from './types';

/** In historical order. */
export const COACHES: Coach[] = [morphy, steinitz, lasker, capablanca, alekhine, nimzowitsch, tal];
const BY_ID = new Map<string, Coach>(COACHES.map((c) => [c.id, c]));

export const DEFAULT_COACH: CoachId = 'capablanca';

export function coachById(choice: string | undefined): Coach | null {
  return choice ? (BY_ID.get(choice) ?? null) : null;
}

export const isCoachChoice = (v: unknown): v is CoachChoice => v === 'none' || (typeof v === 'string' && BY_ID.has(v));

/** The selected coach, or null for the plain UI. */
export function useCoach(): Coach | null {
  return coachById(useSettings().coach);
}

/* ------------------------------------------------------------------ Picking */

type Vars = Record<string, string | number | null | undefined>;

/** FNV-1a: a stable number per situation key, so a revisited move keeps its line. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Fills {placeholders}; null when one has no value, so the line is skipped. */
function fill(template: string, vars: Vars): string | null {
  let ok = true;
  const text = template.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = vars[k];
    if (v === null || v === undefined || v === '') {
      ok = false;
      return '';
    }
    return String(v);
  });
  return ok ? text : null;
}

/** Picks made in this session: lines used recently are avoided, and each situation keeps its line. */
const memo = new Map<string, CoachLine>();
const lastUsed = new Map<string, number>();
const quotesShown = new Set<string>();
let counter = 0;
/** A line is not reused within this many picks while an alternative exists. */
const RECENT = 12;

function pick(coach: Coach, key: string, pools: Pool[], vars: Vars, slot?: QuoteSlot, quoteChance = 4): CoachLine | null {
  const id = `${coach.id}|${key}`;
  const cached = memo.get(id);
  if (cached) return cached;
  const seed = hash(id);

  // Now and then a real quote fits the moment better than a written line (each at most once a session).
  if (slot) {
    const quote = coach.quotes.find((q) => q.slots.includes(slot) && !quotesShown.has(q.text));
    if (quote && seed % quoteChance === 0) {
      quotesShown.add(quote.text);
      const line = { text: quote.text, quote: true };
      memo.set(id, line);
      return line;
    }
  }

  const options = [...new Set(pools.flat())].flatMap((t) => {
    const text = fill(t, vars);
    return text ? [{ t, text }] : [];
  });
  if (options.length === 0) return null;
  const used = (t: string) => lastUsed.get(`${coach.id}|${t}`) ?? -Infinity;
  const fresh = options.filter((o) => counter - used(o.t) > RECENT);
  let chosen;
  if (fresh.length > 0) chosen = fresh[seed % fresh.length]!;
  else chosen = options.reduce((a, b) => (used(b.t) < used(a.t) ? b : a));
  counter++;
  lastUsed.set(`${coach.id}|${chosen.t}`, counter);
  const line = { text: chosen.text, quote: false };
  memo.set(id, line);
  return line;
}

const withMood = (l: CoachLine | null, mood: Mood): CoachLine | null => (l ? { ...l, mood } : null);

const OWN_MOOD: Partial<Record<MoveClass, Mood>> = { brilliant: 'surprised', great: 'pleased', best: 'pleased', excellent: 'pleased', mistake: 'concerned', miss: 'concerned', blunder: 'concerned' };
/** Opponent moves, from the owner's side: their errors are good news. */
const OPP_MOOD: Partial<Record<MoveClass, Mood>> = { brilliant: 'surprised', great: 'concerned', mistake: 'pleased', miss: 'pleased', blunder: 'pleased' };

/* ------------------------------------------------------------------- Games */

const GOOD: MoveClass[] = ['best', 'excellent', 'good'];
const OPP_KEY: Record<MoveClass, OppKey> = {
  book: 'book',
  brilliant: 'brilliant',
  great: 'great',
  best: 'solid',
  excellent: 'solid',
  good: 'solid',
  inaccuracy: 'inaccuracy',
  mistake: 'mistake',
  miss: 'miss',
  blunder: 'blunder',
};

function phaseOf(fen: string): GamePhase {
  try {
    return gamePhase(fen);
  } catch {
    return 'middlegame';
  }
}

export interface MoveFacts {
  /** Stable situation id, e.g. `${gameId}:${ply}` or a variation key. */
  key: string;
  cls: MoveClass;
  actor: Actor;
  san: string;
  /** Engine's better move (SAN); ignored when it is the move played. */
  best?: string | null;
  fenBefore: string;
  /** Winning chances (0..100) the mover lost. */
  drop?: number;
  opening?: string;
}

/** What the coach says about one move (owner's or opponent's, from the owner's side). */
export function moveLine(coach: Coach, f: MoveFacts): CoachLine | null {
  const mate = f.san.endsWith('#');
  const mood: Mood = mate ? (f.actor === 'opponent' ? 'concerned' : 'surprised') : ((f.actor === 'opponent' ? OPP_MOOD : OWN_MOOD)[f.cls] ?? 'neutral');
  return withMood(rawMoveLine(coach, f), mood);
}

function rawMoveLine(coach: Coach, f: MoveFacts): CoachLine | null {
  const mate = f.san.endsWith('#');
  const vars: Vars = {
    san: f.san,
    best: f.best && f.best !== f.san ? f.best : null,
    opening: f.opening,
    drop: f.drop !== undefined && f.drop >= 15 ? `${Math.round(f.drop)}%` : null,
  };
  const L = coach.lines;
  if (f.actor === 'opponent') return pick(coach, `m:${f.key}`, [mate ? L.opp.checkmate : L.opp[OPP_KEY[f.cls]]], vars);
  if (mate) return pick(coach, `m:${f.key}`, [L.own.checkmate], vars);

  const phase = phaseOf(f.fenBefore);
  const pools = [L.own[f.cls]];
  if (GOOD.includes(f.cls)) pools.push(L.phase[phase].good);
  // Phase lines join the milder errors only; a blunder or miss deserves a word about the move itself.
  if (f.cls === 'inaccuracy' || f.cls === 'mistake') pools.push(L.phase[phase].bad);
  const slot: QuoteSlot | undefined =
    f.cls === 'brilliant' ? 'brilliant' : f.cls === 'great' ? 'great' : f.cls === 'blunder' ? 'blunder' : phase === 'endgame' && GOOD.includes(f.cls) ? 'endgame' : undefined;
  return pick(coach, `m:${f.key}`, pools, vars, slot);
}

/** Greeting at the start position of a reviewed game. */
export function introLine(coach: Coach, gameId: string, opening?: string): CoachLine | null {
  return pick(coach, `i:${gameId}`, [coach.lines.intro], { opening }, 'intro', 3);
}

export function accuracyTier(acc: number): AccuracyTier {
  return acc >= 85 ? 'high' : acc >= 65 ? 'mid' : 'low';
}

/** One-line verdict for the game summary. */
export function summaryLine(coach: Coach, gameId: string, result: GameResult, accuracy: number): CoachLine | null {
  const line = pick(coach, `s:${gameId}`, [coach.lines.summary[result][accuracyTier(accuracy)]], { acc: Math.round(accuracy) }, result, 3);
  return withMood(line, result === 'win' ? 'pleased' : result === 'loss' ? 'concerned' : 'neutral');
}

export interface GameFacts {
  result: GameResult;
  /** The owner's rating going into the game, and this game's rating estimate (null: too few moves). */
  rating: number;
  gameRating?: number | null;
  /** Every analysed move of the game, in ply order. */
  moves: { ply: number; moveNumber: number; color: 'white' | 'black'; actor: Actor; san: string; classification: MoveClass; moverWinDrop: number; bestMoveSan: string | null }[];
}

const ERRORS: MoveClass[] = ['blunder', 'mistake', 'miss'];
const label = (m: GameFacts['moves'][number]) => `${m.moveNumber}${m.color === 'white' ? '.' : '…'} ${m.san}`;
const CLASS_WORD: Partial<Record<MoveClass, string>> = { blunder: 'a blunder', mistake: 'a mistake', miss: 'a miss' };

/**
 * Plain follow-up sentences for the whole-game verdict, from the facts alone (in any coach's
 * voice, or without one): the game rating against the rating, the standout move, the turning
 * point and the opponent's biggest slip. At most three.
 */
export function gameNotes(f: GameFacts): string[] {
  const notes: string[] = [];
  if (typeof f.gameRating === 'number') {
    const diff = Math.round(f.gameRating - f.rating);
    if (diff >= 50) notes.push(`You played like a ${f.gameRating}, ${diff} points above your ${f.rating} rating.`);
    else if (diff <= -50) notes.push(`You played like a ${f.gameRating}, ${-diff} points below your ${f.rating} rating.`);
    else notes.push(`You played right around your rating, at about ${f.gameRating}.`);
  }
  const own = f.moves.filter((m) => m.actor === 'owner');
  const opp = f.moves.filter((m) => m.actor === 'opponent');
  const star = own.find((m) => m.classification === 'brilliant') ?? own.find((m) => m.classification === 'great');
  if (star) notes.push(`The standout: ${label(star)}, ${star.classification === 'brilliant' ? 'a brilliant move' : 'a great find'}.`);
  const worst = own.filter((m) => ERRORS.includes(m.classification)).sort((a, b) => b.moverWinDrop - a.moverWinDrop)[0];
  if (worst) {
    const best = worst.bestMoveSan && worst.bestMoveSan !== worst.san ? `; ${worst.bestMoveSan} was the move` : '';
    notes.push(`The turning point was ${label(worst)}, ${CLASS_WORD[worst.classification]}${best}.`);
  } else if (own.length > 0) {
    notes.push('No blunders, mistakes or misses from you. A clean game.');
  }
  const slip = opp.filter((m) => ERRORS.includes(m.classification)).sort((a, b) => b.moverWinDrop - a.moverWinDrop)[0];
  if (slip && f.result === 'win') notes.push(`Your opponent slipped with ${label(slip)}, and you made it count.`);
  else if (!worst && f.result === 'loss') notes.push('Your opponent simply played well.');
  return notes.slice(0, 3);
}

/* ----------------------------------------------------------------- Puzzles */

/** Lichess themes, most telling first. */
const THEME_MOTIF: [RegExp, MotifKey][] = [
  [/^(mate|mateIn\d|backRankMate|smotheredMate|anastasiaMate|arabianMate|bodenMate|doubleBishopMate|dovetailMate|hookMate)$/, 'mate'],
  [/^fork$/, 'fork'],
  [/^pin$/, 'pin'],
  [/^skewer$/, 'skewer'],
  [/^(discoveredAttack|doubleCheck)$/, 'discovered'],
  [/^sacrifice$/, 'sacrifice'],
  [/^(deflection|attraction|interference|clearance|xRayAttack|intermezzo|capturingDefender)$/, 'deflection'],
  [/^hangingPiece$/, 'hanging'],
  [/^trappedPiece$/, 'trapped'],
  [/^(promotion|underPromotion|advancedPawn)$/, 'promotion'],
  [/^(quietMove|defensiveMove|zugzwang|equality)$/, 'quiet'],
  [/^(endgame|pawnEndgame|rookEndgame|bishopEndgame|knightEndgame|queenEndgame|queenRookEndgame)$/, 'endgame'],
  [/^(advantage|crushing)$/, 'material'],
];

/** Pools to fall back on when a coach has no lines for a motif. */
const FALLBACK: Partial<Record<MotifKey, MotifKey>> = { skewer: 'pin', trapped: 'material', deflection: 'sacrifice', hanging: 'material', discovered: 'sacrifice' };

export interface PuzzleTheme {
  motif: MotifKey;
  /** Mate length, when the solution mates. */
  n: number | null;
}

export function lichessTheme(themes: string[]): PuzzleTheme {
  const mateIn = themes.map((t) => /^mateIn(\d)$/.exec(t)).find(Boolean);
  for (const [re, motif] of THEME_MOTIF) if (themes.some((t) => re.test(t))) return { motif, n: mateIn ? Number(mateIn[1]) : null };
  return { motif: 'any', n: null };
}

export function ownPuzzleTheme(p: Pick<Puzzle, 'motifs' | 'mateIn' | 'phase'>): PuzzleTheme {
  if (p.motifs.includes('mate')) return { motif: 'mate', n: p.mateIn };
  if (p.motifs.includes('hangingPiece')) return { motif: 'hanging', n: null };
  if (p.motifs.includes('winsMaterial') || p.motifs.includes('missedCapture')) return { motif: 'material', n: null };
  if (p.phase === 'endgame') return { motif: 'endgame', n: null };
  return { motif: 'any', n: null };
}

function motifPool(coach: Coach, motif: MotifKey): Pool {
  const start = coach.lines.puzzle.start;
  let m: MotifKey | undefined = motif;
  while (m && !start[m]) m = FALLBACK[m];
  return (m && start[m]) || start.any;
}

export type PuzzleMoment = 'start' | 'wrong' | 'wrongPlayed' | 'solved' | 'assisted' | 'revealed';

/** A line for a puzzle moment. `key` identifies the puzzle and moment (e.g. `${id}:wrong:2`). */
export function puzzleLine(coach: Coach, moment: PuzzleMoment, key: string, theme: PuzzleTheme, played?: string): CoachLine | null {
  const mood: Mood = moment === 'solved' ? 'pleased' : moment === 'wrong' || moment === 'wrongPlayed' ? 'concerned' : 'neutral';
  return withMood(rawPuzzleLine(coach, moment, key, theme, played), mood);
}

function rawPuzzleLine(coach: Coach, moment: PuzzleMoment, key: string, theme: PuzzleTheme, played?: string): CoachLine | null {
  const P = coach.lines.puzzle;
  switch (moment) {
    case 'start':
      return pick(coach, `p:${key}`, [motifPool(coach, theme.motif)], { n: theme.n }, 'puzzleStart', 4);
    case 'wrongPlayed':
      return pick(coach, `p:${key}`, [P.wrongPlayed], { played }) ?? pick(coach, `p:${key}:w`, [P.wrong], {});
    case 'solved':
      return pick(coach, `p:${key}`, [P.solved], {}, 'puzzleSolved', 4);
    default:
      return pick(coach, `p:${key}`, [P[moment]], {});
  }
}

/** End of a training set: all clean, mostly solved, or rough. */
export function setEndLine(coach: Coach, key: string, clean: number, solved: number, total: number): CoachLine | null {
  const tier = clean === total ? 'clean' : solved * 2 >= total ? 'mixed' : 'rough';
  return withMood(pick(coach, `e:${key}`, [coach.lines.puzzle.setEnd[tier]], {}, 'setEnd', 3), tier === 'clean' ? 'pleased' : tier === 'rough' ? 'concerned' : 'neutral');
}

/** SAN of a UCI move in `fen`, or null. */
export function sanOf(fen: string, uci: string | null | undefined): string | null {
  if (!uci) return null;
  try {
    return new Chess(fen).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san;
  } catch {
    return null;
  }
}
