import { memo, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { Clock3, LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/cn';
import { capitalize, formatRelativeDate, formatTimeControl, pluralize, splitOpening } from '../../lib/format';
import type { GameAnalysis, GameRecord, GameResult } from '../../lib/types';
import { Skeleton } from '../../components/ui';
import { accuracyTone, formatDiff, opponentOf, RESULT_LABEL, TIME_CLASS_ICON } from './gameMeta';
import { PendingSparkline, WinSparkline } from './WinSparkline';

interface GameRowProps {
  game: GameRecord;
  analysis?: GameAnalysis;
  analysing?: boolean;
  /** Overrides the default relative date (the Games list shows times inside date groups). */
  dateLabel?: string;
  /** Mount animation delay in ms; omit for no entrance animation. */
  settleDelay?: number;
  className?: string;
}

/**
 * The result as a shape, not only a colour: a solid tile for a win, an outlined tile for
 * a loss, a dashed tile with ½ for a draw. The dot in the corner is the colour you played.
 */
export function ResultMark({ result, ownerColor, className }: { result: GameResult; ownerColor: GameRecord['ownerColor']; className?: string }) {
  return (
    <span className={cn('relative grid size-11 shrink-0 place-items-center', className)}>
      <span
        className={cn(
          'grid size-full place-items-center rounded-[13px] font-display text-[1.05rem] leading-none font-bold',
          result === 'win' &&
            'bg-win text-ink bg-[linear-gradient(180deg,rgb(255_255_255/0.14),rgb(7_8_11/0.18))] shadow-[inset_0_1px_0_rgb(255_255_255/0.28),0_6px_14px_-8px_rgb(60_200_147/0.55)]',
          result === 'loss' && 'border-[1.5px] border-loss/60 bg-loss/10 text-loss',
          result === 'draw' && 'border-[1.5px] border-dashed border-draw/50 bg-draw/[0.06] text-draw',
        )}
      >
        {result === 'win' ? 'W' : result === 'loss' ? 'L' : '½'}
      </span>
      <span
        className={cn(
          'absolute -right-1 -bottom-1 size-3.5 rounded-full border-2 border-surface-1',
          ownerColor === 'white' ? 'bg-eval-white' : 'bg-eval-black ring-1 ring-line-strong ring-inset',
        )}
        aria-hidden
      />
      <span className="sr-only">
        {RESULT_LABEL[result]} as {ownerColor}
      </span>
    </span>
  );
}

/** One game: result mark, opponent and rating gap, opening, time control, and how it went. */
export const GameRow = memo(function GameRow({ game, analysis, analysing, dateLabel, settleDelay, className }: GameRowProps) {
  const opp = opponentOf(game);
  const me = game[game.ownerColor];
  const TcIcon = TIME_CLASS_ICON[game.timeClass] ?? Clock3;
  const [family, variation] = game.openingName ? splitOpening(game.openingName) : [undefined, undefined];
  const style: CSSProperties | undefined = settleDelay !== undefined ? { animationDelay: `${settleDelay}ms` } : undefined;

  return (
    <Link
      to={`/games/${encodeURIComponent(game.uuid)}`}
      style={style}
      className={cn(
        'grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-3.5 py-3 press-row',
        settleDelay !== undefined && 'animate-settle',
        className,
      )}
    >
      <ResultMark result={game.result} ownerColor={game.ownerColor} className="row-span-3" />

      {/*
        When the cell is narrow for its text size (large system text on a small phone), the rating
        wraps below the name instead of squeezing the name down to a letter or two.
      */}
      <div className="@container min-w-0">
        <div className="flex min-w-0 items-baseline gap-x-1.5 @max-[8em]:flex-wrap">
          <span className="max-w-full truncate text-[0.9375rem] font-semibold">{opp.username}</span>
          <span className="flex shrink-0 items-baseline gap-1.5">
            <span className="text-sm font-medium text-fg-muted tnum">{opp.rating}</span>
            <span className="text-2xs font-medium text-fg-subtle tnum" title={`Your rating ${me.rating}`}>
              {formatDiff(opp.rating - me.rating)}
            </span>
          </span>
        </div>
      </div>
      <div className="flex justify-end">
        {analysis ? (
          <WinSparkline curve={analysis.winCurve} ownerColor={game.ownerColor} />
        ) : (
          <PendingSparkline active={analysing} />
        )}
      </div>

      <p className="col-span-2 col-start-2 truncate text-[0.8125rem] leading-snug">
        {family ? (
          <>
            <span className="text-fg-muted">{family}</span>
            {variation && <span className="text-fg-subtle"> · {variation}</span>}
          </>
        ) : (
          <span className="text-fg-subtle">Opening not recorded</span>
        )}
      </p>

      <p className="flex min-w-0 items-center gap-1.5 text-2xs text-fg-subtle">
        <TcIcon className="size-3 shrink-0" aria-hidden />
        <span className="truncate">
          {capitalize(game.timeClass)} {formatTimeControl(game.timeControl)}
          <span aria-hidden> · </span>
          {dateLabel ?? formatRelativeDate(game.endTime)}
        </span>
      </p>
      <QualityCell analysis={analysis} analysing={analysing} status={game.analysisStatus} />
    </Link>
  );
});

interface QualityCellProps {
  analysis?: GameAnalysis;
  analysing?: boolean;
  status: GameRecord['analysisStatus'];
}

/** Accuracy and the costly errors when analysed, otherwise a calm queue state. */
function QualityCell({ analysis, analysing, status }: QualityCellProps) {
  if (analysis) {
    const { blunder, mistake } = analysis.ownerCounts;
    return (
      <span className="flex items-center justify-end gap-1.5">
        {blunder > 0 && (
          <span className="rounded-[6px] bg-blunder/14 px-1.5 py-px text-2xs font-semibold text-blunder tnum edge-current" title={pluralize(blunder, 'blunder')}>
            {blunder}??
          </span>
        )}
        {mistake > 0 && (
          <span className="rounded-[6px] bg-mistake/14 px-1.5 py-px text-2xs font-semibold text-mistake tnum edge-current" title={pluralize(mistake, 'mistake')}>
            {mistake}?
          </span>
        )}
        <span className={cn('font-display text-[0.9375rem] leading-none font-semibold tnum', accuracyTone(analysis.ownerAccuracy))}>
          {analysis.ownerAccuracy.toFixed(0)}
          <span className="text-2xs font-medium text-fg-subtle">%</span>
        </span>
      </span>
    );
  }
  if (analysing) {
    return (
      <span className="flex items-center justify-end gap-1 text-2xs font-medium text-accent-strong">
        <LoaderCircle className="size-3 animate-spin" aria-hidden />
        Analysing
      </span>
    );
  }
  if (status === 'failed') return <span className="text-right text-2xs text-mistake">Unreadable</span>;
  return <span className="text-right text-2xs text-fg-subtle">Queued</span>;
}

export function GameRowSkeleton() {
  return (
    <div className="grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3.5 py-3.5" aria-hidden>
      <Skeleton className="row-span-3 size-11 rounded-[13px]" />
      <Skeleton className="h-3.5 w-1/2" />
      <Skeleton className="h-5 w-16" />
      <Skeleton className="col-span-2 h-3 w-4/5" />
      <Skeleton className="h-2.5 w-2/5" />
      <Skeleton className="h-3 w-10 justify-self-end" />
    </div>
  );
}
