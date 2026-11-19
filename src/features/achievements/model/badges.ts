import {
  BookOpen,
  Brain,
  CalendarCheck,
  Crown,
  Crosshair,
  Flame,
  GraduationCap,
  Moon,
  Mountain,
  Puzzle,
  Repeat,
  Sparkles,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  Zap,
  Library,
  Sword,
  Medal,
  type LucideIcon,
} from 'lucide-react';
import type { ProgressSnapshot } from './snapshot';

export type BadgeTone = 'accent' | 'best' | 'brilliant' | 'inaccuracy' | 'mistake' | 'miss' | 'lichess' | 'blunder';

export interface BadgeStatus {
  done: boolean;
  /** When it was earned, when the data says so. */
  at?: number | null;
  /** Progress towards a count, for locked badges. */
  progress?: { value: number; target: number };
}

export interface BadgeDef {
  id: string;
  name: string;
  /** How to earn it. */
  description: string;
  icon: LucideIcon;
  tone: BadgeTone;
  check: (s: ProgressSnapshot) => BadgeStatus;
}

/** A count badge: done once `list` (ascending times) reaches `target`, dated by the target-th entry. */
const count = (list: number[], target: number): BadgeStatus => ({
  done: list.length >= target,
  at: list[target - 1] ?? null,
  progress: { value: Math.min(list.length, target), target },
});

const streak = (s: ProgressSnapshot, days: number): BadgeStatus => ({
  done: s.streak.best >= days,
  at: s.streak.reachedAt[days] ?? null,
  progress: { value: Math.min(s.streak.best, days), target: days },
});

const once = (at: number | null): BadgeStatus => ({ done: at !== null, at });

