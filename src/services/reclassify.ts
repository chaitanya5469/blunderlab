import { loadBook } from '../lib/book';
import { ACCURACY_VERSION, CLASSIFICATION_VERSION } from '../lib/constants';
import { db } from '../lib/db';
import { classifyGame } from '../lib/gameClassification';
import type { GameAnalysis } from '../lib/types';
import { analysisService } from './analysisService';

/**
 * localStorage key holding the "classification.accuracy" versions every stored analysis is known
 * to be on. (Replaces the older one-off passes `blunderlab:accuracyVersion` and
 * `blunderlab:brilliantBackfill`, whose work this pass includes.)
 */
const DONE_KEY = 'blunderlab:reclassifyVersion';
const DONE_VALUE = `${CLASSIFICATION_VERSION}.${ACCURACY_VERSION}`;
const BATCH = 25;

let running: Promise<void> | null = null;

function isDone(): boolean {
  try {
    return localStorage.getItem(DONE_KEY) === DONE_VALUE;
  } catch {
    return false;
  }
}

function markDone() {
  try {
    localStorage.setItem(DONE_KEY, DONE_VALUE);
  } catch {
    /* storage unavailable: the (cheap) scan simply runs again next start */
  }
}

const yieldToUi = () => new Promise<void>((r) => setTimeout(r, 0));

const isStale = (a: GameAnalysis) =>
  (a.classificationVersion ?? 1) < CLASSIFICATION_VERSION || (a.accuracyVersion ?? 1) < ACCURACY_VERSION;

/**
 * One-time background pass over analyses made with older classification rules or an older
 * accuracy formula. The engine is not needed: classes (book, brilliant, best … blunder, miss),
 * counts, game accuracy and game ratings all come from the stored move rows, win% curve and the
 * game's ratings. Great needs the second-best line, which old rows do not have, so old games show
 * Great only after a re-analysis.
 *
 * Works through `analyses` in primary-key batches, each read and written in one transaction (so it
 * never overwrites a fresh analysis, which is already current and skipped). An interrupted run is
 * harmless: updated analyses are no longer stale. Puzzles and their progress are never touched;
 * the puzzle candidate list is refreshed afterwards so new error classes are considered.
 */
export function reclassifyAnalyses(): Promise<void> {
  if (isDone()) return Promise.resolve();
  running ??= run().finally(() => {
    running = null;
  });
  return running;
}

async function run() {
  const book = await loadBook();
  let after: string | null = null;
  let updated = 0;
  for (;;) {
    const changed = await db.transaction('rw', db.analyses, db.moves, db.games, async () => {
      const rows: GameAnalysis[] = await (after === null ? db.analyses.orderBy(':id') : db.analyses.where(':id').above(after))
        .limit(BATCH)
        .toArray();
      if (!rows.length) return null;
      after = rows[rows.length - 1]!.gameId;
      let n = 0;
      for (const a of rows.filter(isStale)) {
        const [game, moves] = await Promise.all([db.games.get(a.gameId), db.moves.where('gameId').equals(a.gameId).sortBy('ply')]);
        if (!game || !moves.length) continue;
        const result = classifyGame(moves, a.winCurve, game, book);
        const changedRows = result.moves.filter((m, i) => m !== moves[i]);
        if (changedRows.length) await db.moves.bulkPut(changedRows);
        const owner = a.ownerColor === 'white' ? result.summary.white : result.summary.black;
        await db.analyses.put({ ...a, ...result.summary, ownerAccuracy: owner.accuracy, ownerCounts: owner.counts });
        n++;
      }
      return n;
    });
    if (changed === null) break;
    updated += changed;
    await yieldToUi();
  }
  if (updated) {
    console.info(`Reclassified ${updated} analysed games.`);
    analysisService.refreshPuzzleCandidates();
  }
  markDone();
}
