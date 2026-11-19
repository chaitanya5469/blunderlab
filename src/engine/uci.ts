import { Chess } from 'chess.js';
import { ENGINE_HASH_MB, ENGINE_SCRIPT, ENGINE_WASM } from '../lib/constants';
import { sideToMove } from '../lib/pgn';
import type { Score } from '../lib/types';

export interface EngineEval {
  /** White's point of view. */
  score: Score;
  bestMove: string | null;
  pv: string[];
  depth: number;
}

/** One line of a MultiPV search, best first. */
export interface EngineLine {
  /** White's point of view. */
  score: Score;
  /** Principal variation, UCI; `pv[0]` is the line's first move. */
  pv: string[];
  depth: number;
}

interface Pending {
  onLine: (line: string) => boolean;
  resolve: () => void;
  reject: (e: Error) => void;
}

/** Any failure of the engine itself (as opposed to a bad game). */
export class EngineError extends Error {}

const INIT_TIMEOUT_MS = 30_000;

/**
 * Stockfish (WASM, single-threaded) in a Web Worker, spoken to over UCI.
 * Commands are serialised: one search at a time.
 */
export class UciEngine {
  private worker: Worker | null = null;
  private pending: Pending | null = null;
  private ready: Promise<void> | null = null;
  private chain: Promise<unknown> = Promise.resolve();

  init(): Promise<void> {
    this.ready ??= this.boot().catch((e: unknown) => {
      this.terminate();
      throw e instanceof EngineError ? e : new EngineError(e instanceof Error ? e.message : String(e));
    });
    return this.ready;
  }

  private async boot() {
    const script = new URL(ENGINE_SCRIPT, document.baseURI).href;
    // The engine reads the wasm location from its URL hash (see stockfish.js loader).
    const wasm = new URL(ENGINE_WASM, document.baseURI).href;
    const worker = new Worker(`${script}#${encodeURIComponent(wasm)}`);
    this.worker = worker;
    worker.onmessage = (e: MessageEvent) => this.handleLine(String(e.data));
    worker.onerror = (e: ErrorEvent) => {
      e.preventDefault();
      this.failPending(new EngineError(`Engine worker error: ${e.message || 'failed to load'}`));
    };
    const timer = setTimeout(() => this.failPending(new EngineError('Engine did not start in time.')), INIT_TIMEOUT_MS);
    try {
      await this.exchange(['uci'], (l) => l === 'uciok');
      await this.exchange([`setoption name Hash value ${ENGINE_HASH_MB}`, 'isready'], (l) => l === 'readyok');
    } finally {
      clearTimeout(timer);
    }
  }

  private handleLine(line: string) {
    const p = this.pending;
    if (p && p.onLine(line)) {
      this.pending = null;
      p.resolve();
    }
  }

  private failPending(err: Error) {
    const p = this.pending;
    this.pending = null;
    p?.reject(err);
  }

