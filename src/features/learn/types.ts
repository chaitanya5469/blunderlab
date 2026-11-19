import type { Color } from '../../lib/types';

/**
 * Lesson content model. Lessons are authored as typed data under `content/` and
 * replayed with chess.js (in the app and in `scripts/validate-lessons.mjs`).
 *
 * Movetext is PGN-style SAN with move numbers and `{comments}`:
 *   `1.e4 {Claims the centre.} e5 2.Nf3 {Hits e5.} 2...Nc6`
 * - Every White move carries its number (`3.Bc4`); a Black move directly after a
 *   comment, or at the start of a branch, carries `3...Bc5`.
 * - A comment explains the move it follows (why, not just what).
 * - Glyphs `!` `?` `!!` `??` `!?` `?!` may follow a SAN move. In trap lines the victim's
 *   move marked `?` or `??` is the mistake that falls for the trap.
 */
export type Glyph = '!' | '?' | '!!' | '??' | '!?' | '?!';

export interface LineSource {
  /** Unique within the lesson. */
  id: string;
  name: string;
  /** One sentence shown in the line list. */
  summary: string;
  /**
   * Parent line id. The movetext then starts at a numbered move (e.g. `3...Nf6`)
   * and the moves before it come from the parent line, notes included.
   */
  from?: string;
  moves: string;
  /** Trap lessons: the line that springs the trap, or what to do when the opponent avoids it. */
  role?: 'trap' | 'decline';
  /** The learner gives up material for activity; the engine check allows a deficit. */
  gambit?: boolean;
  /** The opponent's choice here is a known error; the learner ends clearly better. */
  punishes?: boolean;
}

interface LessonSourceBase {
  id: string;
  name: string;
  /** Default ordering (lower first) within its group. */
  order: number;
  /** The learner's side (for traps: the side that sets the trap). */
  side: Color;
  /** One short line for cards. */
  tagline: string;
  lines: LineSource[];
}

export interface OpeningSource extends LessonSourceBase {
  kind: 'opening';
  eco: string;
  /** Ply count into the first line for the thumbnail position. */
  thumb: number;
  overview: {
    ideas: string;
    plans: string[];
    structure: string;
    suits: string;
  };
  /**
   * Space-separated SAN prefixes that identify this opening in a game played with
   * `side`. The longest matching prefix over all lessons wins.
   */
  match: string[];
}

export interface TrapSource extends LessonSourceBase {
  kind: 'trap';
  /** Opening the trap arises from, e.g. 'Italian Game, Two Knights'. */
  opening: string;
  /** False when the trap-setter's play is objectively dubious (fun in blitz, risky otherwise). */
  sound: boolean;
  /** Numbered token of the bait move in the first trap line, e.g. '4.Ng5'. */
  bait: string;
  /** How not to fall for it when on the receiving end. */
  avoid: string;
}

export type LessonSource = OpeningSource | TrapSource;

/** One resolved half-move of a line. */
export interface Ply {
  /** 0-based index into the line. */
  index: number;
  moveNumber: number;
  color: Color;
  san: string;
  glyph?: Glyph;
  note?: string;
  from: string;
  to: string;
  promotion?: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
}

/** A line the learner can play: a resolved line plus the side the learner takes. */
export interface Playable {
  /** Progress key within the lesson, e.g. 'main' or 'decline:defend'. */
  key: string;
  line: LineSource;
  plies: Ply[];
  learner: Color;
  /** Trap lessons: index of the victim's mistake in a trap line. */
  mistakeIndex?: number;
  /** Trap lessons: the learner plays the receiving side to practise avoiding it. */
  defend?: boolean;
}

export interface Lesson {
  source: LessonSource;
  playables: Playable[];
  /** FEN for the card thumbnail. */
  thumbFen: string;
}
