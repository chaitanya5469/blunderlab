import { Chess } from 'chess.js';
import { bookFlags, loadBook } from '../lib/book';
import { ENGINE_NAME, SECOND_LINE } from '../lib/constants';
import { moverDrop, winPercent } from '../lib/evaluation';
import { classifyGame } from '../lib/gameClassification';
import { parsePgn, uciToSan } from '../lib/pgn';
import type { GameAnalysis, GameRecord, MoveAnalysis, Score } from '../lib/types';
import type { UciEngine } from '../engine/uci';

export interface PositionEval {
  score: Score;
  bestMove: string | null;
  pv: string[];
  /**
   * Best alternative to `bestMove` (for Great), searched only when the game's move here was the
   * best move. null: there was no other legal move; undefined: not searched.
   */
  second?: { uci: string; score: Score; depth: number } | null;
}

export interface AnalyzeCallbacks {
  onProgress: (done: number, total: number) => void;
  isCancelled: () => boolean;
  /**
   * Positions already evaluated in an earlier, interrupted run at the same depth. Analysis resumes
   * after them, and each new evaluation is appended, so the caller can resume again later.
   */
  evals?: PositionEval[];
}

export interface AnalyzedGame {
  analysis: GameAnalysis;
  moves: MoveAnalysis[];
}

/** Score for a game-ending position, or null if the engine should search it. */
function terminalScore(chess: Chess, isFinalPosition: boolean): Score | null {
  if (chess.isCheckmate()) return { kind: 'checkmate', winner: chess.turn() === 'w' ? 'black' : 'white' };
  if (chess.isStalemate() || chess.isInsufficientMaterial()) return { kind: 'cp', value: 0 };
  if (isFinalPosition && chess.isDraw()) return { kind: 'cp', value: 0 };
  return null;
}

/**
 * Evaluates every position of the game's mainline and classifies each move.
 * Returns null if cancelled part-way (nothing is persisted for partial games).
 */
export async function analyzeGame(
  engine: UciEngine,
  game: GameRecord,
  depth: number,
  { onProgress, isCancelled, evals = [] }: AnalyzeCallbacks,
): Promise<AnalyzedGame | null> {
  const plies = parsePgn(game.pgn);
  const total = plies.length + 1;
  const chess = new Chess();

  if (evals.length > total) evals.length = 0;
  const book = await loadBook();
  const inBook = bookFlags(plies.map((p) => p.fenAfter), book);
  const secondDepth = Math.max(SECOND_LINE.minDepth, depth - SECOND_LINE.depthReduction);
  await engine.newGame();
  for (let i = 0; i < total; i++) {
    if (i > 0) chess.move(plies[i - 1]!.san);
    if (i >= evals.length) {
      if (isCancelled()) return null;
      const terminal = terminalScore(chess, i === total - 1);
      if (terminal) {
        evals.push({ score: terminal, bestMove: null, pv: [] });
      } else {
        const r = await engine.evaluate(chess.fen(), depth);
        // A search stopped by a cancel returns early (shallow): never keep it.
        if (isCancelled()) return null;
        evals.push({ score: r.score, bestMove: r.bestMove, pv: r.pv });
      }
    }
    // Great needs the best alternative, but only where the best move was played (outside the book).
    const e = evals[i]!;
    const played = plies[i];
    if (played && !inBook[i] && e.bestMove && e.bestMove === played.uci && e.second === undefined) {
      if (isCancelled()) return null;
      const r = await engine.evaluateExcluding(chess.fen(), secondDepth, e.bestMove);
      if (isCancelled()) return null;
      e.second = r && r.bestMove ? { uci: r.bestMove, score: r.score, depth: secondDepth } : null;
    }
    onProgress(i + 1, total);
  }
  if (isCancelled()) return null;

  const rows: MoveAnalysis[] = plies.map((p, i) => {
    const before = evals[i]!;
    const after = evals[i + 1]!;
    const winBefore = winPercent(before.score);
    const winAfter = winPercent(after.score);
    return {
      gameId: game.uuid,
      ply: p.ply,
      moveNumber: p.moveNumber,
      color: p.color,
      actor: p.color === game.ownerColor ? 'owner' : 'opponent',
      fenBefore: p.fenBefore,
      fenAfter: p.fenAfter,
      san: p.san,
      uci: p.uci,
      evalBefore: before.score,
      evalAfter: after.score,
      bestMove: before.bestMove,
      bestMoveSan: before.bestMove ? uciToSan(p.fenBefore, before.bestMove) : null,
      pv: before.pv,
      winBefore,
      winAfter,
      moverWinDrop: moverDrop(p.color, winBefore, winAfter),
      classification: 'good',
      ...(before.second !== undefined && {
        secondBest: before.second && { ...before.second, san: uciToSan(p.fenBefore, before.second.uci) },
      }),
    };
  });

  // Accuracy comes from the stored (rounded) curve, so a later rescore gives identical numbers.
  const winCurve = evals.map((e) => Math.round(winPercent(e.score) * 10) / 10);
  const { moves, summary } = classifyGame(rows, winCurve, game, book);
  const owner = game.ownerColor === 'white' ? summary.white : summary.black;

  return {
    moves,
    analysis: {
      gameId: game.uuid,
      ownerColor: game.ownerColor,
      endTime: game.endTime,
      depth,
      engine: ENGINE_NAME,
      analyzedAt: Date.now(),
      ...summary,
      ownerAccuracy: owner.accuracy,
      ownerCounts: owner.counts,
      winCurve,
    },
  };
}
