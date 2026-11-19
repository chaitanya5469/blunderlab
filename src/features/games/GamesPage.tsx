import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { FilterX, Inbox, LoaderCircle } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Page } from '../../components/layout/Page';
import { Button, EmptyState } from '../../components/ui';
import { useAnalysisState, useSyncState } from '../../hooks/useServices';
import { capitalize, dateGroup, formatClock, formatDayShort } from '../../lib/format';
import type { GameResult } from '../../lib/types';
import { SyncStatusLine } from '../home/SyncStatusLine';
import { ActiveFilters, GameFilterBar } from './FilterChips';
import { GameRow, GameRowSkeleton } from './GameRow';
import { RecordCard } from './RecordCard';
import { useGameList, type GameFilters, type GameListItem, type Record3 } from './useGameList';

const PAGE = 40;
const RESULTS: (GameResult | 'all')[] = ['all', 'win', 'loss', 'draw'];

function readFilters(params: URLSearchParams): GameFilters {
  const result = params.get('result') as GameFilters['result'] | null;
  return {
    result: result && RESULTS.includes(result) ? result : 'all',
    timeClass: params.get('tc') ?? 'all',
    analysedOnly: params.get('analysed') === '1',
    q: params.get('q') ?? '',
  };
}

/** Filters live in the URL so they survive opening a game and coming back. */
function useFilters(): [GameFilters, (patch: Partial<GameFilters>) => void] {
  const [params, setParams] = useSearchParams();
  const { result, timeClass, analysedOnly, q } = readFilters(params);
  // Stable identity until a filter really changes (lets the page defer it).
  const filters = useMemo<GameFilters>(() => ({ result, timeClass, analysedOnly, q }), [result, timeClass, analysedOnly, q]);
  const update = (patch: Partial<GameFilters>) => {
    // Functional form: a debounced search must not overwrite a filter changed meanwhile.
    setParams(
      (prev) => {
        const next = { ...readFilters(prev), ...patch };
        const p = new URLSearchParams();
        if (next.result !== 'all') p.set('result', next.result);
        if (next.timeClass !== 'all') p.set('tc', next.timeClass);
        if (next.analysedOnly) p.set('analysed', '1');
        if (next.q?.trim()) p.set('q', next.q.trim());
        return p;
      },
      { replace: true },
    );
  };
  return [filters, update];
}

interface Section {
  key: string;
  label: string;
  items: GameListItem[];
}

function groupItems(items: GameListItem[], now: number): Section[] {
  const out: Section[] = [];
  for (const item of items) {
    const g = dateGroup(item.game.endTime, now);
    const last = out[out.length - 1];
    if (last?.key === g.key) last.items.push(item);
    else out.push({ ...g, items: [item] });
  }
  return out;
}

/** Inside a date group the day is known, so rows show the time (or the day within a month). */
function rowDate(ms: number, groupKey: string): string {
  if (groupKey === 'today' || groupKey === 'yesterday') return formatClock(ms);
  if (groupKey === 'week') return `${new Date(ms).toLocaleDateString(undefined, { weekday: 'short' })} ${formatClock(ms)}`;
  return formatDayShort(ms);
}

function MiniRecord({ record }: { record: Record3 | undefined }) {
  if (!record) return null;
  const n = record.wins + record.draws + record.losses;
  return (
    <span className="flex items-center gap-2 text-2xs font-semibold tnum">
      <span className="font-medium text-fg-subtle">{n.toLocaleString()} {n === 1 ? 'game' : 'games'}</span>
      <span className="flex items-center gap-1.5">
        <span className="text-win">{record.wins}W</span>
        <span className="text-draw">{record.draws}D</span>
        <span className="text-loss">{record.losses}L</span>
      </span>
    </span>
  );
}

/**
 * Sticky date header: opaque canvas (no blur), stuck just below the status bar. The status-bar
 * strip itself is covered by the shell's scrim (AppShell). Nothing here may paint above the
 * header's own box: while not stuck, that area is the filter chips.
 */
function SectionTitle({ label, record }: { label: string; record: Record3 | undefined }) {
  return (
    <div className="sticky top-[env(safe-area-inset-top)] z-10 -mx-gutter bg-canvas px-gutter pt-4 pb-2 after:pointer-events-none after:absolute after:inset-x-0 after:top-full after:h-3 after:bg-gradient-to-b after:from-canvas after:to-transparent">
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="truncate font-display text-[0.9375rem] font-semibold tracking-[-0.01em]">{label}</h2>
        <MiniRecord record={record} />
      </div>
    </div>
  );
}

