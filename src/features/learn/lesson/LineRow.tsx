import { Link } from 'react-router';
import { BookOpen, Brain, Check } from 'lucide-react';
import { Badge, type BadgeTone } from '../../../components/ui';
import { cn } from '../../../lib/cn';
import { pluralize } from '../../../lib/format';
import { playableRole, playableTitle, sideName } from '../lib/catalog';
import type { LineStatus } from '../lib/progress';
import type { Playable } from '../types';

const STATUS: Record<LineStatus, { label: string; tone: BadgeTone }> = {
  new: { label: 'New', tone: 'accent' },
  learned: { label: 'Learned', tone: 'neutral' },
  due: { label: 'Due', tone: 'mistake' },
  practised: { label: 'Practised', tone: 'good' },
  mastered: { label: 'Mastered', tone: 'best' },
};

const action =
  'inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-control text-sm font-medium transition-colors active:scale-[0.98]';

/** One line of a lesson with its status and the two ways to play it. */
export function LineRow({ n, playable, status, learnTo, practiseTo }: { n: number; playable: Playable; status: LineStatus; learnTo: string; practiseTo: string }) {
  const role = playableRole(playable);
  const done = status === 'practised' || status === 'mastered';
  const mine = playable.plies.filter((p) => p.color === playable.learner).length;
  return (
    <div className="p-4">
      <div className="flex gap-3">
        <span
          className={cn(
            'grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold tnum',
            done ? 'bg-best/14 text-best' : 'bg-surface-3 text-fg-muted',
          )}
        >
          {done ? <Check className="size-4" aria-label="Practised" /> : n}
        </span>
        <div className="min-w-0 flex-1">
          {role && (
            <p className="text-2xs font-semibold tracking-[0.08em] text-fg-subtle uppercase">
              {role} · as {sideName(playable.learner)}
            </p>
          )}
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium">{playableTitle(playable)}</p>
            <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>
          </div>
          <p className="mt-0.5 text-sm text-fg-muted">{playable.defend ? defendSummary(playable) : playable.line.summary}</p>
          <p className="mt-1 text-xs text-fg-subtle tnum">{pluralize(mine, 'move')} to play</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2 pl-11">
        <Link to={learnTo} className={cn(action, 'bg-surface-3 text-fg hover:bg-line')}>
          <BookOpen className="size-4" aria-hidden />
          Learn
        </Link>
        <Link to={practiseTo} className={cn(action, status === 'due' ? 'bg-accent font-semibold text-accent-ink' : 'border border-line/60 bg-surface-2 text-fg hover:bg-surface-3')}>
          <Brain className="size-4" aria-hidden />
          Practice
        </Link>
      </div>
    </div>
  );
}

const defendSummary = (p: Playable) => `Play the ${sideName(p.learner)} side and avoid the trap: ${p.line.name.replace(/^When /, 'the line where ').replace(/\.$/, '')}.`;
