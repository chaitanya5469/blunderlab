import type { AnalysisDepthPreset, MoveClass } from './types';

/** Lichess win-probability coefficient: win% = 50 + 50 * (2 / (1 + exp(-K * cp)) - 1). */
export const WIN_PROB_K = 0.00368208;

/**
 * Expected points (0..1: 1 = sure win, 0.5 = draw-ish, 0 = sure loss) for the side to move, from
 * the engine score and that player's rating. Chess.com's "Expected Points" model is not public;
 * this is a documented approximation (see `expectedPoints` in lib/expectedPoints.ts):
 *
 *   EP(cp, rating) = 1 / (1 + exp(-k(rating) * cp)),   k(rating) = anchorK * exp((rating - anchorRating) / ratingScale)
 *
 * At 1500 it is exactly the Lichess win% curve (`WIN_PROB_K`, divided by 100). Stronger players
 * convert an advantage more reliably, so their curve is steeper: k is ×1.5 at 2500, ×0.75 at 800,
 * ×0.64 at 400 and ×1.84 at 3000 (ratings are clamped to `minRating..maxRating`). For example,
 * +100 cp is worth 0.57 at 800, 0.59 at 1500 and 0.63 at 2500. A forced mate is 1 (or 0).
 */
export const EXPECTED_POINTS = {
  anchorRating: 1500,
  anchorK: WIN_PROB_K,
  /** Rating points per e-fold change of the slope (2466 = ln(1.5) per 1000 points). */
  ratingScale: 2466,
  minRating: 400,
  maxRating: 3000,
  /** Used when a player's rating is unknown. */
  defaultRating: 1500,
} as const;

/**
 * Expected-points loss (0..1) at which each class starts, as in Chess.com's Classification V2
 * table: Best = the engine move; Excellent < 0.02; Good 0.02–0.05; Inaccuracy 0.05–0.10;
 * Mistake 0.10–0.20; Blunder >= 0.20.
 */
export const EP_THRESHOLDS = {
  good: 0.02,
  inaccuracy: 0.05,
  mistake: 0.1,
  blunder: 0.2,
} as const;

/**
 * Outcome bands from the mover's expected points: winning >= `winning`, losing <= 1 - `winning`,
 * equal in between. Interpolated linearly between the two ratings (clamped outside them), lower for
 * newer players: their advantages are worth less on the curve already, and Chess.com says these
 * thresholds depend on rating and are more generous for newer players.
 */
export const OUTCOME_BANDS = {
  low: { rating: 1000, winning: 0.68 },
  high: { rating: 2200, winning: 0.75 },
} as const;

/**
 * Great: the engine's best move was played, and it was critical (Chess.com: "turns losing into
 * equal, or equal into winning, or is the only good move"). Needs the second-best line.
 * - only good move: the best alternative loses at least `onlyMoveGap` more expected points
 *   (interpolated between ratings as `OUTCOME_BANDS`), the move is not losing, and the
 *   alternative is not still winning; or
 * - outcome change: the best alternative lands in a worse outcome band (losing instead of equal,
 *   equal instead of winning) and trails by at least `bandGap`.
 * Recaptures and book moves are never Great.
 */
export const GREAT = {
  onlyMoveGap: { low: 0.1, high: 0.15 },
  bandGap: 0.05,
} as const;

/**
 * The second-best search for Great runs only when the played move was the engine's best, this many
 * plies shallower than the game depth (never below `minDepth`). Measured on a desktop with the
 * lite engine over an 80-ply game, a second search on half the positions cost ~+23% at depth 16
 * (+59% at depth 12) at depth − 2, against ~+48% (+79%) at full depth and ~+130% (+430%) for
 * MultiPV 2 everywhere.
 */
export const SECOND_LINE = { depthReduction: 2, minDepth: 8 } as const;

/**
 * Miss (Chess.com: failing to capitalise on the opponent's mistake): the opponent's previous move
 * lost at least `minOpponentLoss` and turned the mover's position from not winning into winning
 * (`OUTCOME_BANDS`, mover's rating), and the reply lost at least `minLoss` and left the mover no
 * longer winning (equal or worse). A reply that is also a blunder stays a blunder.
 */
export const MISS = { minOpponentLoss: 0.1, minLoss: 0.05 } as const;

/**
 * Brilliant (a sound piece sacrifice), derived from stored move data; see `isBrilliant` in
 * lib/brilliant.ts. Expected points are the mover's. `minOffered` is net material in pawns
 * (3 = a minor piece). Values for newer players (`generousBelow`) are more lenient.
 */
export const BRILLIANT = {
  /** Best, or loses less than this (Excellent): "best or nearly best". */
  maxLoss: 0.02,
  /** Not completely winning even without it: the best alternative stays below this. */
  maxWithout: 0.9,
  /** Not in a bad position after it. */
  minAfter: 0.45,
  minOffered: 2,
  generousBelow: 1200,
  generous: { minAfter: 0.4, minOffered: 1 },
} as const;

