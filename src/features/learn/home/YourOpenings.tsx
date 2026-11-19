import { useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight, Inbox } from 'lucide-react';
import { Card, EmptyState, Tabs } from '../../../components/ui';
import { cn } from '../../../lib/cn';
import { pluralize } from '../../../lib/format';
import type { Color } from '../../../lib/types';
import { getLesson } from '../lib/catalog';
import { lessonPath } from '../lib/paths';
import { scoreOf, type OpeningGroup, type PersonalStats } from '../lib/personal';

const SHOWN = 5;

/** The owner's most played openings per colour, with score and a link to the matching lesson. */
export function YourOpenings({ stats }: { stats: PersonalStats }) {
  const [color, setColor] = useState<Color>('white');
  const [all, setAll] = useState(false);
  if (stats.games === 0) {
    return (
      <Card padded={false}>
        <EmptyState icon={<Inbox />} title="No games yet" body="Once your games are synced, your most played openings and how you score in them appear here." />
      </Card>
    );
  }
  const rows = stats.openings.filter((g) => g.color === color);
  return (
    <div className="space-y-2">
      <Tabs
        options={[
          { value: 'white', label: 'As White' },
          { value: 'black', label: 'As Black' },
        ]}
        value={color}
        onChange={(c) => {
          setColor(c);
          setAll(false);
        }}
        label="Colour"
      />
      <Card padded={false} className="p-1.5">
        {rows.length === 0 && <p className="px-3 py-4 text-sm text-fg-muted">No games with {color} yet.</p>}
        {rows.slice(0, all ? undefined : SHOWN).map((g) => (
          <Row key={g.name} group={g} />
        ))}
        {rows.length > SHOWN && (
          <button type="button" className="h-11 w-full rounded-control text-sm font-medium text-accent-strong hover:bg-surface-2" onClick={() => setAll((a) => !a)}>
            {all ? 'Show fewer' : `Show all ${rows.length}`}
          </button>
        )}
      </Card>
    </div>
  );
}

function Row({ group }: { group: OpeningGroup }) {
  const score = Math.round(scoreOf(group) * 100);
  const lesson = getLesson(group.lessonId);
  const body = (
    <>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{group.name}</p>
        <p className="mt-0.5 truncate text-xs text-fg-subtle tnum">
          {pluralize(group.games, 'game')} ·{group.wins}W {group.draws}D {group.losses}L
          {lesson && <span className="text-accent-strong"> · Lesson: {lesson.source.name}</span>}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className={cn('font-display text-lg leading-none font-semibold tnum', score >= 55 ? 'text-win' : score < 45 ? 'text-loss' : 'text-fg')}>{score}%</span>
        <span className="h-1 w-12 overflow-hidden rounded-full bg-surface-3" aria-hidden>
          <span className={cn('block h-full rounded-full', score >= 55 ? 'bg-win' : score < 45 ? 'bg-loss' : 'bg-draw')} style={{ width: `${score}%` }} />
        </span>
      </div>
    </>
  );
  const cls = 'flex min-h-16 items-center gap-3 rounded-control px-2.5 py-2.5';
  return lesson ? (
    <Link to={lessonPath(lesson.source.id)} className={cn(cls, 'transition-colors hover:bg-surface-2 active:bg-surface-2')}>
      {body}
      <ChevronRight className="size-4 shrink-0 text-fg-subtle" aria-hidden />
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
