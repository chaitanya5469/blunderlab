import { useMemo, useRef, useState, type PointerEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { LineChart } from 'lucide-react';
import { Card, EmptyState, Skeleton, Tabs } from '../../components/ui';
import { cn } from '../../lib/cn';
import { db } from '../../lib/db';
import { capitalize } from '../../lib/format';

type Kind = 'rapid' | 'blitz' | 'bullet' | 'daily' | 'puzzles';
type Range = '1M' | '3M' | '1Y' | 'All';
interface Pt {
  t: number;
  v: number;
}

const KINDS: Kind[] = ['rapid', 'blitz', 'bullet', 'daily', 'puzzles'];
const RANGES: Range[] = ['1M', '3M', '1Y', 'All'];
const DAY = 86_400_000;
const RANGE_MS: Record<Range, number> = { '1M': 30 * DAY, '3M': 91 * DAY, '1Y': 365 * DAY, All: Infinity };

const W = 320;
const H = 150;
const PAD = { l: 6, r: 6, t: 10, b: 10 };

/** The owner's rating after each game (Chess.com, per time control) and after each Lichess puzzle. */
function useSeries() {
  return useLiveQuery(async () => {
    const out: Record<Kind, Pt[]> = { rapid: [], blitz: [], bullet: [], daily: [], puzzles: [] };
    const games = await db.games.orderBy('endTime').toArray();
    for (const g of games) {
      const k = g.timeClass as Kind;
      if (k === 'puzzles' || !(k in out)) continue;
      const r = g[g.ownerColor].rating;
      if (typeof r === 'number' && r > 0) out[k].push({ t: g.endTime, v: r });
    }
    const attempts = await db.lichessAttempts.orderBy('at').toArray();
    out.puzzles = attempts.map((a) => ({ t: a.at, v: a.ratingAfter }));
    return out;
  }, []);
}

const dateFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: '2-digit' });

