import { Chess } from 'chess.js';
import Dexie, { liveQuery } from 'dexie';
import { EngineError, UciEngine, type EngineLine } from '../engine/uci';
import { db } from '../lib/db';
import { analysisDepth, settingsStore } from '../lib/settings';
import { createStore } from '../lib/store';
import type { GameRecord } from '../lib/types';
import { analyzeGame, type PositionEval } from './analyzeGame';
import { buildPuzzle } from './puzzles/buildPuzzle';
import { CandidateQueue } from './puzzles/candidateQueue';
import { PUZZLE_RULES } from './puzzles/rules';

export type AnalysisStatusKind = 'idle' | 'starting' | 'running' | 'paused' | 'error';

export interface AnalysisState {
  status: AnalysisStatusKind;
  currentGameId: string | null;
  /** Positions evaluated / total positions of the current game. */
  done: number;
  total: number;
  /** Games still waiting for analysis (including the current one). */
  queueLength: number;
  paused: boolean;
  error: string | null;
  /** True while the engine is verifying a puzzle candidate. */
  puzzleChecking: boolean;
  /** Puzzle candidates checked in the current run, and those still unchecked. */
  puzzleChecked: number;
  puzzleRemaining: number;
  /** True while background work is held for interactive (playground) analysis. */
  interactive: boolean;
}

/** A deeper one-off re-analysis of a single game, started from Game Review. */
export interface DeepAnalysisState {
  /** The game being re-analysed, or null when none is. */
  gameId: string | null;
  depth: number;
  /** Positions evaluated / total positions (0 until it starts). */
  done: number;
  total: number;
  error: string | null;
}

/** Live analysis of one position for the review playground. */
export interface LiveAnalysisState {
  /** The position being analysed, or null when nothing is requested. */
  fen: string | null;
  /** Best first; empty until the first iteration completes. */
  lines: EngineLine[];
  depth: number;
  /** True while the engine is still refining this position. */
  searching: boolean;
  error: string | null;
  /** Bumped whenever any cached live result changes (lets readers of `liveResult` re-render). */
  version: number;
}

export interface LiveResult {
  lines: EngineLine[];
  depth: number;
  /** Searched to the full live depth (no need to search again). */
  complete: boolean;
}

/** Live search depth cap: deep enough to trust, bounded so a phone does not search forever. */
export const LIVE_MAX_DEPTH = 20;
export const LIVE_MULTI_PV = 3;
/** Background work resumes after this long without a new live request (once the search is done)... */
const LIVE_IDLE_MS = 15_000;
/** ...or after this long regardless (a still-running live search is then stopped where it is). */
const LIVE_IDLE_MAX_MS = 60_000;
/** Grace period after leaving the playground, so hopping in and out does not restart background work. */
const LIVE_LEAVE_MS = 3_000;
const LIVE_CACHE_SIZE = 300;

/**
 * App-level analysis queue: one engine worker, newest pending game first,
 * a game the user opens jumps the queue. The queue itself is the set of games with
 * `analysisStatus === 'pending'` in IndexedDB, so it survives app restarts.
 *
 * The same worker verifies puzzle candidates (the owner's errors in analysed games):
 * a few after each analysed game while games are still queued, then all remaining ones
 * once the queue is empty. Opening a game, pausing or a new priority interrupts a
 * verification; the candidate is simply checked again later.
 *
 * Interactive (playground) analysis shares the same worker. A live request holds all background
 * work (the current game or puzzle check is interrupted and redone later, exactly as when a game
 * is prioritised), and only the newest requested position is ever searched: a newer request stops
 * the running search and drops anything not yet started. Results stream in per iteration and are
 * cached per position. Background work resumes a short while after the owner leaves the
 * playground or stops asking for new positions.
 */
class AnalysisService {
  readonly store = createStore<AnalysisState>({
    status: 'idle',
    currentGameId: null,
    done: 0,
    total: 0,
    queueLength: 0,
    paused: settingsStore.get().analysisPaused,
    error: null,
    puzzleChecking: false,
    puzzleChecked: 0,
    puzzleRemaining: 0,
    interactive: false,
  });

  readonly deep = createStore<DeepAnalysisState>({ gameId: null, depth: 0, done: 0, total: 0, error: null });

  readonly live = createStore<LiveAnalysisState>({ fen: null, lines: [], depth: 0, searching: false, error: null, version: 0 });

