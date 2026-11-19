import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/cn';
import type { Color, PlayerInfo } from '../../lib/types';

interface PlayerStripProps {
  player: PlayerInfo;
  color: Color;
  isOwner: boolean;
  accuracy?: number;
  /** Chess.com's own accuracy for this player, when the game was reviewed there. */
  chesscomAccuracy?: number;
  /** This game's performance estimate (lib/gameRating.ts); null/undefined hides it. */
  gameRating?: number | null;
  /** One slim row (board screen): accuracy as a small chip, no game rating. */
  compact?: boolean;
}

/** The game rating as a headline number, tinted up/down against the player's rating, with the gap. */
function GameRatingBlock({ value, rating }: { value: number; rating: number }) {
  const diff = value - rating;
  const up = diff > 0;
  const flat = diff === 0;
  const Trend = up ? TrendingUp : TrendingDown;
  return (
    <div
      title="Estimated rating of the moves played in this game"
      className={cn(
        'flex shrink-0 flex-col items-end rounded-[12px] px-2.5 py-1 edge-current',
        flat ? 'bg-surface-2 text-fg-muted' : up ? 'bg-best/12 text-best' : 'bg-mistake/12 text-mistake',
      )}
    >
      <span className="flex items-baseline gap-1.5">
        {!flat && (
          <span className="flex items-center gap-0.5 text-xs font-semibold tnum">
            <Trend className="size-3.5 self-center" aria-hidden />
            {Math.abs(Math.round(diff))}
          </span>
        )}
        <span className="font-display text-[1.375rem] leading-none font-semibold tracking-[-0.03em] tnum">{value}</span>
      </span>
      <span className="mt-0.5 text-2xs font-semibold tracking-[0.08em] text-fg-muted uppercase">Game rating</span>
    </div>
  );
}

/** Name and rating, with accuracy and the game rating shown prominently, above/below the board. */
export function PlayerStrip({ player, color, isOwner, accuracy, chesscomAccuracy, gameRating, compact }: PlayerStripProps) {
  if (compact) {
    return (
      <div className="flex h-8 items-center gap-2 px-0.5">
        <span className={cn('size-3 shrink-0 rounded-[3px] ring-1 ring-line', color === 'white' ? 'bg-eval-white' : 'bg-eval-black')} />
        <p className={cn('min-w-0 truncate text-sm font-semibold', isOwner ? 'text-fg' : 'text-fg-muted')}>{player.username}</p>
        <span className="shrink-0 text-xs text-fg-subtle tnum">{player.rating}</span>
        {accuracy !== undefined && (
          <span className="ml-auto shrink-0 rounded-chip bg-surface-2 px-2 py-0.5 text-xs font-semibold tnum" title="Accuracy">
            {accuracy.toFixed(1)}%
          </span>
        )}
      </div>
    );
  }
  return (
    <div className="flex min-h-9 items-center gap-2 px-0.5 py-1">
      <span className={cn('size-3 shrink-0 self-start mt-1 rounded-[3px] ring-1 ring-line', color === 'white' ? 'bg-eval-white' : 'bg-eval-black')} />
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm leading-tight font-semibold', isOwner ? 'text-fg' : 'text-fg-muted')}>{player.username}</p>
        <p className="mt-0.5 flex items-center gap-1.5">
          <span className="text-xs text-fg-subtle tnum">{player.rating}</span>
          {isOwner && <span className="rounded-chip bg-accent-soft px-1.5 py-px text-2xs font-semibold text-accent-strong">You</span>}
        </p>
      </div>
      {accuracy !== undefined && (
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="flex flex-col items-end leading-tight">
            <span className="font-display text-lg leading-none font-semibold tnum">
              {accuracy.toFixed(1)}
              <span className="text-xs font-medium text-fg-subtle">%</span>
            </span>
            <span className="mt-1 text-2xs text-fg-subtle">Accuracy</span>
            {chesscomAccuracy !== undefined && (
              <span className="text-2xs text-fg-subtle tnum" title="Accuracy reported by Chess.com's own review">
                Chess.com {Math.round(chesscomAccuracy)}%
              </span>
            )}
          </div>
          {typeof gameRating === 'number' && <GameRatingBlock value={gameRating} rating={player.rating} />}
        </div>
      )}
    </div>
  );
}
