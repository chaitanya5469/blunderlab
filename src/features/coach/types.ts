import type { GamePhase, GameResult, MoveClass } from '../../lib/types';

export type CoachId = 'morphy' | 'steinitz' | 'lasker' | 'capablanca' | 'alekhine' | 'nimzowitsch' | 'tal';

/** The coach setting: one of the coaches, or the plain UI. */
export type CoachChoice = CoachId | 'none';

/**
 * A line is a template. Placeholders are filled from what the app knows; a line whose placeholder
 * has no value in the current situation is skipped.
 * - {san}: the move played. {best}: the engine's better move. {opening}: the opening name.
 * - {drop}: winning chances lost, e.g. "30%". {acc}: game accuracy, e.g. "84". {n}: mate length.
 * - {played}: the move played in the game (puzzles from the owner's games).
 * Invented lines never contain quotation marks: those are kept for real quotes.
 */
export type Pool = string[];

/** Situations for the owner's moves: every move class, plus delivering checkmate. */
export type MoveKey = MoveClass | 'checkmate';

/** Situations for the opponent's moves (best, excellent and good share "solid"). */
export type OppKey = 'book' | 'brilliant' | 'great' | 'solid' | 'inaccuracy' | 'mistake' | 'miss' | 'blunder' | 'checkmate';

/** Puzzle themes a start line can hint at (never the move itself). */
export type MotifKey =
  | 'mate'
  | 'fork'
  | 'pin'
  | 'skewer'
  | 'discovered'
  | 'sacrifice'
  | 'deflection'
  | 'hanging'
  | 'trapped'
  | 'promotion'
  | 'quiet'
  | 'endgame'
  | 'material'
  | 'any';

export type AccuracyTier = 'high' | 'mid' | 'low';

export interface CoachLines {
  /** Starting position of a reviewed game; may use {opening}. */
  intro: Pool;
  own: Record<MoveKey, Pool>;
  opp: Record<OppKey, Pool>;
  /** Phase-flavoured lines mixed into good (best/excellent/good) or bad (inaccuracy/mistake) own moves. */
  phase: Record<GamePhase, { good: Pool; bad: Pool }>;
  /** One-line game verdict by result and accuracy tier; may use {acc}. */
  summary: Record<GameResult, Record<AccuracyTier, Pool>>;
  puzzle: {
    start: Partial<Record<MotifKey, Pool>> & { any: Pool };
    wrong: Pool;
    /** The owner repeated the move from the game. */
    wrongPlayed: Pool;
    solved: Pool;
    assisted: Pool;
    revealed: Pool;
    setEnd: { clean: Pool; mixed: Pool; rough: Pool };
  };
}

/** Situations where a coach's real quote may be shown instead of a written line. */
export type QuoteSlot = 'intro' | 'brilliant' | 'great' | 'blunder' | 'endgame' | 'win' | 'loss' | 'draw' | 'puzzleStart' | 'puzzleSolved' | 'setEnd';

/**
 * A real, documented quote. `source` names the publication; `verified` says where the attribution
 * was checked (only quotes listed as sourced, never "disputed" / "attributed" / "misattributed").
 */
export interface Quote {
  text: string;
  source: string;
  verified: string;
  slots: QuoteSlot[];
}

/** Avatar background gradient (the drawing itself lives in CoachAvatar). `initials` is kept for accessibility fallbacks. */
export interface AvatarStyle {
  initials: string;
  /** Gradient stops, light to dark. */
  from: string;
  to: string;
  /** Initials colour. */
  ink: string;
}

export interface Coach {
  id: CoachId;
  name: string;
  /** Surname used in the bubble. */
  short: string;
  born: number;
  died: number;
  /** One-line playing style, shown on the picker. */
  style: string;
  /** One or two well-established facts. */
  bio: string[];
  avatar: AvatarStyle;
  quotes: Quote[];
  lines: CoachLines;
}

/** What the bubble shows: a written line, or a real quote (shown in quotation marks with the name). */
/** The avatar's expression for a line. */
export type Mood = 'neutral' | 'pleased' | 'concerned' | 'surprised';

export interface CoachLine {
  text: string;
  quote: boolean;
  mood?: Mood;
}