  private engine = new UciEngine();
  /** Background work is held while the playground uses the engine. */
  private held = false;
  private holdTimer: ReturnType<typeof setTimeout> | null = null;
  private lastLiveRequest = 0;
  /** The position the playground wants analysed now. */
  private liveWant: string | null = null;
  private livePump: Promise<void> | null = null;
  /** Position of the live search currently on the engine (or queued for it). */
  private liveRunning: string | null = null;
  private liveStopped = false;
  private liveCache = new Map<string, LiveResult>();
  private loop: Promise<void> | null = null;
  private priorityId: string | null = null;
  private cancelCurrent = false;
  private started = false;
  private candidates = new CandidateQueue();
  /**
   * The deeper re-analysis in progress. It runs before any background work (even while background
   * analysis is paused), yields to live playground analysis like everything else, and keeps the
   * positions it has evaluated so a hold resumes where it stopped instead of starting over.
   */
  private deepJob: { gameId: string; depth: number; evals: PositionEval[]; cancelled: boolean } | null = null;
  private deepRunning = false;

  /** Starts watching the queue. Safe to call more than once. */
  start() {
    if (this.started) return;
    this.started = true;
    liveQuery(() => db.games.where('analysisStatus').equals('pending').count()).subscribe({
      next: (count) => {
        this.store.set({ queueLength: count });
        if (count > 0) this.kick();
      },
    });
    // Puzzle candidates left over from games analysed earlier (no engine start if there are none).
    void this.candidates.next().then((c) => c && this.kick());
  }

  pause() {
    settingsStore.set({ analysisPaused: true });
    this.store.set({ paused: true });
    this.interrupt();
  }

  resume() {
    settingsStore.set({ analysisPaused: false });
    this.store.set({ paused: false, error: null });
    this.kick();
  }

  /** Puts a game at the front of the queue (interrupting a different game or a puzzle check). */
  prioritize(gameId: string) {
    this.priorityId = gameId;
    const { currentGameId, puzzleChecking } = this.store.get();
    if ((currentGameId && currentGameId !== gameId) || puzzleChecking) this.interrupt();
    this.kick();
  }

  /**
   * Re-analyses one already analysed game at `depth`, ahead of the background queue. The stored
   * analysis stays in place until the new one is complete, then both are swapped in one transaction.
   * Replaces a deeper re-analysis of another game that is still running.
   */
  reanalyze(gameId: string, depth: number) {
    this.cancelDeep();
    this.deepJob = { gameId, depth, evals: [], cancelled: false };
    this.deep.set({ gameId, depth, done: 0, total: 0, error: null });
    this.interrupt();
    this.kick();
  }

  /** Cancels the deeper re-analysis; the stored analysis is left as it was. */
  cancelDeep() {
    const job = this.deepJob;
    if (job) {
      job.cancelled = true;
      this.deepJob = null;
      if (this.deepRunning) this.engine.stop();
    }
    this.deep.set({ gameId: null, depth: 0, done: 0, total: 0, error: null });
  }

  /** Deletes all analysis and re-queues every game. */
  async clearAll() {
    this.cancelDeep();
    this.interrupt();
    await this.loop;
    await db.transaction('rw', db.analyses, db.moves, db.games, async () => {
      await db.analyses.clear();
      await db.moves.clear();
      await db.games.toCollection().modify({ analysisStatus: 'pending' });
    });
    this.candidates.invalidate();
    this.kick();
  }

  /** Stops the engine for good (used before wiping the database). */
  async shutdown() {
    this.store.set({ paused: true });
    this.cancelDeep();
    this.setLivePosition(null);
    this.interrupt();
    await this.loop;
    this.engine.terminate();
  }

  /* ------------------------------------------------------------ Interactive analysis */

  /**
   * Asks for live analysis of `fen` (null: the playground no longer needs the engine).
   * Interrupts background work; a newer request supersedes an older one immediately.
   */
  setLivePosition(fen: string | null) {
    if (fen === this.liveWant) return;
    this.liveWant = fen;
    const cached = fen ? this.liveCache.get(fen) : undefined;
    const terminal = !!fen && new Chess(fen).moves().length === 0;
    this.live.set({
      fen,
      lines: cached?.lines ?? [],
      depth: cached?.depth ?? 0,
      searching: !!fen && !terminal && !cached?.complete,
      error: null,
    });
    if (this.liveRunning && this.liveRunning !== fen) this.stopLive();
    if (!fen || terminal) {
      this.scheduleRelease(LIVE_LEAVE_MS);
      return;
    }
    this.lastLiveRequest = Date.now();
    this.hold();
    this.scheduleRelease(LIVE_IDLE_MS);
    if (!cached?.complete) this.pumpLive();
  }

  /** The best live result seen for a position (for comparing moves), if any. */
  liveResult(fen: string): LiveResult | undefined {
    return this.liveCache.get(fen);
  }

  private hold() {
    if (this.held) return;
    this.held = true;
    this.store.set({ interactive: true });
    this.interrupt();
    // The deep job keeps what it has evaluated and resumes once released.
    if (this.deepRunning) this.engine.stop();
  }

