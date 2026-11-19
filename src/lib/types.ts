/**
 * All shared domain types for BlunderLab.
 *
 * Conventions:
 * - "Owner" is the app user (the Chess.com account entered at onboarding).
 * - Every engine score is stored from White's point of view.
 * - Win percentages are 0..100, also from White's point of view unless named `mover*`.
 */

export type Color = 'white' | 'black';

/** Game outcome from the owner's perspective. */
export type GameResult = 'win' | 'loss' | 'draw';

/** Chess.com time classes (others may appear; kept as string-compatible). */
export type TimeClass = 'bullet' | 'blitz' | 'rapid' | 'daily' | (string & {});

export type MoveClass =
  | 'book'
  | 'brilliant'
  | 'great'
  | 'best'
  | 'excellent'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'miss'
  | 'blunder';

/** Who made a move, relative to the owner. Stored as a string so it can be indexed. */
export type Actor = 'owner' | 'opponent';

export type AnalysisStatus = 'pending' | 'done' | 'failed';

/** Engine score, White's point of view. */
export type Score =
  /** Centipawns; positive = White is better. */
  | { kind: 'cp'; value: number }
  /** Forced mate in `value` moves; positive = White mates, negative = Black mates. */
  | { kind: 'mate'; value: number }
  /** The position on the board is already checkmate. */
  | { kind: 'checkmate'; winner: Color };

export interface Ratings {
  bullet?: number;
  blitz?: number;
  rapid?: number;
  daily?: number;
}

/** The owner's Chess.com profile (single row, id = 'owner'). */
export interface Profile {
  id: 'owner';
  /** Lowercase username, used for API calls and colour matching. */
  username: string;
  /** Canonical display username as Chess.com returns it. */
  displayName: string;
  name?: string;
  avatar?: string;
  url?: string;
  ratings: Ratings;
  createdAt: number;
  ratingsFetchedAt: number;
  /** Last successful full sync (epoch ms). */
  lastSyncAt?: number;
}

export interface PlayerInfo {
  username: string;
  rating: number;
  /** Raw Chess.com result code: 'win', 'checkmated', 'timeout', 'agreed', 'resigned', ... */
  resultCode: string;
}

/** One synced Chess.com game (table `games`, primary key `uuid`). */
export interface GameRecord {
  uuid: string;
  url: string;
  pgn: string;
  /** Archive month, 'YYYY/MM'. */
  month: string;
  /** Unix epoch milliseconds. */
  endTime: number;
  timeControl: string;
  timeClass: TimeClass;
  rated: boolean;
  white: PlayerInfo;
  black: PlayerInfo;
  /** Which colour the owner played. */
  ownerColor: Color;
  /** Result from the owner's perspective. */
  result: GameResult;
  eco?: string;
  openingName?: string;
  /** Accuracies reported by Chess.com, when present. */
  chesscomAccuracy?: { white: number; black: number };
  analysisStatus: AnalysisStatus;
}

/** A fetched Chess.com monthly archive (table `archives`, primary key `month`). */
export interface ArchiveRecord {
  /** 'YYYY/MM' */
  month: string;
  url: string;
  fetchedAt: number;
  gameCount: number;
}

export type ClassCounts = Record<MoveClass, number>;

export interface PlayerSummary {
  /** Game accuracy 0..100 (Lichess method, see `gameAccuracy` in lib/evaluation.ts). */
  accuracy: number;
  counts: ClassCounts;
  moves: number;
  /**
   * Performance estimate for this game (see `gameRating` in lib/gameRating.ts), null when the
   * player made too few moves; absent on analyses made before it existed (until reclassified).
   */
  gameRating?: number | null;
}

/**
 * Light per-game analysis summary (table `analyses`, primary key `gameId`).
 * Per-move details live in the `moves` table.
 */
export interface GameAnalysis {
  gameId: string;
  ownerColor: Color;
  endTime: number;
  depth: number;
  engine: string;
  analyzedAt: number;
  white: PlayerSummary;
  black: PlayerSummary;
  /** Convenience copies of the owner's side. */
  ownerAccuracy: number;
  ownerCounts: ClassCounts;
  /** White-POV win% per position (plies + 1 entries), for the eval graph. */
  winCurve: number[];
  /**
   * Formula the accuracies were computed with (`ACCURACY_VERSION`); absent on analyses made
   * before it was tracked (the original plain mean). Older ones are rescored in the background.
   */
  accuracyVersion?: number;
  /**
   * Classification rules the move classes, counts and game ratings were made with
   * (`CLASSIFICATION_VERSION`); absent before it was tracked. Older ones are reclassified in the
   * background from the stored move rows, without the engine.
   */
  classificationVersion?: number;
}

