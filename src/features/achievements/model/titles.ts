/**
 * The title ladder. Titles are earned with XP from combined progress:
 * puzzles solved (both sources), lesson lines learned, lessons completed and the best streak.
 */

export const XP = {
  /** Per puzzle solved, cleanly or with help (failed attempts give nothing). */
  puzzle: 10,
  /** Per lesson line practised cleanly from memory at least once. */
  line: 20,
  /** Bonus per lesson with every line done. */
  lesson: 50,
  /** Per day of the best streak so far. */
  streakDay: 15,
} as const;

export interface Title {
  name: string;
  /** XP needed. */
  xp: number;
  /** One short line about the title. */
  blurb: string;
}

export const TITLES: Title[] = [
  { name: 'Wood Pusher', xp: 0, blurb: 'Every master once moved a piece without a plan.' },
  { name: 'Tactics Apprentice', xp: 100, blurb: 'The simple tricks are starting to jump out at you.' },
  { name: 'Fork Finder', xp: 300, blurb: 'Two targets, one knight, no mercy.' },
  { name: 'Pin Artist', xp: 700, blurb: 'Pieces freeze when you line them up.' },
  { name: 'Combination Hunter', xp: 1300, blurb: 'Checks, captures, threats: you look at all of them.' },
  { name: 'Positional Sage', xp: 2200, blurb: 'Outposts, open files, weak squares. Calm and deep.' },
  { name: 'Club Champion', xp: 3500, blurb: 'The name on the trophy at the local club.' },
  { name: 'Lord of the Long Diagonal', xp: 5500, blurb: 'Your bishops see the whole board.' },
  { name: 'Grandmaster of the Lab', xp: 8500, blurb: 'Your blunders have become lessons.' },
  { name: 'The Immortal', xp: 13000, blurb: 'A legend to rival the Immortal Game of 1851.' },
];

export interface TitleProgress {
  level: number;
  title: Title;
  next: Title | null;
  xp: number;
  /** 0..1 towards the next title (1 at the top). */
  fraction: number;
  toNext: number;
}

export function titleFor(xp: number): TitleProgress {
  let level = 0;
  while (level + 1 < TITLES.length && xp >= TITLES[level + 1]!.xp) level++;
  const title = TITLES[level]!;
  const next = TITLES[level + 1] ?? null;
  const fraction = next ? (xp - title.xp) / (next.xp - title.xp) : 1;
  return { level, title, next, xp, fraction, toNext: next ? next.xp - xp : 0 };
}