  private scheduleRelease(ms: number) {
    if (this.holdTimer) clearTimeout(this.holdTimer);
    this.holdTimer = null;
    if (this.held) this.holdTimer = setTimeout(() => this.maybeRelease(), ms);
  }

  /** Hands the engine back to background work once the playground is idle or gone. */
  private maybeRelease() {
    this.holdTimer = null;
    if (this.liveWant && this.liveRunning && Date.now() - this.lastLiveRequest < LIVE_IDLE_MAX_MS) {
      // Still refining the position on screen: give it a little longer.
      this.holdTimer = setTimeout(() => this.maybeRelease(), 2_000);
      return;
    }
    if (this.liveRunning) this.stopLive();
    this.held = false;
    this.store.set({ interactive: false });
    this.kick();
  }

  private stopLive() {
    this.liveStopped = true;
    this.engine.stop();
  }

  private needsLive(): boolean {
    return !!this.liveWant && this.held && !this.liveCache.get(this.liveWant)?.complete;
  }

  private pumpLive() {
    if (this.livePump) return;
    this.livePump = this.runLive().finally(() => {
      this.livePump = null;
      if (this.needsLive()) this.pumpLive();
    });
  }

  /** Searches the wanted position until it is fully searched, superseded or released. */
  private async runLive() {
    while (this.needsLive()) {
      const fen = this.liveWant!;
      this.liveRunning = fen;
      this.liveStopped = false;
      try {
        const { lines } = await this.engine.analyze(fen, LIVE_MAX_DEPTH, {
          multiPv: LIVE_MULTI_PV,
          onUpdate: (l) => this.storeLive(fen, l, false),
          // A request that was superseded while queued behind background work never starts.
          skip: () => this.liveWant !== fen || !this.held,
        });
        if (lines.length) this.storeLive(fen, lines, !this.liveStopped);
      } catch (e) {
        if (this.liveWant === fen) {
          const message = e instanceof Error ? e.message : String(e);
          this.live.set({ searching: false, error: this.liveStopped ? null : message });
        }
        break;
      } finally {
        this.liveRunning = null;
      }
    }
    if (!this.needsLive() && this.live.get().searching) this.live.set({ searching: false });
  }

  private storeLive(fen: string, lines: EngineLine[], complete: boolean) {
    const prev = this.liveCache.get(fen);
    const depth = lines[0]?.depth ?? 0;
    const entry: LiveResult =
      !prev || depth >= prev.depth ? { lines, depth, complete: complete || !!prev?.complete } : { ...prev, complete: complete || prev.complete };
    this.liveCache.delete(fen);
    this.liveCache.set(fen, entry);
    if (this.liveCache.size > LIVE_CACHE_SIZE) this.liveCache.delete(this.liveCache.keys().next().value!);
    const version = this.live.get().version + 1;
    if (this.liveWant === fen) this.live.set({ lines: entry.lines, depth: entry.depth, searching: !entry.complete, version });
    else this.live.set({ version });
  }

  private interrupt() {
    const { currentGameId, puzzleChecking } = this.store.get();
    if (currentGameId || puzzleChecking) {
      this.cancelCurrent = true;
      this.engine.stop();
    }
  }

  private kick() {
    if (this.loop || this.held || this.store.get().status === 'error') return;
    if (this.store.get().paused && !this.deepJob) return;
    this.loop = this.run().finally(() => {
      this.loop = null;
      // Something may have been prioritised, resumed or re-analysed while we were winding down.
      const s = this.store.get();
      if (s.status !== 'error' && ((!s.paused && s.queueLength > 0) || this.deepJob)) this.kick();
    });
  }

  private async nextGame(): Promise<GameRecord | undefined> {
    if (this.priorityId) {
      const g = await db.games.get(this.priorityId);
      if (g?.analysisStatus === 'pending') return g;
      this.priorityId = null;
    }
    return db.games
      .where('[analysisStatus+endTime]')
      .between(['pending', Dexie.minKey], ['pending', Dexie.maxKey])
      .last();
  }

