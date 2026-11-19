import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { Badge } from '../../../components/ui';
import { cn } from '../../../lib/cn';
import { MiniBoard } from '../board/MiniBoard';
import { sideName } from '../lib/catalog';
import { lessonPath } from '../lib/paths';
import type { LessonStatus } from '../lib/progress';
import type { Lesson } from '../types';

interface LessonRowProps {
  lesson: Lesson;
  status: LessonStatus;
  /** Replaces the tagline, e.g. a personal reason. */
  note?: ReactNode;
  noteTone?: 'bad' | 'info';
}

/** Compact lesson entry with a board thumbnail, used for traps, reviews and search results. */
export function LessonRow({ lesson, status, note, noteTone }: LessonRowProps) {
  const s = lesson.source;
  return (
    <Link
      to={lessonPath(s.id)}
      className="flex min-h-18 items-center gap-3 rounded-control px-2 py-2.5 transition-colors hover:bg-surface-2 active:bg-surface-2"
    >
      <MiniBoard fen={lesson.thumbFen} orientation={s.side} className="w-14 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 leading-snug font-medium">{s.name}</p>
        <p className={cn('mt-0.5 line-clamp-2 text-xs', noteTone === 'bad' ? 'font-medium text-blunder' : note ? 'font-medium text-accent-strong' : 'text-fg-subtle')}>
          {note ?? (s.kind === 'trap' ? `${sideName(s.side)} sets it · ${s.opening}` : s.tagline)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <StatusBadge status={status} unsound={s.kind === 'trap' && !s.sound} />
        <ChevronRight className="size-4 text-fg-subtle" aria-hidden />
      </div>
    </Link>
  );
}

export function StatusBadge({ status, unsound }: { status: LessonStatus; unsound?: boolean }) {
  if (status.due) return <Badge tone="mistake">Due</Badge>;
  if (status.completed) return <Badge tone="best">Done</Badge>;
  if (status.started) return <Badge tone="accent">{`${status.done}/${status.total}`}</Badge>;
  if (unsound) return <Badge tone="inaccuracy">Dubious</Badge>;
  return null;
}
