import { Navigate, useNavigate, useParams } from 'react-router';
import { Play } from 'lucide-react';
import { Page } from '../../../components/layout/Page';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Badge, Button, Card, Progress, SectionHeader } from '../../../components/ui';
import { MiniBoard } from '../board/MiniBoard';
import { getLesson, isOpening, isTrap, sideName } from '../lib/catalog';
import { playPath } from '../lib/paths';
import { lessonStatus, lineProgress, lineStatus, useNow, useProgress, type LearnProgress, type Mode } from '../lib/progress';
import { usePersonalStats } from '../lib/personal';
import { formatIn } from '../lib/time';
import type { Lesson } from '../types';
import { LineRow } from './LineRow';
import { OpeningOverview } from './OpeningOverview';
import { PersonalNote } from './PersonalNote';
import { TrapOverview } from './TrapOverview';

/** `#/learn/:lessonId`: what the lesson teaches, your progress, and its lines. */
export function LessonPage() {
  const lesson = getLesson(useParams().lessonId);
  const progress = useProgress();
  const now = useNow();
  const stats = usePersonalStats();
  const navigate = useNavigate();
  if (!lesson) return <Navigate to="/learn" replace />;

  const s = lesson.source;
  const status = lessonStatus(lesson, progress, now);
  const cta = nextStep(lesson, progress, now);

  return (
    <Page className="space-y-5">
      <PageHeader
        backTo="/learn"
        title={s.name}
        subtitle={s.kind === 'opening' ? `Opening for ${sideName(s.side)} · ${s.eco}` : `Trap set by ${sideName(s.side)} · ${s.opening}`}
      />

      <Card className="relative overflow-hidden">
        <div className="absolute -top-20 -right-16 size-52 rounded-full bg-accent/10 blur-2xl" aria-hidden />
        <div className="relative flex gap-4">
          <MiniBoard fen={lesson.thumbFen} orientation={s.side} className="w-28 shrink-0 self-start" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-1.5">
              <Badge tone={s.side === 'white' ? 'neutral' : 'accent'}>{s.kind === 'opening' ? `As ${sideName(s.side)}` : `${sideName(s.side)} sets it`}</Badge>
              {s.kind === 'trap' && <Badge tone={s.sound ? 'best' : 'inaccuracy'}>{s.sound ? 'Sound' : 'Dubious'}</Badge>}
              {status.due > 0 && <Badge tone="mistake">{status.due} due</Badge>}
            </div>
            <p className="mt-2 text-sm text-fg-muted">{s.tagline}</p>
          </div>
        </div>
        <div className="relative mt-4">
          <div className="mb-1.5 flex items-baseline justify-between text-xs">
            <span className="font-medium text-fg-muted">{status.completed ? 'Completed' : 'Practised from memory'}</span>
            <span className="text-fg-subtle tnum">
              {status.done}/{status.total} lines
              {status.due === 0 && status.nextDueAt !== null && ` · review ${formatIn(status.nextDueAt, now)}`}
            </span>
          </div>
          <Progress value={status.done / status.total} barClassName={status.completed ? 'bg-best' : undefined} label="Lines practised" />
          <Button variant="primary" size="lg" className="mt-4 w-full" icon={<Play className="size-4.5 fill-current" />} onClick={() => navigate(playPath(s.id, cta.key, cta.mode))}>
            {cta.label}
          </Button>
        </div>
      </Card>

      {stats && <PersonalNote lesson={lesson} stats={stats} />}

      {isOpening(lesson) && <OpeningOverview source={lesson.source} />}
      {isTrap(lesson) && <TrapOverview lesson={lesson} />}

      <section>
        <SectionHeader title={s.kind === 'opening' ? 'Key lines' : 'Lines'} />
        <Card padded={false} className="divide-y divide-line-soft">
          {lesson.playables.map((p, i) => (
            <LineRow
              key={p.key}
              n={i + 1}
              playable={p}
              status={lineStatus(lineProgress(progress, s.id, p.key), now)}
              learnTo={playPath(s.id, p.key, 'learn')}
              practiseTo={playPath(s.id, p.key, 'practice')}
            />
          ))}
        </Card>
      </section>
    </Page>
  );
}

/** The most useful next run: a due review, then the first new line, then lines not yet clean. */
function nextStep(lesson: Lesson, progress: LearnProgress, now: number): { key: string; mode: Mode; label: string } {
  const id = lesson.source.id;
  const lines = lesson.playables.map((p) => ({ p, lp: lineProgress(progress, id, p.key) }));
  const due = lines.find(({ lp }) => lineStatus(lp, now) === 'due');
  if (due) return { key: due.p.key, mode: 'practice', label: 'Review due line' };
  const fresh = lines.find(({ lp }) => !lp);
  if (fresh) return { key: fresh.p.key, mode: 'learn', label: fresh === lines[0] ? 'Start lesson' : 'Continue lesson' };
  const unclean = lines.find(({ lp }) => !lp?.cleanAt);
  if (unclean) return { key: unclean.p.key, mode: 'practice', label: 'Practise next line' };
  return { key: lines[0]!.p.key, mode: 'practice', label: 'Practise again' };
}