  private async run() {
    try {
      this.store.set({ status: 'starting', error: null });
      await this.engine.init();
      // Puzzle candidates allowed before looking at the game queue again.
      let budget = 0;
      for (;;) {
        if (this.held) break;
        if (this.deepJob) {
          await this.runDeep(this.deepJob);
          continue;
        }
        if (this.store.get().paused) break;
        const game = budget > 0 && !this.priorityId ? undefined : await this.nextGame();
        if (game) {
          await this.analyze(game);
          budget = PUZZLE_RULES.candidatesPerGame;
          continue;
        }
        const candidate = await this.candidates.next();
        if (candidate) {
          await this.verifyCandidate(candidate);
          budget--;
          continue;
        }
        if (budget > 0) {
          budget = 0;
          continue;
        }
        break;
      }
      this.store.set({
        status: this.store.get().paused ? 'paused' : 'idle',
        currentGameId: null,
        done: 0,
        total: 0,
        puzzleRemaining: this.candidates.remaining,
        ...(this.candidates.remaining === 0 && { puzzleChecked: 0 }),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.store.set({ status: 'error', error: message, currentGameId: null, done: 0, total: 0, puzzleChecking: false });
    }
  }

  private async analyze(game: GameRecord) {
    this.cancelCurrent = false;
    this.store.set({ status: 'running', currentGameId: game.uuid, done: 0, total: 0 });
    try {
      const result = await analyzeGame(this.engine, game, analysisDepth(), {
        onProgress: (done, total) => this.store.set({ done, total }),
        isCancelled: () => this.cancelCurrent || this.held,
      });
      if (!result) return;
      await db.transaction('rw', db.analyses, db.moves, db.games, async () => {
        await db.moves.where('gameId').equals(game.uuid).delete();
        await db.moves.bulkPut(result.moves);
        await db.analyses.put(result.analysis);
        await db.games.update(game.uuid, { analysisStatus: 'done' });
      });
      this.candidates.invalidate();
      if (this.priorityId === game.uuid) this.priorityId = null;
    } catch (e) {
      if (e instanceof EngineError && !this.cancelCurrent) throw e;
      if (!(e instanceof EngineError)) {
        console.warn(`Analysis failed for game ${game.uuid}`, e);
        await db.games.update(game.uuid, { analysisStatus: 'failed' });
      }
    } finally {
      this.store.set({ currentGameId: null });
    }
  }

  /** Runs (or resumes) the deeper re-analysis; returns when done, cancelled or held. */
  private async runDeep(job: NonNullable<AnalysisService['deepJob']>) {
    const game = await db.games.get(job.gameId);
    if (job.cancelled) return;
    if (!game) {
      this.cancelDeep();
      return;
    }
    this.store.set({ status: 'running' });
    this.deep.set({ error: null });
    this.deepRunning = true;
    try {
      const result = await analyzeGame(this.engine, game, job.depth, {
        evals: job.evals,
        onProgress: (done, total) => !job.cancelled && this.deep.set({ done, total }),
        isCancelled: () => job.cancelled || this.held,
      });
      if (!result || job.cancelled) return;
      await db.transaction('rw', db.analyses, db.moves, db.games, async () => {
        await db.moves.where('gameId').equals(game.uuid).delete();
        await db.moves.bulkPut(result.moves);
        await db.analyses.put(result.analysis);
        await db.games.update(game.uuid, { analysisStatus: 'done' });
      });
      this.candidates.invalidate();
      if (this.deepJob === job) {
        this.deepJob = null;
        this.deep.set({ gameId: null, depth: 0, done: 0, total: 0, error: null });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (e instanceof EngineError) {
        // The job is kept: "Try again" (retry) resumes it once the engine is back.
        if (!job.cancelled) this.deep.set({ error: message });
        throw e;
      }
      console.warn(`Deeper analysis failed for game ${game.uuid}`, e);
      if (this.deepJob === job) this.deepJob = null;
      // Kept on screen (with the game id) until dismissed.
      this.deep.set({ error: message });
    } finally {
      this.deepRunning = false;
    }
  }

  /** Verifies one puzzle candidate; an interrupted check is left for later. */
  private async verifyCandidate(candidate: Parameters<typeof buildPuzzle>[1]) {
    this.cancelCurrent = false;
    this.store.set({ status: 'running', puzzleChecking: true, puzzleRemaining: this.candidates.remaining });
    try {
      const result = await buildPuzzle(this.engine, candidate, () => this.cancelCurrent || this.held);
      if ('cancelled' in result) return;
      await this.candidates.complete(candidate, result);
      this.store.set({ puzzleChecked: this.store.get().puzzleChecked + 1 });
    } catch (e) {
      if (e instanceof EngineError) {
        if (!this.cancelCurrent) throw e;
        return;
      }
      console.warn(`Puzzle check failed for ${candidate.game.uuid} ply ${candidate.move.ply}`, e);
      await this.candidates.complete(candidate, { rejected: 'invalid' });
    } finally {
      this.store.set({ puzzleChecking: false, puzzleRemaining: this.candidates.remaining });
    }
  }

  /** Reloads the puzzle candidate list (e.g. after stored games were reclassified) and checks new ones. */
  refreshPuzzleCandidates() {
    this.candidates.invalidate();
    if (this.started) void this.candidates.next().then((c) => c && this.kick());
  }

  /** Clears an engine error and tries again. */
  retry() {
    this.store.set({ status: 'idle', error: null });
    this.deep.set({ error: null });
    this.kick();
  }
}

export const analysisService = new AnalysisService();
