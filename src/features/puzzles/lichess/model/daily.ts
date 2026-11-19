import { Chess } from 'chess.js';
import { db } from '../../../../lib/db';
import type { LichessDaily, LichessPuzzle } from '../../../../lib/types';

const DAILY_URL = 'https://lichess.org/api/puzzle/daily';
const TIMEOUT_MS = 10_000;

/** Local calendar day, 'YYYY-MM-DD'. */
export function dayKey(ms = Date.now()): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface DailyResponse {
  game?: { pgn?: string };
  puzzle?: { id?: string; rating?: number; solution?: string[]; themes?: string[]; fen?: string; lastMove?: string; initialPly?: number };
}

/**
 * Parses GET /api/puzzle/daily. Current responses carry `puzzle.fen` (player to move) and
 * `puzzle.lastMove`; older ones only the game PGN up to the puzzle (initialPly + 1 moves),
 * so the position is replayed from it when `fen` is missing.
 */
export function parseDaily(json: DailyResponse): LichessPuzzle {
  const p = json.puzzle;
  if (!p?.id || !Array.isArray(p.solution) || p.solution.length === 0 || typeof p.rating !== 'number') throw new Error('Unexpected daily puzzle format');
  let fen = p.fen;
  let lastMove = p.lastMove ?? null;
  if (!fen) {
    const sans = (json.game?.pgn ?? '').split(/\s+/).filter((t) => t && !/^\d+\.+$/.test(t));
    const plies = typeof p.initialPly === 'number' ? sans.slice(0, p.initialPly + 1) : sans;
    const chess = new Chess();
    for (const san of plies) {
      const m = chess.move(san);
      lastMove = m.from + m.to + (m.promotion ?? '');
    }
    fen = chess.fen();
  }
  // Validates the whole line before it is cached.
  const chess = new Chess(fen);
  for (const uci of p.solution) chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
  return { id: p.id, fen, lastMove, solution: p.solution, rating: p.rating, themes: p.themes ?? [] };
}

/**
 * Lichess sends `Access-Control-Allow-Origin: *` on its API (documented in the OpenAPI spec),
 * so a plain fetch works from the browser and from the Android WebView (`https://localhost`).
 */
async function fetchDaily(): Promise<LichessPuzzle> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(DAILY_URL, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Lichess answered ${res.status}`);
    return parseDaily((await res.json()) as DailyResponse);
  } finally {
    clearTimeout(t);
  }
}

export type DailyState =
  | { status: 'ready'; daily: LichessDaily; stale: boolean; error: string | null }
  | { status: 'error'; error: string };

/**
 * Today's puzzle: from the cache when already fetched today, otherwise from Lichess (and cached).
 * Offline, the most recent cached puzzle is returned marked stale.
 */
export async function getDaily(force = false): Promise<DailyState> {
  const today = dayKey();
  const cached = await db.lichessDaily.get(today);
  if (cached && !force) return { status: 'ready', daily: cached, stale: false, error: null };
  try {
    const puzzle = await fetchDaily();
    const daily: LichessDaily = { date: today, fetchedAt: Date.now(), puzzle };
    await db.transaction('rw', db.lichessDaily, async () => {
      await db.lichessDaily.put(daily);
      // Keep a week of history; older days are never shown.
      const old = (await db.lichessDaily.toCollection().primaryKeys()).filter((k) => k < dayKey(Date.now() - 7 * 86_400_000));
      await db.lichessDaily.bulkDelete(old);
    });
    return { status: 'ready', daily, stale: false, error: null };
  } catch (e) {
    const error = e instanceof Error && e.name !== 'AbortError' && !/fetch|network|load failed/i.test(e.message) ? e.message : 'Could not reach Lichess';
    if (cached) return { status: 'ready', daily: cached, stale: false, error: null };
    const latest = await db.lichessDaily.orderBy('date').last();
    return latest ? { status: 'ready', daily: latest, stale: true, error } : { status: 'error', error };
  }
}
