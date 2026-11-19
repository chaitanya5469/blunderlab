import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { parsePgn } from '../../lib/pgn';
import { getGameMoves } from '../../lib/queries';
import type { GameAnalysis, GameRecord, MoveAnalysis, ParsedPly } from '../../lib/types';

export interface GameReviewData {
  /** undefined while loading, null if no such game. */
  game: GameRecord | null | undefined;
  analysis: GameAnalysis | undefined;
  /** Per-move analysis in ply order, empty until analysed. */
  moves: MoveAnalysis[];
  plies: ParsedPly[];
  parseError: boolean;
  /** False until the analysis lookup has answered (so "not analysed" is not shown too early). */
  analysisLoaded: boolean;
}

const EMPTY: MoveAnalysis[] = [];

export function useGameReview(id: string): GameReviewData {
  const game = useLiveQuery(async () => (await db.games.get(id)) ?? null, [id]);
  // Analysis and moves are read together, so a re-analysis swaps in as one consistent update.
  const result = useLiveQuery(
    () => db.transaction('r', db.analyses, db.moves, async () => ({ analysis: await db.analyses.get(id), moves: await getGameMoves(id) })),
    [id],
  );
  const analysis = result?.analysis;
  const moves = result?.moves ?? EMPTY;
  const pgn = game?.pgn;
  const { plies, parseError } = useMemo(() => {
    if (!pgn) return { plies: [], parseError: false };
    try {
      return { plies: parsePgn(pgn), parseError: false };
    } catch {
      return { plies: [], parseError: true };
    }
  }, [pgn]);
  return { game, analysis, moves, plies, parseError, analysisLoaded: result !== undefined };
}
