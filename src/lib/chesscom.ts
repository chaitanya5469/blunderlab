import { CHESSCOM_API, FETCH_BACKOFF_MS, FETCH_MAX_RETRIES, FETCH_NETWORK_RETRIES } from './constants';
import type { Color, GameRecord, GameResult, PlayerInfo, Ratings } from './types';

export class NotFoundError extends Error {}
export class NetworkError extends Error {}

interface ApiPlayer {
  username: string;
  name?: string;
  avatar?: string;
  url?: string;
}

interface ApiStatsEntry {
  last?: { rating: number };
}

type ApiStats = Partial<Record<'chess_bullet' | 'chess_blitz' | 'chess_rapid' | 'chess_daily', ApiStatsEntry>>;

interface ApiGameSide {
  username: string;
  rating: number;
  result: string;
}

export interface ApiGame {
  url: string;
  uuid?: string;
  pgn?: string;
  time_control: string;
  time_class: string;
  rules: string;
  rated: boolean;
  end_time: number;
  eco?: string;
  accuracies?: { white: number; black: number };
  white: ApiGameSide;
  black: ApiGameSide;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** GET JSON with exponential backoff on 429 / 5xx / network failure. 404 throws NotFoundError. */
async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  let lastError = '';
  let networkFailures = 0;
  for (let attempt = 0; attempt <= FETCH_MAX_RETRIES; attempt++) {
    if (attempt > 0) await sleep(FETCH_BACKOFF_MS * 2 ** (attempt - 1));
    let res: Response;
    try {
      res = await fetch(url, { signal });
    } catch (e) {
      if (signal?.aborted) throw e;
      // Offline or blocked: retry briefly, then fail fast instead of backing off for a minute.
      if (++networkFailures > FETCH_NETWORK_RETRIES) throw new NetworkError('Could not reach Chess.com. Check your connection.');
      continue;
    }
    if (res.ok) return (await res.json()) as T;
    if (res.status === 404) throw new NotFoundError(`Not found: ${url}`);
    if (res.status === 429 || res.status >= 500) {
      const retryAfter = Number(res.headers.get('Retry-After'));
      if (retryAfter > 0) await sleep(retryAfter * 1000);
      lastError = res.status === 429 ? 'Chess.com is rate-limiting requests.' : `Chess.com error ${res.status}.`;
      continue;
    }
    throw new NetworkError(`Chess.com responded ${res.status}.`);
  }
  throw new NetworkError(lastError || 'Request failed.');
}

const enc = (username: string) => encodeURIComponent(username.trim().toLowerCase());

export function fetchPlayer(username: string, signal?: AbortSignal) {
  return getJson<ApiPlayer>(`${CHESSCOM_API}/player/${enc(username)}`, signal);
}

export async function fetchRatings(username: string, signal?: AbortSignal): Promise<Ratings> {
  const s = await getJson<ApiStats>(`${CHESSCOM_API}/player/${enc(username)}/stats`, signal);
  return {
    bullet: s.chess_bullet?.last?.rating,
    blitz: s.chess_blitz?.last?.rating,
    rapid: s.chess_rapid?.last?.rating,
    daily: s.chess_daily?.last?.rating,
  };
}

/** Monthly archive URLs, oldest first (as returned by the API). */
export async function fetchArchiveList(username: string, signal?: AbortSignal): Promise<string[]> {
  const data = await getJson<{ archives: string[] }>(`${CHESSCOM_API}/player/${enc(username)}/games/archives`, signal);
  return data.archives;
}

export async function fetchArchive(url: string, signal?: AbortSignal): Promise<ApiGame[]> {
  const data = await getJson<{ games: ApiGame[] }>(url, signal);
  return data.games;
}

/** 'https://.../games/2025/03' -> '2025/03' */
export function archiveMonth(url: string): string {
  const m = /(\d{4})\/(\d{2})\/?$/.exec(url);
  return m ? `${m[1]}/${m[2]}` : url;
}

const DRAW_CODES = new Set(['agreed', 'repetition', 'stalemate', 'insufficient', '50move', 'timevsinsufficient']);

function resultFor(code: string): GameResult {
  if (code === 'win') return 'win';
  return DRAW_CODES.has(code) ? 'draw' : 'loss';
}

/** 'https://www.chess.com/openings/Sicilian-Defense-Closed-2...d6-3.g3' -> 'Sicilian Defense Closed' */
export function openingNameFromEcoUrl(ecoUrl: string | undefined): string | undefined {
  if (!ecoUrl) return undefined;
  const slug = ecoUrl.split('/openings/')[1];
  if (!slug) return undefined;
  const words: string[] = [];
  for (const part of decodeURIComponent(slug).split('-')) {
    if (/^\d/.test(part)) break;
    words.push(part);
  }
  return words.join(' ') || undefined;
}

function pgnTag(pgn: string, tag: string): string | undefined {
  return new RegExp(`\\[${tag} "([^"]*)"\\]`).exec(pgn)?.[1];
}

const side = (s: ApiGameSide): PlayerInfo => ({ username: s.username, rating: s.rating, resultCode: s.result });

/** Maps an API game to a stored record, or null for variants / games without PGN / not the owner's. */
export function toGameRecord(g: ApiGame, ownerUsername: string, month: string): GameRecord | null {
  if (g.rules !== 'chess' || !g.pgn) return null;
  const owner = ownerUsername.toLowerCase();
  let ownerColor: Color;
  if (g.white.username.toLowerCase() === owner) ownerColor = 'white';
  else if (g.black.username.toLowerCase() === owner) ownerColor = 'black';
  else return null;
  const uuid = g.uuid ?? g.url;
  return {
    uuid,
    url: g.url,
    pgn: g.pgn,
    month,
    endTime: g.end_time * 1000,
    timeControl: g.time_control,
    timeClass: g.time_class,
    rated: g.rated,
    white: side(g.white),
    black: side(g.black),
    ownerColor,
    result: resultFor(g[ownerColor].result),
    eco: pgnTag(g.pgn, 'ECO'),
    openingName: openingNameFromEcoUrl(g.eco ?? pgnTag(g.pgn, 'ECOUrl')),
    chesscomAccuracy: g.accuracies,
    analysisStatus: 'pending',
  };
}
