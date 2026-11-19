import type { Color } from '../../../lib/types';
import { SOURCES } from '../content';
import type { Lesson, OpeningSource, Playable, TrapSource } from '../types';
import { resolveLesson } from './lines';

/**
 * The resolved course. Every line is replayed with chess.js once, when this module loads
 * (a few milliseconds); the validation script guarantees the data replays cleanly.
 */
export const LESSONS: Lesson[] = SOURCES.map(resolveLesson);

const byId = new Map(LESSONS.map((l) => [l.source.id, l]));

export const getLesson = (id: string | undefined) => (id ? byId.get(id) : undefined);

export const getPlayable = (lesson: Lesson, key: string | undefined) => lesson.playables.find((p) => p.key === key);

export type OpeningLesson = Lesson & { source: OpeningSource };
export type TrapLesson = Lesson & { source: TrapSource };

export const isOpening = (l: Lesson): l is OpeningLesson => l.source.kind === 'opening';
export const isTrap = (l: Lesson): l is TrapLesson => l.source.kind === 'trap';

const ordered = (list: Lesson[]) => [...list].sort((a, b) => a.source.order - b.source.order);

export const OPENINGS = ordered(LESSONS.filter(isOpening)) as OpeningLesson[];
export const TRAPS = ordered(LESSONS.filter(isTrap)) as TrapLesson[];

export const openingsFor = (side: Color) => OPENINGS.filter((l) => l.source.side === side);
export const trapsFor = (side: Color) => TRAPS.filter((l) => l.source.side === side);

/** Short label for a playable, as shown in line lists and the player header. */
export const playableTitle = (p: Playable) => (p.defend ? 'Defend against it' : p.line.name);

/** What the learner does in this playable, in a few words. */
export function playableRole(p: Playable): string | undefined {
  if (p.line.role === 'trap') return 'Spring the trap';
  if (p.defend) return 'Sidestep it';
  if (p.line.role === 'decline') return "If they don't fall for it";
  return undefined;
}

/** `3.Bb5` / `3...a6` */
export const moveLabel = (moveNumber: number, color: Color, san: string) => `${moveNumber}${color === 'white' ? '.' : '...'}${san}`;

export const sideName = (c: Color) => (c === 'white' ? 'White' : 'Black');
