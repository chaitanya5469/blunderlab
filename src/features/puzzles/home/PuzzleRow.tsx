import { Link } from 'react-router';
import { ClassMarker } from '../../../components/chess/ClassMarker';
import { Badge, toneClasses } from '../../../components/ui';
import { cn } from '../../../lib/cn';
import { capitalize, formatRelativeDate } from '../../../lib/format';
import type { Puzzle } from '../../../lib/types';
import { motifLabel, movePrefix, puzzleState } from '../model/labels';

/** One puzzle in the recent list: what was played, where, and its review state. */
export function PuzzleRow({ puzzle, now }: { puzzle: Puzzle; now: number }) {
  // The theme is a spoiler until the puzzle has been tried once.
  const motif = puzzle.attempts > 0 ? puzzle.motifs[0] : undefined;
  return (
    <Link
      to={`/puzzles/p/${encodeURIComponent(puzzle.id)}`}
      className="flex min-h-16 flex-wrap items-center gap-x-3 gap-y-1.5 rounded-control px-2 py-2.5 transition-colors hover:bg-surface-2 active:bg-surface-2"
    >
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-control', toneClasses[puzzle.source])}>
        <ClassMarker cls={puzzle.source} className="size-5 text-[0.65rem]" />
      </span>
      {/* Keeps room for the move; with large system text the status badge wraps to its own line. */}
      <div className="min-w-[min(7em,100%)] flex-1">
        <p className="truncate font-medium">
          <span className="tnum">{movePrefix(puzzle.moveNumber, puzzle.ownerColor)}</span>
          {puzzle.played.san}
          <span className="font-normal text-fg-subtle"> vs {puzzle.opponent.username}</span>
        </p>
        <p className="mt-0.5 truncate text-xs text-fg-subtle">
          {capitalize(puzzle.timeClass)} · {formatRelativeDate(puzzle.gameEndTime, now)}
          {motif ? ` · ${motifLabel(motif, puzzle)}` : ''}
        </p>
      </div>
      <Status puzzle={puzzle} now={now} />
    </Link>
  );
}

/** Plain-language state: New, Due now, Review tomorrow, Review in 3 days, Mastered. */
function Status({ puzzle, now }: { puzzle: Puzzle; now: number }) {
  const { label, tone } = puzzleState(puzzle, now);
  return (
    <Badge tone={tone} className="ml-auto shrink-0">
      {label}
    </Badge>
  );
}
