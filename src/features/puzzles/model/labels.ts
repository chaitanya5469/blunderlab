import type { BadgeTone } from '../../../components/ui/Badge';
import { formatScore } from '../../../lib/evaluation';
import { pluralize } from '../../../lib/format';
import { isDue, isMastered, isNew } from './schedule';
import type { Color, GamePhase, Puzzle, PuzzleMotif, PuzzleSource, Score } from '../../../lib/types';

export const SOURCE_LABEL: Record<PuzzleSource, string> = { blunder: 'Blunders', mistake: 'Mistakes', miss: 'Misses' };

export const PHASE_LABEL: Record<GamePhase, string> = { opening: 'Opening', middlegame: 'Middlegame', endgame: 'Endgame' };

export const MOTIF_LABEL: Record<PuzzleMotif, string> = {
  mate: 'Mate',
  winsMaterial: 'Wins material',
  hangingPiece: 'Hanging piece',
  missedCapture: 'Missed capture',
};

/** "Mate in 2" for mate puzzles, otherwise the plain motif label. */
export const motifLabel = (m: PuzzleMotif, p: Pick<Puzzle, 'mateIn'>) => (m === 'mate' && p.mateIn ? `Mate in ${p.mateIn}` : MOTIF_LABEL[m]);

/** "18." for White, "18…" for Black. */
export const movePrefix = (moveNumber: number, color: Color) => `${moveNumber}${color === 'white' ? '.' : '…'}`;

/** "12 Mar", with the year when it is not this year. */
export function shortDate(ms: number, now = Date.now()): string {
  const d = new Date(ms);
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
}

/** Score label from `color`'s point of view ("+2.4" means `color` is better). */
export function formatScoreFor(score: Score, color: Color): string {
  if (color === 'white' || score.kind === 'checkmate') return formatScore(score);
  return formatScore({ ...score, value: -score.value });
}

/** Numbers a SAN line whose first move is `color`'s move `moveNumber`: "18…Nf5 19.exf5 Qxe2". */
export function numberLine(sans: string[], moveNumber: number, color: Color): string {
  let move = moveNumber;
  let white = color === 'white';
  return sans
    .map((san, i) => {
      const label = white ? `${move}.${san}` : i === 0 ? `${move}…${san}` : san;
      if (!white) move++;
      white = !white;
      return label;
    })
    .join(' ');
}

/** Time until a future moment: "in 10 min", "in 3 h", "tomorrow", "in 5 days". */
export function formatIn(at: number, now = Date.now()): string {
  const min = Math.max(1, Math.round((at - now) / 60_000));
  if (min < 60) return `in ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `in ${h} h`;
  const days = Math.round(h / 24);
  return days === 1 ? 'tomorrow' : `in ${days} days`;
}

/** When a future moment is, in words: "in 10 minutes", "in 8 hours", "tomorrow", "in 3 days". */
export function whenPhrase(at: number, now = Date.now(), short = false): string {
  const min = Math.max(1, Math.round((at - now) / 60_000));
  if (min < 60) return short ? `in ${min} min` : `in ${pluralize(min, 'minute')}`;
  const h = Math.round(min / 60);
  if (h < 24) return short ? `in ${h} h` : `in ${pluralize(h, 'hour')}`;
  const days = Math.round(h / 24);
  return days === 1 ? 'tomorrow' : `in ${days} days`;
}

/** What happens next after an attempt: "Comes back in 3 days". */
export const comesBack = (dueAt: number, now = Date.now()) => `Comes back ${whenPhrase(dueAt, now)}`;

/** A puzzle's state in plain words, with the badge tone to show it in. */
export function puzzleState(p: Puzzle, now: number): { label: string; tone: BadgeTone } {
  if (isNew(p)) return { label: 'New', tone: 'accent' };
  if (isDue(p, now)) return { label: 'Due now', tone: 'mistake' };
  if (isMastered(p)) return { label: 'Mastered', tone: 'best' };
  return { label: `Review ${whenPhrase(p.dueAt, now, true)}`, tone: 'neutral' };
}
