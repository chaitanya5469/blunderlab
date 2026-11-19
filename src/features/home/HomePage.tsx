import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, Inbox, Settings } from 'lucide-react';
import { Page } from '../../components/layout/Page';
import { Avatar, Card, EmptyState, SectionHeader, Skeleton } from '../../components/ui';
import { useProfile } from '../../hooks/useProfile';
import { useAnalysisState } from '../../hooks/useServices';
import { db } from '../../lib/db';
import { BadgeIcon } from '../achievements/BadgeIcon';
import { badgeById } from '../achievements/model/badges';
import { StreakCard } from '../achievements/StreakCard';
import { useAchievements } from '../achievements/useAchievements';
import { GameRow, GameRowSkeleton } from '../games/GameRow';
import { ActivityCard } from './ActivityCard';
import { CardSlider } from './CardSlider';
import { EntryCards } from './EntryCards';
import { PuzzlesCard } from './PuzzlesCard';
import { StatsCard } from './StatsCard';
import { useOwnerStats } from './useOwnerStats';

function useRecentGames() {
  return useLiveQuery(async () => {
    const games = await db.games.orderBy('endTime').reverse().limit(5).toArray();
    const analyses = await db.analyses.bulkGet(games.map((g) => g.uuid));
    return games.map((game, i) => ({ game, analysis: analyses[i] }));
  }, []);
}

export function HomePage() {
  const profile = useProfile();
  const stats = useOwnerStats();
  const recent = useRecentGames();
  const { currentGameId } = useAnalysisState();
  const { snapshot, unlocks } = useAchievements();
  const recentBadges = (unlocks ?? []).slice(0, 3).flatMap((u) => badgeById.get(u.id) ?? []);
  if (!profile) return null;

  return (
    <Page className="space-y-7">
      <header className="flex items-center gap-2.5 pt-5">
        <div className="min-w-0 flex-1">
          {snapshot ? (
            <h1 className="line-clamp-2 text-[1.5rem] leading-[1.15] font-semibold tracking-[-0.03em] text-balance">{snapshot.title.title.name}</h1>
          ) : (
            <Skeleton className="h-7 w-40" />
          )}
          {recentBadges.length > 0 && (
            <Link to="/achievements" aria-label="Your badges" className="-ml-0.5 mt-1 inline-flex items-center -space-x-1 rounded-[10px] p-0.5 pressable">
              {recentBadges.map((b) => (
                <span key={b.id} title={b.name} className="rounded-[9px] ring-2 ring-canvas">
                  <BadgeIcon badge={b} size="xs" />
                </span>
              ))}
            </Link>
          )}
        </div>
        <Link
          to="/settings"
          data-guide="settings"
          aria-label="Settings"
          className="grid size-11 shrink-0 place-items-center rounded-full border border-line-soft bg-surface-1 text-fg-muted pressable shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] hover:text-fg active:bg-surface-2 active:text-fg"
        >
          <Settings className="size-5" />
        </Link>
        <Link to="/profile" data-guide="profile" aria-label="Your profile" className="-mr-1 shrink-0 rounded-full pressable">
          <span className="block rounded-full bg-[linear-gradient(160deg,rgb(147_176_255/0.6),rgb(111_149_255/0.06))] p-[1.5px]">
            <span className="block rounded-full bg-canvas p-[2px]">
              <Avatar src={profile.avatar} name={profile.displayName} className="size-10" />
            </span>
          </span>
        </Link>
      </header>

      <CardSlider label="Your progress" slideLabels={['Streak', 'Your form', 'Puzzles']}>
        <div data-guide="streak" className="flex flex-col">
          <StreakCard snapshot={snapshot} className="flex-1" />
        </div>
        <StatsCard stats={stats} title="Your form" compact />
        <PuzzlesCard />
      </CardSlider>

      <div data-guide="activity">
        <ActivityCard lastSyncAt={profile.lastSyncAt} />
      </div>

      <section>
        <SectionHeader
          title="Recent games"
          action={
            <Link
              to="/games"
              className="-mr-2 flex h-11 items-center gap-0.5 rounded-full px-3 text-sm font-medium text-accent-strong pressable hover:bg-accent-soft active:bg-accent-soft"
            >
              All games <ChevronRight className="size-4" aria-hidden />
            </Link>
          }
        />
        <Card variant="base" padded={false} className="overflow-hidden divide-y divide-line-soft">
          {!recent && Array.from({ length: 3 }, (_, i) => <GameRowSkeleton key={i} />)}
          {recent?.length === 0 && <EmptyState icon={<Inbox />} title="No games yet" body="Your latest games will show up here once synced." />}
          {recent?.map(({ game, analysis }, i) => (
            <GameRow key={game.uuid} game={game} analysis={analysis} analysing={currentGameId === game.uuid} settleDelay={i * 30} />
          ))}
        </Card>
      </section>

      <section>
        <SectionHeader title="Train" />
        <EntryCards />
      </section>
    </Page>
  );
}
