import { db } from '../../lib/db';
import { getOwnerMovesWithGames } from '../../lib/queries';
import type { CandidateRejection, Puzzle, PuzzleCandidate } from '../../lib/types';
import type { CandidateInput } from './buildPuzzle';
import { prefilter } from './rules';

type Pending = Pick<CandidateInput, 'move' | 'game'>;

/**
 * Owner errors that have not been checked for a puzzle yet, newest game first.
 * Positions that fail the cheap prefilter are logged straight away without engine time.
 * The list is loaded lazily and reloaded after `invalidate()` (e.g. when a game finishes analysis).
 */
export class CandidateQueue {
  private items: Pending[] | null = null;

  invalidate() {
    this.items = null;
  }

  /** Unchecked candidates left (0 until first loaded). */
  get remaining(): number {
    return this.items?.length ?? 0;
  }

  /** The next candidate with its follow-up move and analysis depth, or undefined when done. */
  async next(): Promise<CandidateInput | undefined> {
    // A local reference: `invalidate()` may swap the list out while we wait on the database.
    const items = (this.items ??= await loadPending());
    for (;;) {
      const item = items[0];
      if (!item) return undefined;
      const { uuid } = item.game;
      const [previous, next, analysis] = await Promise.all([
        db.moves.get([uuid, item.move.ply - 1]),
        db.moves.get([uuid, item.move.ply + 1]),
        db.analyses.get(uuid),
      ]);
      if (analysis) return { ...item, previous, next, analysisDepth: analysis.depth };
      items.shift(); // analysis was cleared meanwhile; it comes back once re-analysed
    }
  }

  /** Logs the outcome for a candidate (and stores its puzzle) and drops it from the queue. */
  async complete(input: CandidateInput, outcome: { puzzle: Puzzle } | { rejected: CandidateRejection }) {
    const { gameId, ply } = input.move;
    this.items = this.items?.filter((i) => i.move.gameId !== gameId || i.move.ply !== ply) ?? null;
    const log: PuzzleCandidate = {
      gameId: input.game.uuid,
      ply: input.move.ply,
      outcome: 'puzzle' in outcome ? 'accepted' : 'rejected',
      reason: 'puzzle' in outcome ? null : outcome.rejected,
      checkedAt: Date.now(),
    };
    await db.transaction('rw', db.puzzles, db.puzzleCandidates, async () => {
      if ('puzzle' in outcome) await db.puzzles.put(outcome.puzzle);
      await db.puzzleCandidates.put(log);
    });
  }
}

async function loadPending(): Promise<Pending[]> {
  const [rows, checkedKeys] = await Promise.all([getOwnerMovesWithGames(), db.puzzleCandidates.toCollection().primaryKeys()]);
  const checked = new Set(checkedKeys.map(([g, p]) => `${g}:${p}`));
  const pending: Pending[] = [];
  const skipped: PuzzleCandidate[] = [];
  for (const { move, game } of rows) {
    if (checked.has(`${move.gameId}:${move.ply}`)) continue;
    const reason = prefilter(move, game.ownerColor);
    if (reason) skipped.push({ gameId: move.gameId, ply: move.ply, outcome: 'rejected', reason, checkedAt: Date.now() });
    else pending.push({ move, game });
  }
  if (skipped.length) await db.puzzleCandidates.bulkPut(skipped);
  return pending;
}
