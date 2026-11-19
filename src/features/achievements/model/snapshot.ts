import { db } from '../../../lib/db';
import { lessonStatus, type LearnProgress } from '../../learn/lib/progress';
import { SCHEDULE } from '../../puzzles/model/schedule';
import { computeStreak, dayIndex, type StreakInfo } from './streak';
import { titleFor, XP, type TitleProgress } from './titles';

/**
 * Everything streaks, titles and badges need, worked out from the data already on the device
 * (puzzle attempts from both sources, the activity log, Learn progress, game analyses), so it
 * also covers what the owner did before these features existed.
 */
export interface ProgressSnapshot {
  streak: StreakInfo;
  title: TitleProgress;
  /** Times (ms, ascending) of puzzles solved cleanly or with help. */
  solved: { all: number[]; own: number[]; lichess: number[]; clean: number[] };
  /** Lichess puzzles solved, with the puzzle's rating. */
  lichessSolved: { at: number; rating: number; origin: string }[];
  lichess: { rating: number | null; start: number | null; gain100At: number | null };
  /** Times the n-th own puzzle reached the mastered box (approximate: its last attempt). */
  masteredOwn: number[];
  /** Completion times (ascending) of finished lessons. */
  lessons: { openings: number[]; traps: number[]; totalOpenings: number; totalTraps: number; linesDone: number };
  firstBrilliantAt: number | null;
  firstAccuracy90At: number | null;
  firstNightOwlAt: number | null;
}

const asc = (a: number, b: number) => a - b;

export async function computeSnapshot(learn: LearnProgress, now = Date.now()): Promise<ProgressSnapshot> {
  // Lesson content loads on demand (as in Learn), keeping it out of the first paint.
  const { LESSONS, isTrap } = await import('../../learn/lib/catalog');
  const [ownAttempts, lichessAttempts, activity, puzzles, rating, brilliantMoves] = await Promise.all([
    db.puzzleAttempts.toArray(),
    db.lichessAttempts.toArray(),
    db.activity.toArray(),
    db.puzzles.toArray(),
    db.lichessRating.get('owner'),
    db.moves.where('[actor+classification]').equals(['owner', 'brilliant']).toArray(),
  ]);

  const solvedOwn = ownAttempts.filter((a) => a.result !== 'failed');
  const solvedLichess = lichessAttempts.filter((a) => a.result !== 'failed');
  const own = solvedOwn.map((a) => a.at).sort(asc);
  const lichess = solvedLichess.map((a) => a.at).sort(asc);
  const all = [...own, ...lichess].sort(asc);
  const clean = [...ownAttempts, ...lichessAttempts]
    .filter((a) => a.result === 'solved')
    .map((a) => a.at)
    .sort(asc);

  // Lessons: a lesson is done when every line was practised cleanly; its date is the last such line.
  const openings: number[] = [];
  const traps: number[] = [];
  let linesDone = 0;
  const activeDays = new Set<number>();
  for (const lesson of LESSONS) {
    const status = lessonStatus(lesson, learn, now);
    let last = 0;
    for (const pl of lesson.playables) {
      const lp = learn.lines[`${lesson.source.id}/${pl.key}`];
      if (lp?.learnedAt) activeDays.add(dayIndex(lp.learnedAt));
      if (lp?.cleanAt) {
        linesDone++;
        activeDays.add(dayIndex(lp.cleanAt));
        last = Math.max(last, lp.cleanAt);
      }
    }
    if (status.completed && status.total > 0) (isTrap(lesson) ? traps : openings).push(last);
  }
  openings.sort(asc);
  traps.sort(asc);

  for (const t of all) activeDays.add(dayIndex(t));
  for (const e of activity) if (e.kind === 'lesson' || e.result !== 'failed') activeDays.add(dayIndex(e.at));
  const streak = computeStreak(activeDays, dayIndex(now));

  const lessonsDone = openings.length + traps.length;
  const xp = all.length * XP.puzzle + linesDone * XP.line + lessonsDone * XP.lesson + streak.best * XP.streakDay;

  // Lichess rating gain of 100 over the starting rating.
  let gain100At: number | null = null;
  const start = rating?.seed.start ?? null;
  if (start !== null) {
    const hit = [...lichessAttempts].sort((a, b) => a.at - b.at).find((a) => a.ratingAfter >= start + 100);
    gain100At = hit?.at ?? null;
  }

  const masteredOwn = puzzles
    .filter((p) => p.box >= SCHEDULE.masteredBox)
    .map((p) => p.lastAttemptAt ?? now)
    .sort(asc);

  // First brilliant move: the end time of the earliest game that has one.
  let firstBrilliantAt: number | null = null;
  if (brilliantMoves.length) {
    const ids = [...new Set(brilliantMoves.map((m) => m.gameId))];
    const analyses = await db.analyses.bulkGet(ids);
    for (const a of analyses) if (a) firstBrilliantAt = Math.min(firstBrilliantAt ?? Infinity, a.endTime);
  }

  let firstAccuracy90At: number | null = null;
  await db.analyses.each((a) => {
    if (a.ownerAccuracy >= 90) firstAccuracy90At = Math.min(firstAccuracy90At ?? Infinity, a.endTime);
  });

  const night = all.find((t) => new Date(t).getHours() < 5);

  return {
    streak,
    title: titleFor(xp),
    solved: { all, own, lichess, clean },
    lichessSolved: solvedLichess.map((a) => ({ at: a.at, rating: a.puzzleRating, origin: a.origin })).sort((a, b) => a.at - b.at),
    lichess: { rating: rating ? Math.round(rating.rating) : null, start, gain100At },
    masteredOwn,
    lessons: {
      openings,
      traps,
      totalOpenings: LESSONS.filter((l) => !isTrap(l)).length,
      totalTraps: LESSONS.filter(isTrap).length,
      linesDone,
    },
    firstBrilliantAt,
    firstAccuracy90At,
    firstNightOwlAt: night ?? null,
  };
}
