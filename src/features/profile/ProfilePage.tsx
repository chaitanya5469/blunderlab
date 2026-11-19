import { useState, type ReactNode } from 'react';
import { RatingHistory } from './RatingHistory';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight, ExternalLink, Flame, Globe, Inbox, Puzzle } from 'lucide-react';
import { Page } from '../../components/layout/Page';
import { PageHeader } from '../../components/layout/PageHeader';
import { AnimatedNumber, Avatar, Card, EmptyState, Progress, SectionHeader, Skeleton, StatTile, StatTileGroup } from '../../components/ui';
import { useProfile } from '../../hooks/useProfile';
import { useAnalysisState } from '../../hooks/useServices';
import { cn } from '../../lib/cn';
import { db } from '../../lib/db';
import { BadgeIcon } from '../achievements/BadgeIcon';
import { BADGES, badgeById } from '../achievements/model/badges';
import { useAchievements } from '../achievements/useAchievements';
import { formatDiff } from '../games/gameMeta';
import { GameRow, GameRowSkeleton } from '../games/GameRow';
import { RecordCard } from '../games/RecordCard';
import { useGameList } from '../games/useGameList';
import { RatingStrip } from '../home/RatingStrip';
import { isProvisional, useLichessRating, useLichessStats } from '../puzzles/lichess/model/useLichessData';
import { countPuzzles, useAttemptStats, useNow, usePuzzles } from '../puzzles/model/usePuzzleData';

const ALL_GAMES = { result: 'all', timeClass: 'all', analysedOnly: false, q: '' } as const;

/** Mean game rating (lib/gameRating.ts) over analysed games, and the owner's mean rating in those same games. */
function useGameRatingStats() {
  return useLiveQuery(async () => {
    const analyses = (await db.analyses.toArray()).filter((a) => typeof a[a.ownerColor].gameRating === 'number');
    const games = await db.games.bulkGet(analyses.map((a) => a.gameId));
    let perf = 0;
    let own = 0;
    let n = 0;
    analyses.forEach((a, i) => {
      const g = games[i];
      if (!g) return;
      perf += a[a.ownerColor].gameRating as number;
      own += g[g.ownerColor].rating;
      n++;
    });
    return n ? { games: n, gameRating: perf / n, rating: own / n } : { games: 0, gameRating: null, rating: null };
  }, []);
}

function Identity() {
  const profile = useProfile();
  const { snapshot, unlocks } = useAchievements();
  if (!profile) return null;
  const earned = (unlocks ?? []).flatMap((u) => badgeById.get(u.id) ?? []);
  const shown = earned.slice(0, 5);

  return (
    <Card variant="feature" padded={false} className="overflow-hidden">
      <div className="flex items-center gap-3.5 p-4">
        <div className="shrink-0 rounded-full bg-[linear-gradient(160deg,rgb(147_176_255/0.6),rgb(111_149_255/0.06))] p-[1.5px]">
          <div className="rounded-full bg-canvas p-[2px]">
            <Avatar src={profile.avatar} name={profile.displayName} className="size-16 text-xl" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-2xl leading-tight font-semibold tracking-[-0.02em]">{profile.displayName}</h2>
          {profile.name && <p className="truncate text-sm text-fg-muted">{profile.name}</p>}
          {profile.url ? (
            <a
              href={profile.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex h-7 items-center gap-1 rounded-full text-xs font-medium text-accent-strong pressable"
            >
              Chess.com profile <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ) : (
            <p className="mt-1 text-xs text-fg-subtle">Chess.com</p>
          )}
        </div>
      </div>

      <Link to="/achievements" className="block border-t border-white/[0.06] bg-ink/25 px-4 py-3.5 press-row" aria-label="Title, badges and achievements">
        {snapshot ? (
          <>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-semibold text-accent-strong">{snapshot.title.title.name}</p>
              <p className="shrink-0 text-xs text-fg-muted tnum">
                {snapshot.title.xp.toLocaleString()} XP
                {snapshot.title.next && <span className="text-fg-subtle"> · {snapshot.title.toNext.toLocaleString()} to next</span>}
              </p>
            </div>
            <Progress value={snapshot.title.fraction} label="Progress to the next title" />
          </>
        ) : (
          <Skeleton className="h-8 w-full" />
        )}
        <div className="mt-3 flex items-center gap-2">
          {shown.length > 0 ? (
            <span className="flex items-center -space-x-1">
              {shown.map((b) => (
                <span key={b.id} title={b.name} className="rounded-[9px] ring-2 ring-surface-1">
                  <BadgeIcon badge={b} size="xs" />
                </span>
              ))}
            </span>
          ) : (
            <span className="text-xs text-fg-subtle">No badges yet</span>
          )}
          <span className="ml-auto flex items-center gap-0.5 text-xs text-fg-muted tnum">
            {earned.length}/{BADGES.length} badges
            <ChevronRight className="size-3.5 text-fg-subtle" aria-hidden />
          </span>
        </div>
      </Link>
    </Card>
  );
}

function PuzzleRow({ to, icon, tone, title, children }: { to: string; icon: ReactNode; tone: 'blunder' | 'lichess'; title: string; children: ReactNode }) {
  return (
    <Link to={to} className="block px-4 py-3.5 press-row">
      <div className="mb-2.5 flex items-center gap-2">
        <span
          className={cn(
            'grid size-7 shrink-0 place-items-center rounded-[9px] edge-current',
            tone === 'blunder' ? 'bg-blunder/14 text-blunder' : 'bg-lichess-soft text-lichess',
          )}
        >
          {icon}
        </span>
        <span className="flex-1 text-sm font-semibold">{title}</span>
        <ChevronRight className="size-4 text-fg-subtle" aria-hidden />
      </div>
      <StatTileGroup>{children}</StatTileGroup>
    </Link>
  );
}

function PuzzleStats() {
  const rating = useLichessRating();
  const li = useLichessStats();
  const puzzles = usePuzzles();
  const attempts = useAttemptStats();
  const now = useNow(puzzles);
  if (!rating || !li || !puzzles || !attempts) return <Skeleton className="h-64 rounded-card" />;
  const counts = countPuzzles(puzzles, now);

  return (
    <Card variant="base" padded={false} className="divide-y divide-line-soft overflow-hidden">
      <PuzzleRow to="/puzzles/lichess" tone="lichess" icon={<Globe className="size-4" aria-hidden />} title="Lichess puzzles">
        <StatTile
          label="Rating"
          value={Math.round(rating.rating)}
          suffix={isProvisional(rating) ? '?' : undefined}
          valueClassName="text-lichess"
          hint={li.peak !== null ? `peak ${li.peak}` : 'not played yet'}
        />
        <StatTile label="Played" value={li.attempts} />
        <StatTile label="Solve rate" value={li.solveRate ?? '—'} suffix={li.solveRate !== null ? '%' : undefined} />
      </PuzzleRow>
      <PuzzleRow to="/puzzles" tone="blunder" icon={<Puzzle className="size-4" aria-hidden />} title="Puzzles from your games">
        <StatTile label="Puzzles" value={counts.total} hint={counts.due > 0 ? `${counts.due} due` : undefined} />
        <StatTile label="Mastered" value={counts.mastered} valueClassName="text-best" />
        <StatTile label="Solve rate" value={attempts.solveRate ?? '—'} suffix={attempts.solveRate !== null ? '%' : undefined} />
      </PuzzleRow>
    </Card>
  );
}

function StreakStats() {
  const { snapshot } = useAchievements();
  if (!snapshot) return <Skeleton className="h-24 rounded-card" />;
  const { streak } = snapshot;
  return (
    <Link to="/achievements" className="block rounded-card pressable" aria-label="Daily streak">
      <Card className="flex items-center gap-3">
        <span
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-[14px] edge-current',
            streak.todayDone ? 'bg-mistake/16 text-mistake' : 'bg-surface-3 text-fg-subtle',
          )}
        >
          <Flame className="size-5" fill={streak.todayDone ? 'currentColor' : 'none'} fillOpacity={0.25} />
        </span>
        <StatTileGroup className="flex-1">
          <StatTile variant="plain" label="Current" value={streak.current} suffix="d" valueClassName={streak.todayDone ? 'text-mistake' : undefined} />
          <StatTile variant="plain" label="Best" value={streak.best} suffix="d" />
        </StatTileGroup>
        <ChevronRight className="size-4 shrink-0 text-fg-subtle" aria-hidden />
      </Card>
    </Link>
  );
}