export const BADGES: BadgeDef[] = [
  { id: 'first-solve', name: 'First Blood', description: 'Solve your first puzzle.', icon: Puzzle, tone: 'accent', check: (s) => count(s.solved.all, 1) },
  {
    id: 'own-first',
    name: 'Know Thyself',
    description: 'Solve a puzzle built from one of your own games.',
    icon: Brain,
    tone: 'blunder',
    check: (s) => count(s.solved.own, 1),
  },
  {
    id: 'lichess-first',
    name: 'Lichess Debut',
    description: 'Solve your first Lichess puzzle.',
    icon: Swords,
    tone: 'lichess',
    check: (s) => count(s.solved.lichess, 1),
  },
  {
    id: 'daily-puzzle',
    name: 'Daily Dose',
    description: 'Solve the Lichess puzzle of the day.',
    icon: CalendarCheck,
    tone: 'lichess',
    check: (s) => once(s.lichessSolved.find((p) => p.origin === 'daily')?.at ?? null),
  },
  { id: 'solved-50', name: 'Half Century', description: 'Solve 50 puzzles from either source.', icon: Target, tone: 'accent', check: (s) => count(s.solved.all, 50) },
  { id: 'solved-250', name: 'Tactics Machine', description: 'Solve 250 puzzles from either source.', icon: Zap, tone: 'inaccuracy', check: (s) => count(s.solved.all, 250) },
  {
    id: 'lichess-100',
    name: 'Centurion',
    description: 'Solve 100 Lichess puzzles.',
    icon: Medal,
    tone: 'lichess',
    check: (s) => count(s.solved.lichess, 100),
  },
  {
    id: 'clean-25',
    name: 'Clean Sheet',
    description: 'Solve 25 puzzles first try, with no hints or wrong moves.',
    icon: Crosshair,
    tone: 'best',
    check: (s) => count(s.solved.clean, 25),
  },
  {
    id: 'mastered-10',
    name: 'Lessons Learned',
    description: 'Master 10 puzzles from your own games.',
    icon: Repeat,
    tone: 'best',
    check: (s) => count(s.masteredOwn, 10),
  },
  {
    id: 'lichess-2000',
    name: 'Giant Slayer',
    description: 'Solve a Lichess puzzle rated 2000 or higher.',
    icon: Mountain,
    tone: 'mistake',
    check: (s) => once(s.lichessSolved.find((p) => p.rating >= 2000)?.at ?? null),
  },
  {
    id: 'lichess-gain-100',
    name: 'Rising Star',
    description: 'Gain 100 points over your starting Lichess puzzle rating.',
    icon: TrendingUp,
    tone: 'lichess',
    check: (s) => ({
      ...once(s.lichess.gain100At),
      ...(s.lichess.gain100At === null && s.lichess.rating !== null && s.lichess.start !== null
        ? { progress: { value: Math.max(0, Math.min(100, s.lichess.rating - s.lichess.start)), target: 100 } }
        : {}),
    }),
  },
  { id: 'streak-3', name: 'Spark', description: 'Keep a 3-day streak.', icon: Flame, tone: 'mistake', check: (s) => streak(s, 3) },
  { id: 'streak-7', name: 'Week of Fire', description: 'Keep a 7-day streak.', icon: Flame, tone: 'inaccuracy', check: (s) => streak(s, 7) },
  { id: 'streak-30', name: 'Iron Will', description: 'Keep a 30-day streak.', icon: Trophy, tone: 'inaccuracy', check: (s) => streak(s, 30) },
  {
    id: 'lesson-first',
    name: 'Book Worm',
    description: 'Complete a lesson: practise every line from memory.',
    icon: BookOpen,
    tone: 'best',
    check: (s) => count([...s.lessons.openings, ...s.lessons.traps].sort((a, b) => a - b), 1),
  },
  {
    id: 'openings-5',
    name: 'Repertoire Builder',
    description: 'Complete 5 opening lessons.',
    icon: Library,
    tone: 'accent',
    check: (s) => count(s.lessons.openings, 5),
  },
  {
    id: 'traps-all',
    name: 'Trap Master',
    description: 'Complete every trap lesson.',
    icon: Sword,
    tone: 'miss',
    check: (s) => count(s.lessons.traps, s.lessons.totalTraps),
  },
  {
    id: 'lessons-all',
    name: 'Scholar',
    description: 'Complete every lesson in Learn.',
    icon: GraduationCap,
    tone: 'brilliant',
    check: (s) => count([...s.lessons.openings, ...s.lessons.traps].sort((a, b) => a - b), s.lessons.totalOpenings + s.lessons.totalTraps),
  },
  {
    id: 'brilliant',
    name: 'Brilliant!',
    description: 'Play a brilliant move in one of your own games.',
    icon: Sparkles,
    tone: 'brilliant',
    check: (s) => once(s.firstBrilliantAt),
  },
  {
    id: 'accuracy-90',
    name: 'Sharp Eye',
    description: 'Play a game with 90% accuracy or more.',
    icon: Crown,
    tone: 'best',
    check: (s) => once(s.firstAccuracy90At),
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Solve a puzzle between midnight and 5 am.',
    icon: Moon,
    tone: 'accent',
    check: (s) => once(s.firstNightOwlAt),
  },
];

export const badgeById = new Map(BADGES.map((b) => [b.id, b]));

/** Icon tile colours per tone (token based). */
export const BADGE_TONE: Record<BadgeTone, { tile: string; glow: string }> = {
  accent: { tile: 'bg-accent-soft text-accent-strong', glow: 'var(--color-accent)' },
  best: { tile: 'bg-best/14 text-best', glow: 'var(--color-best)' },
  brilliant: { tile: 'bg-brilliant/14 text-brilliant', glow: 'var(--color-brilliant)' },
  inaccuracy: { tile: 'bg-inaccuracy/14 text-inaccuracy', glow: 'var(--color-inaccuracy)' },
  mistake: { tile: 'bg-mistake/14 text-mistake', glow: 'var(--color-mistake)' },
  miss: { tile: 'bg-miss/14 text-miss', glow: 'var(--color-miss)' },
  lichess: { tile: 'bg-lichess-soft text-lichess', glow: 'var(--color-lichess)' },
  blunder: { tile: 'bg-blunder/14 text-blunder', glow: 'var(--color-blunder)' },
};
