import { useNavigate } from 'react-router';
import { GraduationCap, Play } from 'lucide-react';
import { Button, Card, Progress } from '../../../components/ui';
import { MiniBoard } from '../board/MiniBoard';
import { getLesson, getPlayable, playableTitle } from '../lib/catalog';
import { playPath } from '../lib/paths';
import { lessonStatus, type LearnProgress } from '../lib/progress';
import type { Recommendation } from '../lib/insights';

interface ContinueCardProps {
  progress: LearnProgress;
  now: number;
  /** Shown on first run, when there is nothing to continue. */
  first: Recommendation | undefined;
}

/** The hero: resume the last line, or a welcome with the first recommended lesson. */
export function ContinueCard({ progress, now, first }: ContinueCardProps) {
  const navigate = useNavigate();
  const recent = progress.recent;
  const lesson = getLesson(recent?.lessonId);
  const playable = lesson && getPlayable(lesson, recent?.key);

  if (!lesson || !playable || !recent) {
    return (
      <Card className="relative overflow-hidden border-accent/20 bg-gradient-to-br from-accent/12 to-surface-1">
        <div className="absolute -top-20 -right-16 size-52 rounded-full bg-accent/10 blur-2xl" aria-hidden />
        <div className="relative">
          <span className="grid size-11 place-items-center rounded-control bg-accent-soft text-accent-strong">
            <GraduationCap className="size-5.5" aria-hidden />
          </span>
          <h2 className="mt-3 text-2xl font-semibold">Learn by playing the moves</h2>
          <p className="mt-1 text-sm text-fg-muted">
            Each lesson walks you through a line move by move and explains why. Then you play it from memory, and it comes back for review
            just before you would forget it.
          </p>
          {first && (
            <Button
              variant="primary"
              size="lg"
              className="mt-4 w-full"
              icon={<Play className="size-4.5 fill-current" />}
              onClick={() => navigate(playPath(first.lesson.source.id, first.lesson.playables[0]!.key, 'learn'))}
            >
              Start with {first.lesson.source.name}
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const status = lessonStatus(lesson, progress, now);
  return (
    <Card className="relative overflow-hidden border-accent/20 bg-gradient-to-br from-accent/12 to-surface-1">
      <div className="absolute -top-20 -right-16 size-52 rounded-full bg-accent/10 blur-2xl" aria-hidden />
      <div className="relative flex gap-4">
        <MiniBoard fen={lesson.thumbFen} orientation={lesson.source.side} className="w-24 shrink-0 self-start" />
        <div className="min-w-0 flex-1">
          <p className="text-2xs font-semibold tracking-[0.12em] text-fg-subtle uppercase">Continue</p>
          <h2 className="mt-1 line-clamp-2 text-xl leading-tight font-semibold">{lesson.source.name}</h2>
          <p className="mt-0.5 line-clamp-2 text-sm text-fg-muted">{playableTitle(playable)}</p>
          <div className="mt-2.5 flex items-center gap-2">
            <Progress value={status.done / status.total} className="flex-1" label="Lesson progress" />
            <span className="text-xs text-fg-subtle tnum">
              {status.done}/{status.total}
            </span>
          </div>
        </div>
      </div>
      <Button
        variant="primary"
        size="lg"
        className="relative mt-4 w-full"
        icon={<Play className="size-4.5 fill-current" />}
        onClick={() => navigate(playPath(lesson.source.id, playable.key, recent.mode))}
      >
        {recent.mode === 'practice' ? 'Keep practising' : 'Keep learning'}
      </Button>
    </Card>
  );
}