function GameRatingCard() {
  const s = useGameRatingStats();
  if (!s) return <Skeleton className="h-24 rounded-card" />;
  const diff = s.gameRating !== null && s.rating !== null ? s.gameRating - s.rating : null;
  const tone = diff === null || Math.round(diff) === 0 ? 'text-fg-muted' : diff > 0 ? 'text-best' : 'text-mistake';
  return (
    <Card className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-fg-muted">Average game rating</p>
        <p className={cn('mt-1.5 font-display text-[2.25rem] leading-none font-semibold tracking-[-0.04em] tnum', s.gameRating !== null && tone)}>
          {s.gameRating !== null ? <AnimatedNumber value={s.gameRating} /> : '—'}
        </p>
      </div>
      <p className="max-w-[17ch] pb-0.5 text-right text-xs leading-snug text-fg-subtle">
        {diff !== null && s.rating !== null ? (
          <>
            <span className={cn('font-semibold tnum', tone)}>{formatDiff(diff)}</span> vs your {Math.round(s.rating)} rating, over{' '}
            <span className="tnum">{s.games.toLocaleString()}</span> {s.games === 1 ? 'game' : 'games'}
          </>
        ) : (
          'Appears after your first analysed game'
        )}
      </p>
    </Card>
  );
}

/** The owner at a glance: Chess.com identity and ratings, puzzle ratings, title, streak and games. */
export function ProfilePage() {
  const profile = useProfile();
  const [now] = useState(() => Date.now());
  const list = useGameList(ALL_GAMES, 5, now);
  const { currentGameId } = useAnalysisState();
  if (!profile) return null;

  return (
    <Page className="space-y-6">
      <PageHeader title="Profile" backTo="/" />

      <Identity />

      <section>
        <SectionHeader title="Chess.com ratings" />
        <RatingStrip ratings={profile.ratings} />
      </section>

      <section>
        <SectionHeader title="Rating history" />
        <RatingHistory />
      </section>

      <section>
        <SectionHeader title="Puzzles" />
        <PuzzleStats />
      </section>

      <section>
        <SectionHeader title="Daily streak" />
        <StreakStats />
      </section>

      <section className="space-y-3">
        <SectionHeader title="Games" className="mb-0" />
        <RecordCard summary={list?.summary} total={list?.total} result="all" context="all games" />
        <GameRatingCard />
      </section>

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
          {!list && Array.from({ length: 3 }, (_, i) => <GameRowSkeleton key={i} />)}
          {list?.items.length === 0 && <EmptyState icon={<Inbox />} title="No games yet" body="Your latest games will show up here once synced." />}
          {list?.items.map(({ game, analysis }) => (
            <GameRow key={game.uuid} game={game} analysis={analysis} analysing={currentGameId === game.uuid} />
          ))}
        </Card>
      </section>
    </Page>
  );
}
