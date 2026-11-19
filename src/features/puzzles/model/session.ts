import type { PuzzleResult } from '../../../lib/types';

/** Puzzles per training set. */
export const SET_SIZE = 3;

/** How one puzzle of the set went. `dueAt` is when it comes back. */
export interface SetEntry {
  result: PuzzleResult;
  wrongMoves: number;
  hints: number;
  dueAt: number;
}

/** A training session: the current set plus everything already played in this session. */
export interface TrainSession {
  /** The current set, in play order. */
  ids: string[];
  /** Position in `ids`; equal to `ids.length` when the set summary is showing. */
  index: number;
  results: Record<string, SetEntry>;
  /** Every puzzle already offered this session (so "Next set" never repeats one). */
  used: string[];
  setNo: number;
}

const KEY = 'blunderlab.train.session';
const TTL_MS = 30 * 60_000;

/** The session is kept in sessionStorage so opening a puzzle from the summary and coming back keeps it. */
export function loadSession(search: string): TrainSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { search: string; at: number; session: TrainSession };
    if (saved.search !== search || Date.now() - saved.at > TTL_MS) return null;
    return saved.session;
  } catch {
    return null;
  }
}

export function saveSession(search: string, session: TrainSession) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ search, at: Date.now(), session }));
  } catch {
    /* storage unavailable: the session just will not survive leaving the page */
  }
}

export function clearSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