  /** Posts commands and resolves once `onLine` returns true for an output line. */
  private exchange(commands: string[], onLine: (line: string) => boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.worker) return reject(new EngineError('Engine is not running.'));
      this.pending = { onLine, resolve, reject };
      for (const c of commands) this.worker.postMessage(c);
    });
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const next = this.chain.then(task, task);
    this.chain = next.catch(() => undefined);
    return next;
  }

  newGame(): Promise<void> {
    return this.enqueue(async () => {
      await this.init();
      await this.exchange(['ucinewgame', 'isready'], (l) => l === 'readyok');
    });
  }

  /** Searches `fen` to a fixed depth. Must not be called on terminal positions. */
  evaluate(fen: string, depth: number): Promise<EngineEval> {
    return this.enqueue(async () => {
      await this.init();
      const { lines, bestMove } = await this.search(fen, depth);
      const result = lines.get(1);
      if (!result) throw new EngineError(`Engine returned no score for ${fen}`);
      return { ...result, bestMove };
    });
  }

  /**
   * Best line among every legal move except `exclude` (UCI `searchmoves`), or null when `exclude`
   * is the only legal move. Must not be called on terminal positions.
   */
  evaluateExcluding(fen: string, depth: number, exclude: string): Promise<EngineEval | null> {
    return this.enqueue(async () => {
      const others = new Chess(fen)
        .moves({ verbose: true })
        .map((m) => m.lan)
        .filter((m) => m !== exclude);
      if (!others.length) return null;
      await this.init();
      const { lines, bestMove } = await this.search(fen, depth, undefined, ` searchmoves ${others.join(' ')}`);
      const result = lines.get(1);
      if (!result) throw new EngineError(`Engine returned no score for ${fen}`);
      return { ...result, bestMove: bestMove ?? result.pv[0] ?? null };
    });
  }

  /**
   * Searches `fen` with MultiPV and returns up to `count` lines, best first. The engine is
   * put back to a single line afterwards, so `evaluate` behaves as before.
   * Must not be called on terminal positions.
   */
  evaluateLines(fen: string, depth: number, count: number): Promise<EngineLine[]> {
    return this.enqueue(async () => {
      await this.init();
      this.worker?.postMessage(`setoption name MultiPV value ${count}`);
      try {
        const { lines } = await this.search(fen, depth);
        const out = [...lines.entries()].sort((a, b) => a[0] - b[0]).map(([, l]) => l);
        if (!out.length) throw new EngineError(`Engine returned no lines for ${fen}`);
        return out;
      } finally {
        this.worker?.postMessage('setoption name MultiPV value 1');
      }
    });
  }

  /**
   * Interactive search: like `evaluateLines`, but streams results while it runs. `onUpdate`
   * receives the full set of lines (best first) each time the engine completes an iteration,
   * so callers can show a quick shallow answer and refine it as depth grows. `stop()` ends
   * the search early; the promise then resolves with the deepest complete set seen.
   * Must not be called on terminal positions.
   */
  analyze(
    fen: string,
    depth: number,
    {
      multiPv = 1,
      onUpdate,
      skip,
    }: {
      multiPv?: number;
      onUpdate?: (lines: EngineLine[]) => void;
      /** Checked when the queued search is about to start; true resolves at once with no lines. */
      skip?: () => boolean;
    } = {},
  ): Promise<{ lines: EngineLine[]; bestMove: string | null }> {
    return this.enqueue(async () => {
      if (skip?.()) return { lines: [], bestMove: null };
      await this.init();
      // Stockfish reports min(MultiPV, legal moves) lines per iteration.
      const expected = Math.max(1, Math.min(multiPv, new Chess(fen).moves().length));
      let complete: EngineLine[] = [];
      if (multiPv !== 1) this.worker?.postMessage(`setoption name MultiPV value ${multiPv}`);
      try {
        const { lines, bestMove } = await this.search(fen, depth, (index, all) => {
          // The last line of an iteration arrives last: publish the iteration as a whole.
          if (index !== expected) return;
          const snapshot = [...all.entries()].sort((a, b) => a[0] - b[0]).map(([, l]) => l);
          if (snapshot.length < expected || snapshot.some((l) => l.depth !== snapshot[0]!.depth)) return;
          complete = snapshot;
          onUpdate?.(snapshot);
        });
        if (!complete.length) {
          // Stopped before the first full iteration: use whatever the engine sent.
          complete = [...lines.entries()].sort((a, b) => a[0] - b[0]).map(([, l]) => l);
        }
        return { lines: complete, bestMove };
      } finally {
        if (multiPv !== 1) this.worker?.postMessage('setoption name MultiPV value 1');
      }
    });
  }

  /** Runs one search; keeps the latest scored line per MultiPV index. Call inside `enqueue`. */
  private async search(fen: string, depth: number, onInfo?: (multipv: number, lines: Map<number, EngineLine>) => void, goExtra = '') {
    const flip = sideToMove(fen) === 'black';
    const lines = new Map<number, EngineLine>();
    let bestMove: string | null = null;
    await this.exchange([`position fen ${fen}`, `go depth ${depth}${goExtra}`], (line) => {
      if (line.startsWith('info ')) {
        const parsed = parseInfo(line, flip);
        if (parsed) {
          lines.set(parsed.multipv, { score: parsed.score, pv: parsed.pv, depth: parsed.depth });
          onInfo?.(parsed.multipv, lines);
        }
        return false;
      }
      if (line.startsWith('bestmove')) {
        const move = line.split(/\s+/)[1];
        bestMove = move && move !== '(none)' ? move : null;
        return true;
      }
      return false;
    });
    return { lines, bestMove: bestMove as string | null };
  }

  /** Asks a running search to finish early (its result is still delivered). */
  stop() {
    this.worker?.postMessage('stop');
  }

  terminate() {
    this.failPending(new EngineError('Engine terminated.'));
    this.worker?.terminate();
    this.worker = null;
    this.ready = null;
  }
}

/** Parses a UCI `info` line with a score; converts to White's POV. Ignores bound-only lines. */
function parseInfo(line: string, flip: boolean): { score: Score; pv: string[]; depth: number; multipv: number } | null {
  const t = line.split(/\s+/);
  const si = t.indexOf('score');
  if (si < 0 || t.includes('lowerbound') || t.includes('upperbound')) return null;
  const kind = t[si + 1];
  const raw = Number(t[si + 2]);
  if (!Number.isFinite(raw)) return null;
  const sign = flip ? -1 : 1;
  let score: Score;
  if (kind === 'cp') score = { kind: 'cp', value: raw * sign };
  else if (kind === 'mate' && raw === 0) score = { kind: 'checkmate', winner: flip ? 'white' : 'black' };
  else if (kind === 'mate') score = { kind: 'mate', value: raw * sign };
  else return null;
  const di = t.indexOf('depth');
  const mi = t.indexOf('multipv');
  const pi = t.indexOf('pv');
  return {
    score,
    depth: di >= 0 ? Number(t[di + 1]) : 0,
    multipv: mi >= 0 ? Number(t[mi + 1]) || 1 : 1,
    pv: pi >= 0 ? t.slice(pi + 1) : [],
  };
}
