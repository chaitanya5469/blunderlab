import { useMemo } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { ClassGlyph, ClassMarker } from '../../components/chess/ClassMarker';
import { Card, SectionHeader } from '../../components/ui';
import { cn } from '../../lib/cn';
import { ERROR_CLASSES } from '../../lib/constants';
import { emptyCounts } from '../../lib/evaluation';
import { MOVE_CLASS_META } from '../../lib/moveClass';
import type { ClassCounts, Color, GameAnalysis, GameRecord, MoveAnalysis, MoveClass } from '../../lib/types';
import { PHASE_NAME, phaseReports, type PhaseGrade } from './phases';

/** Chess.com's review order. */
const COUNT_ORDER: MoveClass[] = ['book', 'brilliant', 'great', 'best', 'excellent', 'good', 'inaccuracy', 'mistake', 'miss', 'blunder'];

/** Chess.com's accuracy for one colour, when the game was reviewed there (and the value is usable). */
export function chesscomAccuracyOf(acc: GameRecord['chesscomAccuracy'], color: Color): number | undefined {
  const v = acc?.[color];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

interface SidesProps {
  game: GameRecord;
}

/** Column order: the owner first, then the opponent. */
function sides(game: GameRecord): [Color, Color] {
  return game.ownerColor === 'white' ? ['white', 'black'] : ['black', 'white'];
}

/** Two-column grid shared by the count and phase tables: label, you, opponent. */
const ROW = 'grid grid-cols-[minmax(0,1fr)_4.75rem_4.75rem] items-center gap-x-1';

function TableHead({ game }: SidesProps) {
  const [, opp] = sides(game);
  return (
    <div className={cn(ROW, 'mb-1 border-b border-line-soft pb-2 text-2xs font-semibold tracking-[0.08em] text-fg-subtle uppercase')}>
      <span />
      <span className="text-center text-accent-strong">You</span>
      <span className="truncate text-center normal-case tracking-normal" title={game[opp].username}>
        {game[opp].username}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------- Score card */

/** Both players side by side: name, rating, accuracy and game rating, the owner's column lit. */
export function ScoreCard({ game, analysis }: SidesProps & { analysis: GameAnalysis }) {
  return (
    <Card padded={false} className="grid grid-cols-2 gap-px overflow-hidden">
      {sides(game).map((c) => {
        const own = c === game.ownerColor;
        const p = game[c];
        const acc = analysis[c].accuracy;
        const gr = analysis[c].gameRating;
        const cc = chesscomAccuracyOf(game.chesscomAccuracy, c);
        return (
          <div key={c} className={cn('flex min-w-0 flex-col items-center px-3 pt-3 pb-3.5 text-center', own && 'bg-accent-soft/60')}>
            <p className="flex max-w-full items-center gap-1.5">
              <span className={cn('size-3 shrink-0 rounded-[3px] ring-1 ring-line', c === 'white' ? 'bg-eval-white' : 'bg-eval-black')} />
              <span className={cn('truncate text-sm font-semibold', own ? 'text-fg' : 'text-fg-muted')}>{p.username}</span>
            </p>
            <p className="mt-0.5 text-xs text-fg-subtle tnum">
              {p.rating}
              {own && <span className="ml-1.5 rounded-chip bg-accent-soft px-1.5 py-px text-2xs font-semibold text-accent-strong">You</span>}
            </p>
            <p className="mt-3 font-display text-[2rem] leading-none font-semibold tracking-[-0.03em] tnum">
              {acc.toFixed(1)}
              <span className="text-sm font-medium text-fg-subtle">%</span>
            </p>
            <p className="mt-1 text-2xs font-semibold tracking-[0.08em] text-fg-muted uppercase">Accuracy</p>
            {cc !== undefined && (
              <p className="text-2xs text-fg-subtle tnum" title="Accuracy reported by Chess.com's own review">
                Chess.com {Math.round(cc)}%
              </p>
            )}
            {typeof gr === 'number' && <GameRating value={gr} rating={p.rating} />}
          </div>
        );
      })}
    </Card>
  );
}

function GameRating({ value, rating }: { value: number; rating: number }) {
  const diff = Math.round(value - rating);
  const Trend = diff > 0 ? TrendingUp : TrendingDown;
  return (
    <div
      title="Estimated rating of the moves played in this game"
      className={cn(
        'mt-3 flex flex-col items-center rounded-[12px] px-3 py-1.5 edge-current',
        diff === 0 ? 'bg-surface-2 text-fg-muted' : diff > 0 ? 'bg-best/12 text-best' : 'bg-mistake/12 text-mistake',
      )}
    >
      <span className="flex items-baseline gap-1.5">
        <span className="font-display text-[1.375rem] leading-none font-semibold tracking-[-0.03em] tnum">{value}</span>
        {diff !== 0 && (
          <span className="flex items-center gap-0.5 text-xs font-semibold tnum">
            <Trend className="size-3.5 self-center" aria-hidden />
            {Math.abs(diff)}
          </span>
        )}
      </span>
      <span className="mt-0.5 text-2xs font-semibold tracking-[0.08em] text-fg-muted uppercase">Game rating</span>
    </div>
  );
}

/* ------------------------------------------------------------ Move counts */

/** Every move class with both players' counts (from the move rows, so they match the board). */
export function MoveCounts({ game, moves }: SidesProps & { moves: MoveAnalysis[] }) {
  const counts = useMemo(() => {
    const r: Record<Color, ClassCounts> = { white: emptyCounts(), black: emptyCounts() };
    for (const m of moves) r[m.color][m.classification]++;
    return r;
  }, [moves]);
  const cols = sides(game);
  return (
    <section>
      <SectionHeader title="Moves" />
      <Card className="py-3">
        <TableHead game={game} />
        {COUNT_ORDER.map((cls) => (
          <div key={cls} className={cn(ROW, 'h-9')}>
            <span className="flex min-w-0 items-center gap-2.5">
              <ClassMarker cls={cls} className="size-5.5 text-[0.7rem]" />
              <span className={cn('truncate text-sm font-medium', MOVE_CLASS_META[cls].textClass)}>{MOVE_CLASS_META[cls].label}</span>
            </span>
            {cols.map((c) => (
              <span
                key={c}
                className={cn('text-center font-display text-lg leading-none font-semibold tnum', counts[c][cls] ? MOVE_CLASS_META[cls].textClass : 'text-fg-subtle/60')}
              >
                {counts[c][cls]}
              </span>
            ))}
          </div>
        ))}
      </Card>
    </section>
  );
}

/* ---------------------------------------------------------- Phase ratings */

function Grade({ grade }: { grade: PhaseGrade | null }) {
  if (!grade) return <span className="text-center text-sm text-fg-subtle">–</span>;
  const meta = MOVE_CLASS_META[grade.cls];
  return (
    <span className="flex flex-col items-center gap-1" title={`${meta.label} · ${grade.accuracy.toFixed(0)}% over ${grade.moves} moves`}>
      <span className={cn('grid size-8 place-items-center rounded-full text-[0.8rem] leading-none font-bold tracking-[-0.04em] text-canvas', meta.bgClass)}>
        <ClassGlyph cls={grade.cls} iconClassName="size-4" />
      </span>
      <span className={cn('text-2xs font-semibold', meta.textClass)}>{meta.label}</span>
    </span>
  );
}

/** Opening / middlegame / endgame grades for both players (only the phases the game reached). */
export function PhaseRatings({ game, moves }: SidesProps & { moves: MoveAnalysis[] }) {
  const reports = useMemo(() => phaseReports(moves), [moves]);
  const cols = sides(game);
  if (reports.length === 0) return null;
  return (
    <section>
      <SectionHeader title="Phases" />
      <Card className="py-3">
        <TableHead game={game} />
        {reports.map((r) => (
          <div key={r.phase} className={cn(ROW, 'min-h-16 py-1.5')}>
            <span className="text-sm font-medium">{PHASE_NAME[r.phase]}</span>
            {cols.map((c) => (
              <Grade key={c} grade={r[c]} />
            ))}
          </div>
        ))}
      </Card>
    </section>
  );
}

/* ------------------------------------------------------------ Key moments */

/** The owner's brilliant and great moves and errors; tapping one opens the board there. */
export function KeyMoments({ moves, onOpen }: { moves: MoveAnalysis[]; onOpen: (ply: number) => void }) {
  const moments = moves.filter(
    (m) => m.actor === 'owner' && (m.classification === 'brilliant' || m.classification === 'great' || ERROR_CLASSES.includes(m.classification)),
  );
  if (moments.length === 0) return null;
  return (
    <section>
      <SectionHeader title="Key moments" meta="tap to open" />
      <div className="flex flex-wrap gap-1.5">
        {moments.map((m) => (
          <button
            key={m.ply}
            type="button"
            onClick={() => onOpen(m.ply)}
            className="inline-flex h-11 items-center gap-1.5 rounded-control border border-line-soft bg-surface-2 px-3 text-sm font-medium text-fg-muted transition-colors hover:text-fg"
          >
            <ClassMarker cls={m.classification} />
            <span className="tnum">
              {m.moveNumber}
              {m.color === 'white' ? '.' : '…'} {m.san}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
