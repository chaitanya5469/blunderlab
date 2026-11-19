import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { CalendarDays, Check, ChevronRight, CloudOff, Play, RotateCw } from 'lucide-react';
import { Page } from '../../../components/layout/Page';
import { PageHeader } from '../../../components/layout/PageHeader';
import { AnimatedNumber, Badge, Button, Card, SectionHeader, Skeleton, StatTile, StatTileGroup } from '../../../components/ui';
import { db } from '../../../lib/db';
import { capitalize, pluralize } from '../../../lib/format';
import type { LichessRating } from '../../../lib/types';
import { MiniBoard } from '../../learn/board/MiniBoard';
import { SourceTabs } from '../home/SourceTabs';
import { getDaily, type DailyState } from './model/daily';
import { RATING } from './model/rating';
import { toSolvable } from './model/solvable';
import { themeLabel, visibleThemes } from './model/themes';
import { isProvisional, useLichessRating, useLichessStats, type LichessStats } from './model/useLichessData';

/** Lichess puzzles: rating, the daily puzzle and rated puzzles from the bundled pack. Separate from the owner's own puzzles. */
export function LichessHomePage() {
  const rating = useLichessRating();
  const stats = useLichessStats();
  return (
    <Page className="space-y-5">
      <div>
        <PageHeader title="Puzzles" subtitle="Rated puzzles from Lichess" />
        <SourceTabs value="lichess" />
      </div>
      {!rating || !stats ? (
        <div className="space-y-5" aria-hidden>
          <Skeleton className="h-64 w-full rounded-card" />
          <Skeleton className="h-28 w-full rounded-card" />
        </div>
      ) : (
        <>
          <RatingCard rating={rating} stats={stats} />
          <DailyCard />
          {stats.attempts > 0 && (
            <section>
              <SectionHeader title="Lichess stats" meta={pluralize(stats.attempts, 'puzzle')} />
              <StatTileGroup>
                <StatTile label="Solve rate" value={stats.solveRate ?? 0} suffix="%" hint="clean solves" />
                <StatTile label="Today" value={stats.solvedToday} hint="solved" />
                <StatTile label="Peak" value={stats.peak ?? 0} hint="best rating" valueClassName="text-lichess" />
              </StatTileGroup>
            </section>
          )}
          <p className="px-1 text-xs leading-relaxed text-fg-subtle">
            Puzzles from the{' '}
            <a href="https://database.lichess.org/#puzzles" target="_blank" rel="noopener noreferrer" className="text-lichess underline-offset-2 hover:underline">
              Lichess puzzle database
            </a>{' '}
            (CC0). They have their own rating and never mix with the puzzles from your games or their review schedule.
          </p>
        </>
      )}
    </Page>
  );
}

function RatingCard({ rating, stats }: { rating: LichessRating; stats: LichessStats }) {
  const navigate = useNavigate();
  const provisional = isProvisional(rating);
  const last = stats.history.length >= 2 ? stats.history.at(-1)! - stats.history.at(-2)! : null;
  return (
    <Card variant="feature" tint="lichess" className="relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xs font-semibold tracking-[0.14em] text-lichess uppercase">Your puzzle rating</p>
          <p className="mt-1.5 flex items-baseline gap-2 font-display text-hero font-semibold tracking-[-0.04em] tnum">
            <AnimatedNumber value={Math.round(rating.rating)} />
            {last !== null && last !== 0 && (
              <span className={last > 0 ? 'text-base font-semibold tracking-normal text-best' : 'text-base font-semibold tracking-normal text-blunder'}>
                {last > 0 ? '+' : '−'}
                {Math.abs(last)}
              </span>
            )}
          </p>
        </div>
        {provisional && <Badge tone="lichess">Provisional</Badge>}
      </div>
      <p className="mt-1 text-sm text-fg-muted">
        {rating.games === 0
          ? rating.seed.chesscom !== null
            ? `Starting from your Chess.com ${capitalize(rating.seed.kind)} ${rating.seed.chesscom} + ${RATING.offset}. It settles within a dozen puzzles.`
            : 'Starting at 1500. It settles within a dozen puzzles.'
          : provisional
            ? `Settling in: ${RATING.provisionalGames - rating.games} more to a steady rating.`
            : 'Puzzles are picked close to this rating.'}
      </p>
      {stats.history.length >= 2 && <Sparkline values={stats.history} />}
      <Button variant="lichess" size="lg" className="mt-4 w-full" onClick={() => navigate('/puzzles/lichess/play')} icon={<Play className="size-4.5 fill-current" />}>
        {stats.attempts ? 'Play rated puzzles' : 'Start rated puzzles'}
      </Button>
      <p className="mt-3 text-xs text-fg-subtle">A clean solve raises your rating, a miss lowers it. Solved puzzles move straight on to the next.</p>
    </Card>
  );
}

/** Rating after each of the last puzzles, as a quiet line. */
function Sparkline({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - ((v - min) / span) * 24 - 2}`).join(' ');
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className="mt-3 h-10 w-full" aria-label={`Rating over the last ${values.length} puzzles`} role="img">
      <polyline points={pts} fill="none" stroke="var(--color-lichess)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function DailyCard() {
  const [state, setState] = useState<DailyState | null>(null);
  const [busy, setBusy] = useState(false);
  const id = state?.status === 'ready' ? state.daily.puzzle.id : null;
  const done = useLiveQuery(async () => (id ? (await db.lichessAttempts.where('puzzleId').equals(id).count()) > 0 : false), [id]);

  useEffect(() => {
    let live = true;
    void getDaily().then((s) => live && setState(s));
    return () => {
      live = false;
    };
  }, []);

  const retry = async () => {
    setBusy(true);
    setState(await getDaily(true));
    setBusy(false);
  };

  return (
    <section>
      <SectionHeader title="Daily puzzle" />
      {!state ? (
        <Skeleton className="h-28 w-full rounded-card" />
      ) : state.status === 'error' ? (
        <Card className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-surface-3 text-fg-muted edge-current [&_svg]:size-4.5">
            <CloudOff />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Daily puzzle unavailable</p>
            <p className="mt-0.5 text-xs text-fg-muted">Could not reach Lichess. It needs a connection once a day.</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Try again" loading={busy} onClick={() => void retry()} icon={<RotateCw className="size-4.5" />} />
        </Card>
      ) : (
        <DailyRow state={state} done={!!done} />
      )}
    </section>
  );
}

function DailyRow({ state, done }: { state: Extract<DailyState, { status: 'ready' }>; done: boolean }) {
  const { puzzle } = state.daily;
  const color = toSolvable(puzzle).color;
  return (
    <Link to="/puzzles/lichess/daily" className="flex items-center gap-3.5 rounded-card p-3 pressable surface-raised">
      <MiniBoard fen={puzzle.fen} orientation={color} className="size-20 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <CalendarDays className="size-4 text-lichess" aria-hidden />
          {state.stale ? `From ${state.daily.date}` : 'Today'}
          <span className="font-normal text-fg-subtle">· rated {puzzle.rating}</span>
        </p>
        <p className="mt-0.5 truncate text-xs text-fg-muted">{visibleThemes(puzzle.themes, 2).map(themeLabel).join(' · ') || `${capitalize(color)} to play`}</p>
        <p className="mt-1.5">
          {done ? (
            <Badge tone="best">
              <Check className="size-3" aria-hidden /> Played
            </Badge>
          ) : (
            <Badge tone="lichess">{capitalize(color)} to play</Badge>
          )}
        </p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-fg-subtle" aria-hidden />
    </Link>
  );
}