/**
 * Game rating: a per-game performance estimate (see lib/gameRating.ts). Move quality is the mean
 * expected-points loss per move on the rating-neutral 1500 curve (book moves, and moves played
 * while the position stayed decided, `decided`, are left out). The expected loss of a player
 * rated R is assumed to fall exponentially with rating:
 *
 *   expectedLoss(R) = anchorLoss * exp(-(R - anchorRating) / scale)
 *
 * These anchors are assumptions chosen to match Chess.com's labels, not fitted to data: an average
 * 1500 game loses ~0.035 per move (its typical move sits between Excellent and Good, with an
 * occasional inaccuracy or mistake); the expected loss roughly triples every 1000 points, so an
 * all-Best/Excellent game (~0.012) reads ~2500 and a game with a blunder every ~8 moves (~0.075)
 * reads ~800. The observed loss is inverted through this curve, blended towards the player's actual
 * rating for short games (weight n / (n + `shrinkMoves`)), clamped and rounded.
 */
export const GAME_RATING = {
  anchorRating: 1500,
  anchorLoss: 0.035,
  scale: 934,
  /** Losses below this are treated as this (keeps a flawless game finite). */
  minLoss: 0.004,
  shrinkMoves: 10,
  /** Hidden for a player with fewer moves than this. */
  minMoves: 8,
  min: 100,
  max: 3200,
  round: 50,
  /** A move counts only if the position was not decided (EP outside this range) both before and after. */
  decided: { low: 0.03, high: 0.97 },
} as const;

/**
 * Version of the classification rules. Analyses with a lower `classificationVersion` (or none)
 * are reclassified in the background from their stored move rows (see services/reclassify.ts).
 * 1 = win% thresholds (+ brilliant); 2 = Chess.com-like expected points, book, great, game rating.
 */
export const CLASSIFICATION_VERSION = 4;

/**
 * Per-move accuracy from the mover's win% drop: `a * exp(-b * drop) - c + bonus`, clamped to 0..100.
 * Lichess `AccuracyPercent.fromWinPercents` (the +1 is its "uncertainty bonus").
 */
export const ACCURACY_CURVE = { a: 103.1668100711649, b: 0.04354415386753951, c: 3.166924740191411, bonus: 1 } as const;

/**
 * Game accuracy (Lichess `AccuracyPercent.gameAccuracy`): the mean of a volatility-weighted mean
 * and a harmonic mean of per-move accuracies. Window size = (moves / 10) clamped to this range;
 * each window's weight is the population standard deviation of its win%s, clamped to `weight`.
 */
export const GAME_ACCURACY = {
  window: { min: 2, max: 8 },
  weight: { min: 0.5, max: 12 },
  /** Lichess caps evals at ±1000 cp (mates count as ±1000) before converting to win%. */
  cpCeiling: 1000,
} as const;

/**
 * Version of the stored accuracy formula. Analyses with a lower `accuracyVersion` (or none)
 * are rescored in the background from their stored win% curve, without the engine.
 * 1 = plain mean of per-move accuracy (original); 2 = Lichess game accuracy.
 */
export const ACCURACY_VERSION = 2;

export const DEPTH_PRESETS: Record<AnalysisDepthPreset, { depth: number; label: string; hint: string }> = {
  fast: { depth: 10, label: 'Fast', hint: 'Depth 10 · quickest, rougher' },
  balanced: { depth: 12, label: 'Balanced', hint: 'Depth 12 · recommended' },
  deep: { depth: 16, label: 'Deep', hint: 'Depth 16 · slow, most precise' },
};

/**
 * Deeper one-off analysis of a single game from Game Review. Only depths above the game's
 * current depth are offered. Hints are relative: each step roughly doubles or triples the time.
 */
export const REANALYSIS_DEPTHS: { depth: number; label: string; hint: string }[] = [
  { depth: 16, label: 'Depth 16', hint: 'A few times slower than the default · sharper verdicts' },
  { depth: 20, label: 'Depth 20', hint: 'Much slower · several minutes for a long game on a phone' },
  { depth: 24, label: 'Depth 24', hint: 'Slowest · can take 10+ minutes, best left running' },
];

export const DEFAULT_DEPTH_PRESET: AnalysisDepthPreset = 'balanced';

export const ENGINE_NAME = 'stockfish-19-lite-single';
export const ENGINE_SCRIPT = `engine/${ENGINE_NAME}.js`;
export const ENGINE_WASM = `engine/${ENGINE_NAME}.wasm`;
export const ENGINE_HASH_MB = 32;

export const CHESSCOM_API = 'https://api.chess.com/pub';
/** Retries for HTTP 429 / transient errors, with exponential backoff from this base. */
export const FETCH_MAX_RETRIES = 5;
export const FETCH_BACKOFF_MS = 1500;
/** Retries when the request cannot be made at all (offline, DNS, blocked). */
export const FETCH_NETWORK_RETRIES = 1;

export const MOVE_CLASSES: MoveClass[] = ['brilliant', 'great', 'best', 'excellent', 'good', 'book', 'inaccuracy', 'mistake', 'miss', 'blunder'];

/** The classes the owner should learn from (puzzle candidates). */
export const ERROR_CLASSES: MoveClass[] = ['blunder', 'mistake', 'miss'];