/** Rating over time per time control (plus Lichess puzzles), with a range switch and tap/drag to read a point. */
export function RatingHistory() {
  const series = useSeries();
  const [kind, setKind] = useState<Kind | null>(null);
  const [range, setRange] = useState<Range>('3M');
  const [now] = useState(() => Date.now());
  const [cursor, setCursor] = useState<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);

  const available = useMemo(() => (series ? KINDS.filter((k) => series[k].length > 0) : []), [series]);
  const active: Kind | undefined = kind && available.includes(kind) ? kind : available.find((k) => (series?.[k].length ?? 0) >= 2) ?? available[0];

  const pts = useMemo(() => {
    if (!series || !active) return [];
    const cutoff = now - RANGE_MS[range];
    return series[active].filter((p) => p.t >= cutoff);
  }, [series, active, range, now]);

  if (!series) return <Skeleton className="h-72 rounded-card" />;
  const color = active === 'puzzles' ? 'var(--color-lichess)' : 'var(--color-accent)';

  if (!active) {
    return <EmptyState icon={<LineChart />} title="No rating history yet" body="Your rating over time appears once games are synced." />;
  }

  const options = available.map((k) => ({ value: k, label: k === 'puzzles' ? 'Puzzles' : capitalize(k) }));
  const chartable = pts.length >= 2;

  let body = null;
  if (chartable) {
    const first = pts[0]!;
    const last = pts[pts.length - 1]!;
    const t0 = first.t;
    const t1 = last.t;
    const tSpan = Math.max(1, t1 - t0);
    const lo = Math.min(...pts.map((p) => p.v));
    const hi = Math.max(...pts.map((p) => p.v));
    const vSpan = Math.max(1, hi - lo);
    const x = (t: number) => PAD.l + ((t - t0) / tSpan) * (W - PAD.l - PAD.r);
    const y = (v: number) => PAD.t + (1 - (v - lo) / vSpan) * (H - PAD.t - PAD.b);
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ');
    const area = `${line} L${x(t1).toFixed(1)} ${H - PAD.b} L${x(t0).toFixed(1)} ${H - PAD.b} Z`;
    const shown = (cursor !== null ? pts[cursor] : undefined) ?? last;
    const change = last.v - first.v;
    const iMin = pts.findIndex((p) => p.v === lo);
    const iMax = pts.findIndex((p) => p.v === hi);

    const pick = (e: PointerEvent) => {
      const r = svg.current?.getBoundingClientRect();
      if (!r) return;
      const tx = t0 + (((e.clientX - r.left) / r.width) * W - PAD.l) / (W - PAD.l - PAD.r) * tSpan;
      let best = 0;
      for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i]!.t - tx) < Math.abs(pts[best]!.t - tx)) best = i;
      setCursor(best);
    };

    body = (
      <>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-display text-[2.25rem] leading-none font-semibold tracking-[-0.04em] tnum" style={{ color }}>
              {Math.round(shown.v)}
            </p>
            <p className="mt-1.5 text-xs text-fg-subtle tnum">{dateFmt.format(shown.t)}</p>
          </div>
          <div className="text-right">
            <p className={cn('text-lg font-semibold tnum', change > 0 ? 'text-best' : change < 0 ? 'text-blunder' : 'text-fg-muted')}>
              {change > 0 ? '+' : change < 0 ? '−' : '±'}
              {Math.abs(Math.round(change))}
            </p>
            <p className="text-xs text-fg-subtle">{range === 'All' ? 'all time' : `past ${range}`}</p>
          </div>
        </div>

        <svg
          ref={svg}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${active === 'puzzles' ? 'Puzzle' : capitalize(active)} rating from ${Math.round(first.v)} to ${Math.round(last.v)}`}
          className="mt-3 block h-[150px] w-full touch-pan-y select-none"
          onPointerDown={pick}
          onPointerMove={(e) => (e.buttons || e.pointerType === 'touch') && pick(e)}
          onPointerLeave={() => setCursor(null)}
          onPointerCancel={() => setCursor(null)}
        >
          <defs>
            <linearGradient id="rh-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity="0.28" />
              <stop offset="1" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((f) => (
            <line key={f} x1={PAD.l} x2={W - PAD.r} y1={PAD.t + f * (H - PAD.t - PAD.b)} y2={PAD.t + f * (H - PAD.t - PAD.b)} stroke="var(--color-line-soft)" strokeWidth="1" />
          ))}
          <path d={area} fill="url(#rh-fill)" />
          <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {cursor !== null && pts[cursor] && (
            <line x1={x(pts[cursor].t)} x2={x(pts[cursor].t)} y1={PAD.t} y2={H - PAD.b} stroke="var(--color-line-strong)" strokeWidth="1" />
          )}
          <circle cx={x(shown.t)} cy={y(shown.v)} r="4.5" fill={color} stroke="var(--color-surface-1)" strokeWidth="2" />
        </svg>

        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            ['Low', lo, iMin],
            ['High', hi, iMax],
            ['Points', pts.length, -1],
          ].map(([label, val, i]) => (
            <button
              key={label as string}
              type="button"
              disabled={(i as number) < 0}
              onClick={() => setCursor(i as number)}
              className="rounded-[10px] bg-surface-2 px-2 py-2 text-left disabled:cursor-default"
            >
              <dt className="text-2xs font-semibold tracking-[0.08em] text-fg-subtle uppercase">{label as string}</dt>
              <dd className="mt-0.5 font-display text-base font-semibold tnum">{Math.round(val as number).toLocaleString()}</dd>
            </button>
          ))}
        </dl>
      </>
    );
  } else {
    body = (
      <p className="py-10 text-center text-sm text-fg-subtle">
        {series[active].length >= 2 ? `Fewer than 2 ${active === 'puzzles' ? 'puzzles' : 'games'} in this range. Try a longer one.` : `Not enough ${active === 'puzzles' ? 'puzzles' : 'games'} yet for a history.`}
      </p>
    );
  }

  return (
    <Card className="space-y-3.5">
      {options.length > 1 && (
        <Tabs
          label="Time control"
          options={options}
          value={active}
          onChange={(v) => {
            setKind(v);
            setCursor(null);
          }}
          indicatorClassName={active === 'puzzles' ? 'ring-1 ring-lichess/40' : undefined}
        />
      )}
      <div className="flex items-center gap-1" role="group" aria-label="Range">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={r === range}
            onClick={() => {
              setRange(r);
              setCursor(null);
            }}
            className={cn(
              'h-9 min-w-12 rounded-full px-3 text-xs font-semibold transition-colors',
              r === range ? 'bg-accent-soft text-accent-strong' : 'text-fg-subtle active:bg-white/[0.04]',
            )}
          >
            {r}
          </button>
        ))}
      </div>
      <div>{body}</div>
    </Card>
  );
}
