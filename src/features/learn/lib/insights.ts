import { pluralize } from '../../../lib/format';
import type { Lesson } from '../types';
import { getLesson, isTrap, LESSONS, sideName } from './catalog';
import { scoreOf, type PersonalStats, type TrapHits } from './personal';
import { lessonStatus, type LearnProgress } from './progress';

/** What the owner's games say about a trap, most important first. */
export function trapHeadline(hits: TrapHits | undefined): { title: string; body: string; bad: boolean } | null {
  if (!hits) return null;
  if (hits.fell)
    return { title: `You walked into this ${times(hits.fell)}`, body: 'Learn the defence so it never happens again.', bad: true };
  if (hits.sprung) return { title: `You sprang it ${times(hits.sprung)}`, body: 'Your opponents fell for it. Keep it in your pocket.', bad: false };
  if (hits.dodged) return { title: `You sidestepped it ${times(hits.dodged)}`, body: 'Opponents set the bait and you avoided the mistake.', bad: false };
  if (hits.chances)
    return { title: `You had the chance ${times(hits.chances)}`, body: 'Your games reached the position just before the bait.', bad: false };
  return null;
}

const times = (n: number) => (n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`);

/** Games and score over every opening group that leads into a lesson. */
export function openingTotals(stats: PersonalStats, lessonId: string) {
  const groups = stats.openings.filter((g) => g.lessonId === lessonId);
  const sum = groups.reduce((t, g) => ({ games: t.games + g.games, wins: t.wins + g.wins, draws: t.draws + g.draws }), { games: 0, wins: 0, draws: 0 });
  return { games: sum.games, score: scoreOf(sum) };
}

export interface Recommendation {
  lesson: Lesson;
  reason: string;
  tone: 'bad' | 'info';
}

/** Starter course when there are no games to learn from. */
const DEFAULT_ORDER = ['italian-game', 'two-knights', 'london-system', 'queens-gambit-declined', 'legal-mate', 'fried-liver', 'scholars-mate', 'caro-kann'];

/**
 * Lessons worth doing next, from the owner's games: traps they fell for, their most played
 * and worst-scoring openings, then traps their games reached. Completed lessons are skipped.
 */
export function recommend(stats: PersonalStats | undefined, progress: LearnProgress, now: number, limit = 4): Recommendation[] {
  const out: Recommendation[] = [];
  const add = (id: string | undefined, reason: string, tone: Recommendation['tone'] = 'info') => {
    const lesson = getLesson(id);
    if (!lesson || out.some((r) => r.lesson === lesson) || lessonStatus(lesson, progress, now).completed) return;
    out.push({ lesson, reason, tone });
  };

  if (stats && stats.games > 0) {
    const traps = Object.entries(stats.traps);
    for (const [id, h] of traps.filter(([, h]) => h.fell).sort((a, b) => b[1].fell - a[1].fell)) {
      add(id, `You walked into this ${times(h.fell)}`, 'bad');
    }
    for (const color of ['white', 'black'] as const) {
      const linked = stats.openings.filter((g) => g.color === color && g.lessonId && g.games >= 3);
      const worst = linked.filter((g) => g.games >= 5 && scoreOf(g) < 0.45).sort((a, b) => scoreOf(a) - scoreOf(b))[0];
      if (worst) add(worst.lessonId, `You score ${Math.round(scoreOf(worst) * 100)}% in ${worst.name} · ${pluralize(worst.games, 'game')}`, 'bad');
      const most = linked[0];
      if (most) add(most.lessonId, `Your most played as ${sideName(color)} · ${pluralize(most.games, 'game')}`);
    }
    // Only sound traps are worth recommending just because the position came up.
    const sound = (id: string) => {
      const l = getLesson(id);
      return !!l && isTrap(l) && l.source.sound;
    };
    for (const [id, h] of traps.filter(([id, h]) => h.chances && sound(id)).sort((a, b) => b[1].chances - a[1].chances)) {
      add(id, `Your games reached this ${times(h.chances)}`);
    }
  }
  for (const id of DEFAULT_ORDER) add(id, stats?.games ? 'Popular at club level' : 'A great place to start');
  // Everything done: fall back to the full course order.
  for (const l of LESSONS) add(l.source.id, 'Keep it fresh');
  return out.slice(0, limit);
}