/** The engine's best alternative to the best move (searched only when the best move was played). */
export interface SecondBest {
  uci: string;
  san: string | null;
  /** White's point of view. */
  score: Score;
  /** Depth of that search (a little shallower than the game depth, to keep it cheap). */
  depth: number;
}

/**
 * One analysed half-move (table `moves`, primary key `[gameId+ply]`).
 * Index `[actor+classification]` lets features query e.g. the owner's blunders directly.
 */
export interface MoveAnalysis {
  gameId: string;
  /** 1-based half-move index. */
  ply: number;
  moveNumber: number;
  color: Color;
  actor: Actor;
  fenBefore: string;
  fenAfter: string;
  san: string;
  uci: string;
  evalBefore: Score;
  evalAfter: Score;
  /** Engine's best move in `fenBefore` (UCI), null if the position was terminal. */
  bestMove: string | null;
  bestMoveSan: string | null;
  /** Principal variation from `fenBefore`, UCI moves. */
  pv: string[];
  /** White-POV win% before and after the move. */
  winBefore: number;
  winAfter: number;
  /** Win% lost by the side that moved (>= 0). */
  moverWinDrop: number;
  classification: MoveClass;
  /**
   * Best alternative when the played move was the engine's best (used for Great). null: searched,
   * but there was no other legal move; absent: not searched (another move was played, or the game
   * was analysed before this existed).
   */
  secondBest?: SecondBest | null;
}

/** A move parsed from PGN (no engine data). */
export interface ParsedPly {
  ply: number;
  moveNumber: number;
  color: Color;
  san: string;
  uci: string;
  from: string;
  to: string;
  fenBefore: string;
  fenAfter: string;
}

export type AnalysisDepthPreset = 'fast' | 'balanced' | 'deep';

export interface AppSettings {
  depthPreset: AnalysisDepthPreset;
  analysisPaused: boolean;
  /** Piece set id ('default' = react-chessboard's built-in set). */
  pieceSet: string;
  /** Board colour theme id. */
  boardTheme: string;
  /** Move sound effects. */
  sound: boolean;
  /** Sound volume, 0..1. */
  soundVolume: number;
  /** Dots / rings on the squares a selected piece can move to. */
  showLegalMoves: boolean;
  /** Historical coach id for review and puzzle comments ('none' = plain UI). */
  coach: string;
}

/* ---------------------------------------------------------------- Puzzles */

/** The owner's error classes a puzzle can come from. */
export type PuzzleSource = 'blunder' | 'mistake' | 'miss';

export type GamePhase = 'opening' | 'middlegame' | 'endgame';

/** Themes detected from the verified solution (never guessed). */
export type PuzzleMotif = 'mate' | 'winsMaterial' | 'hangingPiece' | 'missedCapture';

/** solved: clean, first try. assisted: solved after a hint or a wrong move. failed: solution shown. */
export type PuzzleResult = 'solved' | 'assisted' | 'failed';

/** One owner move of a puzzle's solution. */
export interface PuzzleStep {
  /** Every owner move (UCI) accepted here; `accepted[0]` is the engine's main move. */
  accepted: string[];
  /** Opponent reply to the main move (UCI), auto-played; null on the last step. */
  reply: string | null;
}

/**
 * A verified puzzle built from one of the owner's errors (table `puzzles`, primary key `id`).
 * Scheduling fields follow a Leitner scheme (see features/puzzles/model/schedule.ts).
 */
