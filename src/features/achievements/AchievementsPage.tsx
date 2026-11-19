import { useState } from 'react';
import { Check, Crown, Lock, Moon } from 'lucide-react';
import { Page } from '../../components/layout/Page';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button, Card, Progress, SectionHeader, Sheet, Skeleton, StatTile, StatTileGroup } from '../../components/ui';
import { cn } from '../../lib/cn';
import { BadgeIcon } from './BadgeIcon';
import { BADGES, type BadgeDef } from './model/badges';
import type { ProgressSnapshot } from './model/snapshot';
import { dayStart, REST_EVERY } from './model/streak';
import { TITLES, XP } from './model/titles';
import { useAchievements } from './useAchievements';

const formatDate = (ms: number) => new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function TitleHero({ s }: { s: ProgressSnapshot }) {
  const { title } = s;
  const lessonsDone = s.lessons.openings.length + s.lessons.traps.length;
  const parts = [
    { label: 'Puzzles', xp: s.solved.all.length * XP.puzzle },
    { label: 'Lesson lines', xp: s.lessons.linesDone * XP.line },
    { label: 'Lessons', xp: lessonsDone * XP.lesson },
    { label: 'Best streak', xp: s.streak.best * XP.streakDay },
  ];
  return (
    <Card variant="feature" className="space-y-4">
      <div className="flex items-center gap-3.5">
        <span className="grid size-14 shrink-0 place-items-center rounded-[18px] bg-accent-soft text-accent-strong edge-current shadow-[0_10px_24px_-14px_var(--color-accent)]">
          <Crown className="size-7" strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-2xs font-semibold tracking-[0.12em] text-fg-subtle uppercase tnum">
            Title {title.level + 1} of {TITLES.length}
          </p>
          <h2 className="font-display text-2xl leading-tight font-semibold tracking-[-0.02em]">{title.title.name}</h2>
        </div>
      </div>
      <p className="text-sm text-fg-muted">{title.title.blurb}</p>
      <div>
        <div className="mb-2 flex items-baseline justify-between gap-3 text-xs tnum">
          <span className="font-semibold text-fg">{title.xp.toLocaleString()} XP</span>
          <span className="text-fg-muted">{title.next ? `${title.toNext.toLocaleString()} to ${title.next.name}` : 'Top of the ladder'}</span>
        </div>
        <Progress value={title.fraction} label="Progress to the next title" />
      </div>
      <dl className="grid grid-cols-2 gap-2">
        {parts.map((p) => (
          <div key={p.label} className="surface-inset flex items-baseline justify-between gap-2 rounded-[12px] px-3 py-2">
            <dt className="truncate text-2xs text-fg-subtle">{p.label}</dt>
            <dd className="text-xs font-semibold tnum">{p.xp.toLocaleString()}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function BadgeTile({ badge, s, unlockedAt, onOpen }: { badge: BadgeDef; s: ProgressSnapshot; unlockedAt?: number; onOpen: () => void }) {
  const earned = unlockedAt !== undefined;
  const st = badge.check(s);
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex flex-col items-center gap-2 rounded-[16px] px-1 pt-3 pb-2.5 text-center press-row"
      aria-label={`${badge.name}, ${earned ? 'earned' : 'locked'}`}
    >
      <BadgeIcon badge={badge} locked={!earned} />
      <span className={cn('line-clamp-2 text-xs leading-tight font-semibold', !earned && 'text-fg-muted')}>{badge.name}</span>
      {earned ? (
        <span className="text-2xs text-fg-subtle tnum">{new Date(unlockedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
      ) : st.progress && st.progress.target > 1 ? (
        <span className="text-2xs text-fg-subtle tnum">
          {st.progress.value}/{st.progress.target}
        </span>
      ) : (
        <span className="text-2xs text-fg-subtle">Locked</span>
      )}
    </button>
  );
}

/** Streak, title ladder and the badge collection. Reachable from Home and Settings. */
export function AchievementsPage() {
  const { snapshot: s, unlocks } = useAchievements();
  const [open, setOpen] = useState<BadgeDef | null>(null);
  const unlockedAt = new Map(unlocks?.map((u) => [u.id, u.unlockedAt]));
  const earnedCount = BADGES.filter((b) => unlockedAt.has(b.id)).length;
  const openStatus = open && s ? open.check(s) : null;

  return (
    <Page className="space-y-6">
      <PageHeader title="Achievements" subtitle="Streak, titles and badges" backTo="/" />

      {!s ? (
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-card" />
          <Skeleton className="h-24 rounded-card" />
        </div>
      ) : (
        <>
          <TitleHero s={s} />

          <section>
            <SectionHeader title="Daily streak" />
            <Card className="space-y-3">
              <StatTileGroup>
                <StatTile label="Current" value={s.streak.current} suffix="d" valueClassName={s.streak.todayDone ? 'text-mistake' : undefined} />
                <StatTile label="Best" value={s.streak.best} suffix="d" />
                <StatTile label="Active days" value={s.streak.activeDays} />
              </StatTileGroup>
              <p className="flex gap-2 px-1 text-xs leading-relaxed text-fg-muted">
                <Moon className="mt-0.5 size-3.5 shrink-0 text-mistake" aria-hidden />
                <span>
                  A day counts when you solve a puzzle or play a lesson line. One rest day every {REST_EVERY} days is forgiven; two missed days in a row
                  start the streak over.{' '}
                  {s.streak.restAvailable
                    ? 'Your rest day is ready.'
                    : `Rest day used; ready again ${new Date(dayStart(s.streak.restBackOn!)).toLocaleDateString(undefined, { weekday: 'long' })}.`}
                </span>
              </p>
            </Card>
          </section>

          <section>
            <SectionHeader title="Badges" meta={`${earnedCount}/${BADGES.length}`} />
            <Card variant="base" className="grid grid-cols-3 gap-x-1 gap-y-1 p-2">
              {BADGES.map((b) => (
                <BadgeTile key={b.id} badge={b} s={s} unlockedAt={unlockedAt.get(b.id)} onOpen={() => setOpen(b)} />
              ))}
            </Card>
          </section>

          <section>
            <SectionHeader title="Title ladder" />
            <Card variant="base" padded={false} className="divide-y divide-line-soft overflow-hidden">
              {TITLES.map((t, i) => {
                const reached = i <= s.title.level;
                const current = i === s.title.level;
                return (
                  <div key={t.name} className={cn('flex items-center gap-3 px-4 py-3', current && 'bg-accent-soft')}>
                    <span
                      className={cn(
                        'grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold tnum edge-current',
                        current ? 'bg-accent text-accent-ink' : reached ? 'bg-best/14 text-best' : 'bg-surface-3 text-fg-subtle',
                      )}
                    >
                      {reached && !current ? <Check className="size-4" strokeWidth={2.5} /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate text-sm font-semibold', !reached && 'text-fg-muted')}>{t.name}</p>
                      <p className="truncate text-xs text-fg-subtle">{t.blurb}</p>
                    </div>
                    <span className="shrink-0 text-xs text-fg-subtle tnum">{t.xp.toLocaleString()} XP</span>
                  </div>
                );
              })}
            </Card>
            <p className="mt-2 px-1 text-xs leading-relaxed text-fg-subtle">
              XP: {XP.puzzle} per puzzle solved, {XP.line} per lesson line practised cleanly, {XP.lesson} per lesson completed, {XP.streakDay} per day of
              your best streak.
            </p>
          </section>
        </>
      )}

      <Sheet
        open={!!open}
        onClose={() => setOpen(null)}
        title={
          open && (
            <span className="flex items-center gap-3">
              <BadgeIcon badge={open} locked={!unlockedAt.has(open.id)} size="sm" />
              {open.name}
            </span>
          )
        }
        description={open?.description}
        actions={
          <Button size="lg" onClick={() => setOpen(null)}>
            Close
          </Button>
        }
      >
        {open && (
          <div className="surface-inset rounded-[14px] px-3.5 py-3 text-sm">
            {unlockedAt.has(open.id) ? (
              <p className="flex items-center gap-2 text-best">
                <Check className="size-4" aria-hidden /> Earned {formatDate(unlockedAt.get(open.id)!)}
              </p>
            ) : openStatus?.progress && openStatus.progress.target > 1 ? (
              <div className="space-y-2">
                <p className="flex items-center gap-2 text-fg-muted">
                  <Lock className="size-4" aria-hidden /> {openStatus.progress.value.toLocaleString()} of {openStatus.progress.target.toLocaleString()} so far
                </p>
                <Progress value={openStatus.progress.value / openStatus.progress.target} />
              </div>
            ) : (
              <p className="flex items-center gap-2 text-fg-muted">
                <Lock className="size-4" aria-hidden /> Not earned yet
              </p>
            )}
          </div>
        )}
      </Sheet>
    </Page>
  );
}
