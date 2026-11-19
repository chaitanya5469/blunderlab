import { ERROR_CLASSES } from './constants';
import { db } from './db';
import type { GameAnalysis, GameRecord, MoveAnalysis, MoveClass } from './types';

/**
 * Moves played by the owner with the given classifications (default: blunder, mistake, miss),
 * across all analysed games. Uses the `[actor+classification]` index.
 */
export function getOwnerMoves(classes: MoveClass[] = ERROR_CLASSES): Promise<MoveAnalysis[]> {
  return db.moves
    .where('[actor+classification]')
    .anyOf(classes.map((c) => ['owner', c]))
    .toArray();
}

/** Owner error moves joined with their game record, newest game first. */
export async function getOwnerMovesWithGames(
  classes: MoveClass[] = ERROR_CLASSES,
): Promise<{ move: MoveAnalysis; game: GameRecord }[]> {
  const moves = await getOwnerMoves(classes);
  const ids = [...new Set(moves.map((m) => m.gameId))];
  const games = new Map((await db.games.bulkGet(ids)).flatMap((g) => (g ? [[g.uuid, g] as const] : [])));
  return moves
    .flatMap((move) => {
      const game = games.get(move.gameId);
      return game ? [{ move, game }] : [];
    })
    .sort((a, b) => b.game.endTime - a.game.endTime || a.move.ply - b.move.ply);
}

/** All per-move analysis of one game, in ply order. */
export function getGameMoves(gameId: string): Promise<MoveAnalysis[]> {
  return db.moves.where('gameId').equals(gameId).sortBy('ply');
}

/** Analysis summaries, newest game first. */
export function getAnalyses(limit?: number): Promise<GameAnalysis[]> {
  const c = db.analyses.orderBy('endTime').reverse();
  return limit ? c.limit(limit).toArray() : c.toArray();
}