export interface Puzzle {
  /** `${gameId}:${ply}` */
  id: string;
  gameId: string;
  /** Ply of the owner's error move; the puzzle position is that move's `fenBefore`. */
  ply: number;
  moveNumber: number;
  fen: string;
  /** The opponent's move that led to `fen` (UCI), shown as the last move; null at the game start. */
  lastMove: string | null;
  ownerColor: Color;
  source: PuzzleSource;
  phase: GamePhase;
  timeClass: TimeClass;
  motifs: PuzzleMotif[];
  /** Forced mate length for the owner when the solution mates, else null. */
  mateIn: number | null;
  steps: PuzzleStep[];
  /** What the owner played in the game. */
  played: { uci: string; san: string };
  /** The engine's punishing line after the played move (SAN), empty if the game ended there. */
  refutation: string[];
  /** White-POV scores: best play (verified) and after the played move (game analysis). */
  evalBest: Score;
  evalPlayed: Score;
  /** Owner-POV win% for best play and after the played move. */
  winBest: number;
  winPlayed: number;
  opponent: { username: string; rating: number };
  gameEndTime: number;
  verifyDepth: number;
  createdAt: number;
  /** Leitner box: 0 = learning, rising with each clean solve. */
  box: number;
  /** When the puzzle is next due (only meaningful once attempted). */
  dueAt: number;
  attempts: number;
  lastResult: PuzzleResult | null;
  lastAttemptAt: number | null;
}

/** One finished attempt at a puzzle (table `puzzleAttempts`). */
export interface PuzzleAttempt {
  id?: number;
  puzzleId: string;
  at: number;
  result: PuzzleResult;
  wrongMoves: number;
  hints: number;
}

export type CandidateRejection =
  | 'noBestMove'
  | 'hopeless'
  | 'alreadyWon'
  | 'ambiguous'
  | 'playedIsFine'
  | 'onlyMove'
  | 'invalid';

/**
 * Verification log for every owner error considered for a puzzle (table `puzzleCandidates`,
 * primary key `[gameId+ply]`), so each position is checked once.
 */
export interface PuzzleCandidate {
  gameId: string;
  ply: number;
  outcome: 'accepted' | 'rejected';
  reason: CandidateRejection | null;
  checkedAt: number;
}

/* ---------------------------------------------------------- Lichess puzzles */

/**
 * A Lichess puzzle ready to solve. `fen` is the position the player solves (after the opponent's
 * set-up move `lastMove`); `solution` alternates player moves and forced replies (UCI), starting
 * with the player's.
 */
export interface LichessPuzzle {
  id: string;
  fen: string;
  lastMove: string | null;
  solution: string[];
  rating: number;
  themes: string[];
}

/** Where a Lichess puzzle came from: the bundled pack or the daily puzzle from the API. */
export type LichessOrigin = 'pack' | 'daily';

/**
 * One finished Lichess puzzle (table `lichessAttempts`). Kept apart from `puzzleAttempts` so
 * Lichess puzzles never enter the Leitner queue or the "your puzzles" numbers.
 */
export interface LichessAttempt {
  id?: number;
  puzzleId: string;
  origin: LichessOrigin;
  at: number;
  result: PuzzleResult;
  wrongMoves: number;
  hints: number;
  puzzleRating: number;
  ratingBefore: number;
  ratingAfter: number;
}

/** The owner's Lichess-puzzle rating (table `lichessRating`, single row id = 'owner'). Glicko-1. */
export interface LichessRating {
  id: 'owner';
  rating: number;
  rd: number;
  games: number;
  /** Where the starting rating came from, e.g. Chess.com rapid 1450. */
  seed: { kind: 'rapid' | 'blitz' | 'daily' | 'bullet' | 'default'; chesscom: number | null; start: number };
  updatedAt: number;
}

/** The daily puzzle cached for a local calendar day (table `lichessDaily`, key `date` = 'YYYY-MM-DD'). */
export interface LichessDaily {
  date: string;
  fetchedAt: number;
  puzzle: LichessPuzzle;
}

/* ---------------------------------------------------------------- Activity */

export type ActivityKind = 'puzzle-own' | 'puzzle-lichess' | 'lesson';
export type ActivityResult = PuzzleResult | 'completed';

/**
 * One thing the owner did (table `activity`), recorded by every puzzle source (and lessons),
 * for daily streaks and achievements to count.
 */
export interface ActivityEvent {
  id?: number;
  kind: ActivityKind;
  result: ActivityResult;
  at: number;
  /** What it was about, e.g. a puzzle id. */
  ref?: string;
}

/* ------------------------------------------------------------ Achievements */

/** An earned badge (table `achievements`, primary key `id` = the badge id). */
export interface AchievementUnlock {
  id: string;
  /** When it was earned; worked out from past data where possible (e.g. the game with the first brilliant). */
  unlockedAt: number;
  /** When the app first noticed it, for "most recent" ordering. */
  recordedAt: number;
}

/** Small app-level key/value rows (table `meta`). */
export interface MetaRow {
  key: string;
  value: unknown;
}
