import { Link } from 'react-router';
import { cn } from '../../../lib/cn';
import { pluralize } from '../../../lib/format';
import { MiniBoard } from '../board/MiniBoard';
import { lessonPath } from '../lib/paths';
import type { LessonStatus } from '../lib/progress';
import type { OpeningLesson } from '../lib/catalog';
import { StatusBadge } from './LessonRow';

/** Opening card for the two-column grid: the key position, name and line progress. */
export function OpeningTile({ lesson, status, games }: { lesson: OpeningLesson; status: LessonStatus; games?: number }) {
  const s = lesson.source;
  return (
    <Link
      to={lessonPath(s.id)}
      className="group flex min-w-0 flex-col rounded-card border border-line-soft bg-surface-1 p-2.5 transition-colors hover:border-line active:bg-surface-2"
    >
      <div className="relative">
        <MiniBoard fen={lesson.thumbFen} orientation={s.side} className="w-full" />
        <span className="absolute top-1.5 right-1.5">
          <StatusBadge status={status} />
        </span>
      </div>
      <p className="mt-2.5 line-clamp-2 px-0.5 font-display text-[0.95rem] leading-snug font-semibold">{s.name}</p>
      <p className="mt-0.5 px-0.5 text-2xs text-fg-subtle tnum">
        {s.eco}
        {games ? ` · ${pluralize(games, 'game')} of yours` : ` · ${pluralize(s.lines.length, 'line')}`}
      </p>
      <div className="mt-auto flex gap-0.5 px-0.5 pt-2.5" aria-hidden>
        {Array.from({ length: status.total }, (_, i) => (
          <span key={i} className={cn('h-1 flex-1 rounded-full', i < status.done ? 'bg-best' : 'bg-surface-3')} />
        ))}
      </div>
    </Link>
  );
}