export function GamesPage() {
  const [urlFilters, setFilters] = useFilters();
  // Chips and tabs follow the URL immediately; the record and the list catch up in a lower-priority render.
  const filters = useDeferredValue(urlFilters);
  const [now] = useState(() => Date.now());
  const [limit, setLimit] = useState(PAGE);
  const list = useGameList(filters, limit, now);
  const sync = useSyncState();
  const analysis = useAnalysisState();
  const sentinel = useRef<HTMLDivElement>(null);
  const hasMore = !!list && list.items.length < list.total;
  const q = filters.q?.trim() ?? '';
  const filtered = filters.result !== 'all' || filters.timeClass !== 'all' || filters.analysedOnly || q !== '';
  const sections = useMemo(() => (list ? groupItems(list.items, now) : []), [list, now]);
  const reset = () => setFilters({ result: 'all', timeClass: 'all', analysedOnly: false, q: '' });

  useEffect(() => setLimit(PAGE), [filters.result, filters.timeClass, filters.analysedOnly, q]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setLimit((l) => l + PAGE);
      },
      { rootMargin: '800px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore]);

  const context =
    [filters.timeClass !== 'all' && capitalize(filters.timeClass), filters.analysedOnly && 'analysed', q && `vs “${q}”`]
      .filter(Boolean)
      .join(' · ') || 'all games';

  let rowIndex = 0;

  return (
    <Page>
      <PageHeader title="Games" subtitle={list ? `${list.summary.all.toLocaleString()} synced` : ' '} />

      {(!list || list.summary.all > 0) && (
        <RecordCard summary={list?.summary} total={list?.total} result={filters.result} context={context} />
      )}

      {(!list || list.summary.all > 0) && (
        <div className="mt-4 space-y-2.5">
          <GameFilterBar filters={urlFilters} onChange={setFilters} />
          <ActiveFilters filters={filters} total={list?.total} all={list?.summary.all} onReset={reset} />
        </div>
      )}

      {sync.status === 'syncing' && <SyncStatusLine className="mt-4" />}

      {!list && (
        <div className="mt-6 overflow-hidden rounded-card surface-base divide-y divide-line-soft">
          {Array.from({ length: 6 }, (_, i) => (
            <GameRowSkeleton key={i} />
          ))}
        </div>
      )}

      {sections.map((s, si) => (
        <section key={s.key} className={si === 0 ? 'mt-2' : 'mt-1'} aria-label={s.label}>
          <SectionTitle label={s.label} record={list?.summary.groups[s.key]} />
          <div className="overflow-hidden rounded-card surface-base divide-y divide-line-soft">
            {s.items.map(({ game, analysis: a }) => {
              const i = rowIndex++;
              return (
                <GameRow
                  key={game.uuid}
                  game={game}
                  analysis={a}
                  analysing={analysis.currentGameId === game.uuid}
                  dateLabel={rowDate(game.endTime, s.key)}
                  settleDelay={i < 10 ? i * 28 : 0}
                />
              );
            })}
          </div>
        </section>
      ))}

      {list &&
        list.total === 0 &&
        (filtered ? (
          <EmptyState
            className="mt-2"
            icon={<FilterX />}
            title="No games match"
            body={q ? `No opponent matching “${q}” with these filters.` : 'Try a different result or time control.'}
            action={
              <Button variant="tinted" onClick={reset}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            className="mt-6"
            tone="accent"
            icon={<Inbox />}
            title={sync.status === 'syncing' ? 'Your games are on the way' : 'No games yet'}
            body={
              sync.status === 'syncing'
                ? 'They appear here month by month as they download.'
                : 'Play a game on Chess.com, then re-sync from Settings.'
            }
          />
        ))}

      {hasMore && (
        <div ref={sentinel} className="flex justify-center py-6 text-fg-subtle">
          <LoaderCircle className="size-5 animate-spin" aria-label="Loading more" />
        </div>
      )}
      {list && !hasMore && list.total > PAGE && (
        <p className="pt-6 text-center text-2xs text-fg-subtle">
          That's all {list.total.toLocaleString()} {filtered ? 'matching games' : 'games'}
        </p>
      )}
    </Page>
  );
}
