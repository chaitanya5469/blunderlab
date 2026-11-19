import type { ReactNode } from 'react';
import { ChartNoAxesColumn, ShieldAlert, Swords } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { pluralize } from '../../../lib/format';
import { openingTotals, trapHeadline } from '../lib/insights';
import type { PersonalStats } from '../lib/personal';
import type { Lesson } from '../types';

/** One line linking the lesson to the owner's own games, when there is something to say. */
export function PersonalNote({ lesson, stats }: { lesson: Lesson; stats: PersonalStats }) {
  const s = lesson.source;
  if (s.kind === 'trap') {
    const head = trapHeadline(stats.traps[s.id]);
    if (!head) return null;
    return <Note icon={head.bad ? <ShieldAlert /> : <Swords />} tone={head.bad ? 'bg-blunder/14 text-blunder' : 'bg-best/14 text-best'} title={head.title} body={head.body} />;
  }
  const t = openingTotals(stats, s.id);
  if (!t.games) return null;
  return (
    <Note
      icon={<ChartNoAxesColumn />}
      tone="bg-accent-soft text-accent-strong"
      title={`${pluralize(t.games, 'game')} in your history`}
      body={`You score ${Math.round(t.score * 100)}% in games that reach this lesson's lines as ${s.side}.`}
    />
  );
}

function Note({ icon, tone, title, body }: { icon: ReactNode; tone: string; title: string; body: string }) {
  return (
    <div className="flex gap-3 rounded-card border border-line-soft px-4 py-3">
      <span className={cn('grid size-9 shrink-0 place-items-center rounded-control [&_svg]:size-4.5', tone)}>{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-fg-muted">{body}</p>
      </div>
    </div>
  );
}
