import { useMemo, useState } from 'react';
import { SearchX } from 'lucide-react';
import { Page } from '../../../components/layout/Page';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button, Card, EmptyState, SectionHeader, Skeleton, StatTile, StatTileGroup, Tabs } from '../../../components/ui';
import { pluralize } from '../../../lib/format';
import type { Color } from '../../../lib/types';
import { LESSONS, openingsFor, trapsFor } from '../lib/catalog';
import { openingTotals, recommend, trapHeadline } from '../lib/insights';
import { usePersonalStats } from '../lib/personal';
import { lessonStatus, useNow, useProgress } from '../lib/progress';
import type { Lesson } from '../types';
import { ContinueCard } from './ContinueCard';
import { LessonRow } from './LessonRow';
import { OpeningTile } from './OpeningTile';
import { SearchFilter, matchesFilter, type Filter } from './SearchFilter';
import { YourOpenings } from './YourOpenings';

/** `#/learn`: continue, reviews, recommendations, your openings, and the full course. */
export function LearnHomePage() {
  const progress = useProgress();
  const now = useNow();
  const stats = usePersonalStats();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [openingSide, setOpeningSide] = useState<Color>('white');
  const [trapSide, setTrapSide] = useState<Color>('white');

  const status = useMemo(() => new Map(LESSONS.map((l) => [l, lessonStatus(l, progress, now)])), [progress, now]);
  const st = (l: Lesson) => status.get(l)!;
  const recs = useMemo(() => (stats ? recommend(stats, progress, now) : []), [stats, progress, now]);
  const due = LESSONS.filter((l) => st(l).due > 0);
  const completed = LESSONS.filter((l) => st(l).completed).length;
  const practised = Object.values(progress.lines).filter((lp) => lp.cleanAt).length;
  const searching = query.trim() !== '' || filter !== 'all';
  const trapNote = (l: Lesson) => (stats ? trapHeadline(stats.traps[l.source.id])?.title : undefined);

  return (
    <Page className="space-y-6">
      <PageHeader title="Learn" subtitle="Openings and traps, shaped by your games" />

      <ContinueCard progress={progress} now={now} first={recs[0]} />

      {progress.recent && (
        <StatTileGroup>
          <StatTile label="Lessons done" value={completed} suffix={`/${LESSONS.length}`} valueClassName={completed ? 'text-best' : undefined} />
          <StatTile label="Due" value={due.length} valueClassName={due.length ? 'text-mistake' : undefined} />
          <StatTile label="Lines learned" value={practised} />
        </StatTileGroup>
      )}

      <SearchFilter query={query} onQuery={setQuery} filter={filter} onFilter={setFilter} dueCount={due.length} />

      {searching ? (
        <Results lessons={LESSONS.filter((l) => matchesFilter(l, query, filter, st(l)))} st={st} onClear={() => (setQuery(''), setFilter('all'))} />
      ) : (
        <>
          {due.length > 0 && (
            <section>
              <SectionHeader title="Due for review" />
              <Card padded={false} className="p-1.5">
                {due.map((l) => (
                  <LessonRow key={l.source.id} lesson={l} status={st(l)} note={`${st(l).due} of ${st(l).total} lines to review`} />
                ))}
              </Card>
            </section>
          )}

          <section>
            <SectionHeader title="Recommended for you" />
            <Card padded={false} className="p-1.5">
              {!stats && Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="m-2 h-14" />)}
              {recs.map((r) => (
                <LessonRow key={r.lesson.source.id} lesson={r.lesson} status={st(r.lesson)} note={r.reason} noteTone={r.tone} />
              ))}
            </Card>
          </section>

          <section>
            <SectionHeader title="Your openings" />
            {stats ? <YourOpenings stats={stats} /> : <Skeleton className="h-48 w-full rounded-card" />}
          </section>

          <section>
            <SectionHeader title={`Openings · ${openingsFor(openingSide).length}`} />
            <Tabs options={SIDES} value={openingSide} onChange={setOpeningSide} label="Openings for" className="mb-3" />
            <div className="grid grid-cols-2 gap-3">
              {openingsFor(openingSide).map((l) => (
                <OpeningTile key={l.source.id} lesson={l} status={st(l)} games={stats ? openingTotals(stats, l.source.id).games : undefined} />
              ))}
            </div>
          </section>

          <section>
            <SectionHeader title={`Traps · ${trapsFor(trapSide).length}`} />
            <Tabs
              options={[
                { value: 'white', label: 'Set with White' },
                { value: 'black', label: 'Set with Black' },
              ]}
              value={trapSide}
              onChange={setTrapSide}
              label="Traps set by"
              className="mb-3"
            />
            <Card padded={false} className="p-1.5">
              {trapsFor(trapSide).map((l) => (
                <LessonRow key={l.source.id} lesson={l} status={st(l)} note={trapNote(l)} noteTone={stats?.traps[l.source.id]?.fell ? 'bad' : 'info'} />
              ))}
            </Card>
          </section>
        </>
      )}
    </Page>
  );
}

const SIDES = [
  { value: 'white' as const, label: 'As White' },
  { value: 'black' as const, label: 'As Black' },
];

function Results({ lessons, st, onClear }: { lessons: Lesson[]; st: (l: Lesson) => ReturnType<typeof lessonStatus>; onClear: () => void }) {
  if (lessons.length === 0) {
    return (
      <Card padded={false}>
        <EmptyState icon={<SearchX />} title="No lessons match" body="Try another name, or clear the search and filters." action={<Button onClick={onClear}>Clear search</Button>} />
      </Card>
    );
  }
  return (
    <section>
      <SectionHeader title={pluralize(lessons.length, 'lesson')} />
      <Card padded={false} className="p-1.5">
        {lessons.map((l) => (
          <LessonRow key={l.source.id} lesson={l} status={st(l)} />
        ))}
      </Card>
    </section>
  );
}
