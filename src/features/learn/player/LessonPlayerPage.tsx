import { motion } from 'motion/react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { Lightbulb, RotateCcw } from 'lucide-react';
import { Page } from '../../../components/layout/Page';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button, Tabs } from '../../../components/ui';
import { cn } from '../../../lib/cn';
import type { Lesson, Playable } from '../types';
import { LessonBoard } from '../board/LessonBoard';
import { getLesson, getPlayable, playableTitle } from '../lib/catalog';
import { lineProgress, useProgress, type Mode } from '../lib/progress';
import { lessonPath, playPath } from '../lib/paths';
import { CoachPanel } from './CoachPanel';
import { RunSummary } from './RunSummary';
import { StepProgress } from './StepProgress';
import { useLessonPlayer } from './useLessonPlayer';

const MODES = [
  { value: 'learn', label: 'Learn' },
  { value: 'practice', label: 'Practice' },
] as const;

/** `#/learn/:lessonId/play/:key?mode=learn|practice` */
export function LessonPlayerPage() {
  const { lessonId, key } = useParams();
  const [search] = useSearchParams();
  const lesson = getLesson(lessonId);
  const playable = lesson && getPlayable(lesson, key);
  if (!lesson || !playable) return <Navigate to={lesson ? lessonPath(lesson.source.id) : '/learn'} replace />;
  const mode: Mode = search.get('mode') === 'practice' ? 'practice' : 'learn';
  return <Player key={`${playable.key}-${mode}`} lesson={lesson} playable={playable} mode={mode} />;
}

function Player({ lesson, playable, mode }: { lesson: Lesson; playable: Playable; mode: Mode }) {
  const navigate = useNavigate();
  const progress = useProgress();
  const { state, move, hint, restart } = useLessonPlayer(lesson.source.id, playable, mode);
  const id = lesson.source.id;
  const done = state.phase === 'done';
  const cur = playable.plies[state.index];
  const showArrow = cur && state.phase === 'input' && (mode === 'learn' || state.hintLevel === 2);
  const goto = (key: string, m: Mode) => navigate(playPath(id, key, m), { replace: true });

  // After a practice run: the next line that has not been practised cleanly yet.
  const after = lesson.playables.slice(lesson.playables.indexOf(playable) + 1).concat(lesson.playables);
  const nextLine = after.find((p) => p !== playable && !lineProgress(progress, id, p.key)?.cleanAt);
  const next = nextLine
    ? { label: `Next: ${playableTitle(nextLine)}`, onClick: () => goto(nextLine.key, lineProgress(progress, id, nextLine.key) ? 'practice' : 'learn') }
    : { label: 'Back to the lesson', onClick: () => navigate(lessonPath(id)) };

  return (
    <Page className="space-y-3">
      <PageHeader
        backTo={lessonPath(id)}
        title={lesson.source.name}
        subtitle={playableTitle(playable)}
        className="pb-0"
        actions={<Tabs options={[...MODES]} value={mode} onChange={(m) => goto(playable.key, m)} label="Mode" className="w-36 [&_button]:h-9 [&_button]:px-1 [&_button]:text-xs" />}
      />
      <StepProgress playable={playable} index={state.index} done={done} />
      <motion.div
        className={cn(
          '-mx-gutter transition-shadow duration-300 sm:mx-0 sm:overflow-hidden sm:rounded-[10px]',
          done && mode === 'practice' && state.mistakes + state.hints === 0
            ? 'shadow-[0_0_0_2px_var(--color-best),0_10px_40px_-12px_rgb(60_200_147/0.5)]'
            : state.phase === 'wrong'
              ? 'shadow-[0_0_0_2px_rgb(240_93_93/0.7)]'
              : 'shadow-[0_10px_40px_-12px_rgb(0_0_0/0.7)]',
        )}
        animate={state.phase === 'wrong' ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.36 }}
      >
        <LessonBoard
          fen={state.fen}
          orientation={playable.learner}
          interactive={state.phase === 'input'}
          onMove={move}
          lastMove={state.lastMove}
          arrow={showArrow ? { from: cur.from, to: cur.to } : null}
          glow={cur && state.phase === 'input' && mode === 'practice' && state.hintLevel === 1 ? cur.from : null}
          flash={state.flash}
        />
      </motion.div>

      {done ? (
        <RunSummary
          mode={mode}
          state={state}
          closing={playable.plies.at(-1)?.note}
          onPractice={() => goto(playable.key, 'practice')}
          onRestart={restart}
          next={next}
        />
      ) : (
        <>
          <CoachPanel playable={playable} mode={mode} state={state} />
          <div className="flex gap-2">
            {mode === 'practice' && (
              <Button className="flex-1" disabled={state.phase !== 'input' || state.hintLevel === 2} onClick={hint} icon={<Lightbulb className="size-4" />}>
                {state.hintLevel === 0 ? 'Hint' : state.hintLevel === 1 ? 'Show the move' : 'Move shown'}
              </Button>
            )}
            <Button className="flex-1" onClick={restart} icon={<RotateCcw className="size-4" />}>
              Restart
            </Button>
          </div>
        </>
      )}
    </Page>
  );
}
