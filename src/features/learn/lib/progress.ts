import { useEffect, useState, useSyncExternalStore } from 'react';
import type { Lesson } from '../types';

/**
 * Learn progress, kept in localStorage (the Learn feature owns no IndexedDB tables).
 * Each line ("playable") is learned once in guided mode, then practised from memory on a
 * Leitner schedule: a clean run moves it up a box, a run with mistakes or hints drops it to
 * box 0 and brings it back the next day.
 */

const KEY = 'blunderlab:learn:v1';
const DAY = 24 * 60 * 60 * 1000;
/** Review interval after a clean run that lands in box 1..5. */
export const BOX_INTERVALS = [1 * DAY, 3 * DAY, 7 * DAY, 16 * DAY, 35 * DAY];
const ASSISTED_DELAY = 1 * DAY;

export type Mode = 'learn' | 'practice';

export interface LineProgress {
  learnedAt?: number;
  /** Finished practice runs. */
  runs: number;
  box: number;
  dueAt?: number;
  last?: 'clean' | 'assisted';
  /** First practice run without mistakes or hints. */
  cleanAt?: number;
}

export interface LearnProgress {
  lines: Record<string, LineProgress>;
  /** The line most recently played, for "continue where you left off". */
  recent?: { lessonId: string; key: string; mode: Mode; at: number };
}

const EMPTY: LearnProgress = { lines: {} };
const lineId = (lessonId: string, key: string) => `${lessonId}/${key}`;

function read(): LearnProgress {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as LearnProgress) : null;
    return parsed && typeof parsed.lines === 'object' ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

let state = read();
const listeners = new Set<() => void>();

function commit(next: LearnProgress) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: progress still works for this session.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    state = read();
    listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/** Current progress and change notifications, for code outside React (achievements). */
export const getProgress = (): LearnProgress => state;
export { subscribe as subscribeProgress };

export function useProgress(): LearnProgress {
  return useSyncExternalStore(subscribe, () => state);
}

export const lineProgress = (p: LearnProgress, lessonId: string, key: string): LineProgress | undefined => p.lines[lineId(lessonId, key)];

/** Marks a line as opened, for "continue". */
export function touch(lessonId: string, key: string, mode: Mode) {
  commit({ ...state, recent: { lessonId, key, mode, at: Date.now() } });
}

/** Stores a finished run and returns the line's new progress. */
export function recordRun(lessonId: string, key: string, mode: Mode, clean: boolean, now = Date.now()): LineProgress {
  const id = lineId(lessonId, key);
  const prev = state.lines[id] ?? { runs: 0, box: 0 };
  let next: LineProgress;
  if (mode === 'learn') {
    next = { ...prev, learnedAt: prev.learnedAt ?? now };
  } else {
    const box = clean ? Math.min(BOX_INTERVALS.length, prev.box + 1) : 0;
    next = {
      ...prev,
      learnedAt: prev.learnedAt ?? now,
      runs: prev.runs + 1,
      box,
      dueAt: now + (clean ? BOX_INTERVALS[box - 1]! : ASSISTED_DELAY),
      last: clean ? 'clean' : 'assisted',
      cleanAt: prev.cleanAt ?? (clean ? now : undefined),
    };
  }
  commit({ ...state, lines: { ...state.lines, [id]: next } });
  return next;
}

export type LineStatus = 'new' | 'learned' | 'due' | 'practised' | 'mastered';

/** Box at which a line counts as mastered. */
export const MASTERED_BOX = 3;

export function lineStatus(lp: LineProgress | undefined, now: number): LineStatus {
  if (!lp) return 'new';
  if (lp.runs === 0) return 'learned';
  if (lp.dueAt !== undefined && lp.dueAt <= now) return 'due';
  return lp.box >= MASTERED_BOX ? 'mastered' : 'practised';
}

export interface LessonStatus {
  /** Lines practised cleanly at least once. */
  done: number;
  total: number;
  started: boolean;
  completed: boolean;
  due: number;
  /** Earliest future review among the lesson's practised lines. */
  nextDueAt: number | null;
}

/** A lesson is complete once every line has been practised cleanly from memory at least once. */
export function lessonStatus(lesson: Lesson, p: LearnProgress, now: number): LessonStatus {
  let done = 0;
  let due = 0;
  let started = false;
  let nextDueAt: number | null = null;
  for (const pl of lesson.playables) {
    const lp = lineProgress(p, lesson.source.id, pl.key);
    if (!lp) continue;
    started = true;
    if (lp.cleanAt) done++;
    if (lp.dueAt !== undefined) {
      if (lp.dueAt <= now) due++;
      else nextDueAt = nextDueAt === null ? lp.dueAt : Math.min(nextDueAt, lp.dueAt);
    }
  }
  const total = lesson.playables.length;
  return { done, total, started, completed: done === total, due, nextDueAt };
}

/** Current time, refreshed every minute so "due" moves on while a screen stays open. */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
