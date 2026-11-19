import { bookFlags, type OpeningBook } from './book';
import { classifyRows } from './classify';
import { ACCURACY_VERSION, CLASSIFICATION_VERSION } from './constants';
import { emptyCounts, storedGameAccuracy } from './evaluation';
import { effectiveRating } from './expectedPoints';
import { gameRating } from './gameRating';
import type { Color, GameAnalysis, GameRecord, MoveAnalysis, PlayerSummary } from './types';

/** The players' ratings for a game, made usable (unknown → default). */
export const gameRatings = (game: Pick<GameRecord, 'white' | 'black'>): Record<Color, number> => ({
  white: effectiveRating(game.white.rating),
  black: effectiveRating(game.black.rating),
});

/**
 * (Re)classifies one game's move rows (ply order) and rebuilds the per-player summaries
 * (counts, Lichess accuracy from the stored win% curve, game rating). Engine-free: everything
 * comes from the stored rows. Returns the rows with new classes and the summary fields.
 */
export function classifyGame(
  moves: MoveAnalysis[],
  winCurve: number[],
  game: Pick<GameRecord, 'white' | 'black'>,
  book: OpeningBook,
): {
  moves: MoveAnalysis[];
  summary: Pick<GameAnalysis, 'white' | 'black' | 'accuracyVersion' | 'classificationVersion'>;
} {
  const ratings = gameRatings(game);
  const classes = classifyRows(moves, ratings, bookFlags(moves.map((m) => m.fenAfter), book));
  const rows = moves.map((m, i) => (m.classification === classes[i] ? m : { ...m, classification: classes[i]! }));
  const accuracy = storedGameAccuracy(winCurve);
  const summarize = (color: Color): PlayerSummary => {
    const counts = emptyCounts();
    let n = 0;
    for (const m of rows) {
      if (m.color !== color) continue;
      counts[m.classification]++;
      n++;
    }
    return { accuracy: accuracy[color], counts, moves: n, gameRating: gameRating(moves, classes, color, game[color].rating) };
  };
  return {
    moves: rows,
    summary: {
      white: summarize('white'),
      black: summarize('black'),
      accuracyVersion: ACCURACY_VERSION,
      classificationVersion: CLASSIFICATION_VERSION,
    },
  };
}
