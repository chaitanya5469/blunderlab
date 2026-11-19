import { useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate } from 'react-router';
import { ChevronRight, Compass, Database, Eraser, Gauge, Lightbulb, MousePointerClick, Palette, RefreshCw, Trophy, UserRound, Volume2 } from 'lucide-react';
import { Logo } from '../../components/layout/Logo';
import { Page } from '../../components/layout/Page';
import { PageHeader } from '../../components/layout/PageHeader';
import { Avatar, Button, Card, SectionHeader, Sheet, Tabs } from '../../components/ui';
import { cn } from '../../lib/cn';
import { useProfile } from '../../hooks/useProfile';
import { useSettings, useSyncState } from '../../hooks/useServices';
import { DEPTH_PRESETS } from '../../lib/constants';
import { db } from '../../lib/db';
import { formatAgo, formatBytes, pluralize } from '../../lib/format';
import { settingsStore } from '../../lib/settings';
import { PIECE_SETS } from '../../lib/boardStyle';
import { playMoveSound } from '../../lib/sound';
import { BoardStylePicker } from './BoardStylePicker';
import { CoachNote, CoachPicker } from '../coach/CoachPicker';
import { COACHES } from '../coach/engine';
import type { CoachChoice } from '../coach/types';
import { useStore } from '../../lib/store';
import { replayWalkthrough, tipStore } from '../guide/launch';
import type { AnalysisDepthPreset } from '../../lib/types';
import { analysisService } from '../../services/analysisService';
import { syncService } from '../../services/syncService';

const DEPTH_OPTIONS = (Object.keys(DEPTH_PRESETS) as AnalysisDepthPreset[]).map((value) => ({ value, label: DEPTH_PRESETS[value].label }));

const ICON_TONE = {
  neutral: 'bg-surface-3 text-fg-muted',
  accent: 'bg-accent-soft text-accent-strong',
  danger: 'bg-blunder/12 text-blunder',
} as const;

function Row({
  icon,
  title,
  body,
  action,
  tone = 'neutral',
}: {
  icon: ReactNode;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  tone?: keyof typeof ICON_TONE;
}) {
  return (
    <div className="flex min-h-11 items-center gap-3">
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-[12px] edge-current [&_svg]:size-4.5', ICON_TONE[tone])}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {body && <p className="mt-0.5 text-xs text-fg-muted">{body}</p>}
      </div>
      {action}
    </div>
  );
}

/** On/off switch for a settings row. */
function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="grid h-11 shrink-0 place-items-center px-0.5"
    >
      <span className={cn('relative h-7 w-12 rounded-full border transition-colors', checked ? 'border-accent/40 bg-accent' : 'border-line-strong bg-surface-3 shadow-recessed')}>
        <span
          className={cn(
            'absolute top-0.5 left-0.5 size-5.5 rounded-full shadow-control transition-transform duration-200',
            checked ? 'translate-x-5 bg-accent-ink' : 'bg-fg-muted',
          )}
        />
      </span>
    </button>
  );
}

/** Full-bleed hairline between rows of a padded card. */
const Divider = () => <div className="-mx-4 h-px bg-line-soft" aria-hidden />;

function useStorage() {
  return useLiveQuery(async () => {
    const [games, analysed, estimate] = await Promise.all([
      db.games.count(),
      db.analyses.count(),
      navigator.storage?.estimate?.().catch(() => undefined) ?? Promise.resolve(undefined),
    ]);
    return { games, analysed, usage: estimate?.usage, quota: estimate?.quota };
  }, []);
}

export function SettingsPage() {
  const profile = useProfile();
  const settings = useSettings();
  const sync = useSyncState();
  const storage = useStorage();
  const [sheet, setSheet] = useState<'username' | 'clear' | null>(null);
  const [busy, setBusy] = useState(false);
  const tips = useStore(tipStore);
  const navigate = useNavigate();

  const changeUsername = async () => {
    setBusy(true);
    await Promise.all([analysisService.shutdown(), syncService.cancel()]);
    await db.delete();
    window.location.hash = '#/welcome';
    window.location.reload();
  };

  const clearAnalysis = async () => {
    setBusy(true);
    await analysisService.clearAll();
    setBusy(false);
    setSheet(null);
  };

  return (
    <Page className="space-y-6">
      <PageHeader title="Settings" backTo="/" />

      <section>
        <SectionHeader title="Account" />
        <Card variant="feature" className="space-y-4">
          {profile && (
            <div className="flex items-center gap-3.5">
              <div className="shrink-0 rounded-full bg-[linear-gradient(160deg,rgb(147_176_255/0.6),rgb(111_149_255/0.06))] p-[1.5px]">
                <div className="rounded-full bg-surface-1 p-[2px]">
                  <Avatar src={profile.avatar} name={profile.displayName} className="size-13 text-lg" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-xl leading-tight font-semibold tracking-[-0.02em]">{profile.displayName}</p>
                <p className="mt-0.5 truncate text-xs text-fg-muted">Chess.com · {profile.name ?? profile.username}</p>
              </div>
            </div>
          )}
          <Button className="w-full" icon={<UserRound className="size-4" />} onClick={() => setSheet('username')}>
            Change username
          </Button>
        </Card>
      </section>

      <section>
        <SectionHeader title="Progress and help" />
        <Card className="space-y-4">
          <Link to="/achievements" className="-m-2 block rounded-[14px] p-2 press-row">
            <Row
              icon={<Trophy />}
              tone="accent"
              title="Achievements"
              body="Streak, titles and badges"
              action={<ChevronRight className="size-5 text-fg-subtle" aria-hidden />}
            />
          </Link>
          <Divider />
          <Row
            icon={<Compass />}
            title="Replay walkthrough"
            body="The quick tour of BlunderLab"
            action={
              <Button
                onClick={() => {
                  navigate('/');
                  replayWalkthrough();
                }}
              >
                Replay
              </Button>
            }
          />
          <Divider />
          <Row
            icon={<Lightbulb />}
            title="Chess tips"
            body="A fact or tip when you open the app"
            action={<Switch label="Chess tips" checked={tips.enabled} onChange={(enabled) => tipStore.set({ enabled })} />}
          />
        </Card>
      </section>

      <section>
        <SectionHeader title="Coach" />
        <Card className="space-y-3">
          <p className="text-xs text-fg-muted">A historical player comments on your reviewed games and puzzles. Tap his avatar there to switch.</p>
          <CoachPicker value={settings.coach as CoachChoice} onChange={(coach) => settingsStore.set({ coach })} />
          <CoachNote className="px-1" />
        </Card>
      </section>

      <section>
        <SectionHeader title="Board and sound" />
        <Card className="space-y-4">
          <Row icon={<Palette />} tone="accent" title="Board style" body="Colours and pieces for every board" />
          <BoardStylePicker />
          <Divider />
          <Row
            icon={<MousePointerClick />}
            title="Show legal moves"
            body="Dots on the squares a selected piece can reach"
            action={<Switch label="Show legal moves" checked={settings.showLegalMoves} onChange={(showLegalMoves) => settingsStore.set({ showLegalMoves })} />}
          />
          <Divider />
          <Row
            icon={<Volume2 />}
            title="Move sounds"
            body="Moves, captures, checks and great moves"
            action={
              <Switch
                label="Move sounds"
                checked={settings.sound}
                onChange={(sound) => {
                  settingsStore.set({ sound });
                  if (sound) playMoveSound('move');
                }}
              />
            }
          />
          {settings.sound && (
            <label className="flex items-center gap-3 pl-13">
              <span className="sr-only">Volume</span>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={settings.soundVolume}
                onChange={(e) => settingsStore.set({ soundVolume: Number(e.target.value) })}
                onPointerUp={() => playMoveSound('capture')}
                onKeyUp={() => playMoveSound('capture')}
                className="h-11 min-w-0 flex-1 accent-[var(--color-accent)]"
                aria-label="Volume"
              />
              <span className="w-9 text-right text-xs text-fg-subtle tnum">{Math.round(settings.soundVolume * 100)}%</span>
            </label>
          )}
        </Card>
      </section>

      <section>
        <SectionHeader title="Analysis" />
        <Card className="space-y-4">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-best/12 text-best edge-current [&_svg]:size-4.5">
                <Gauge />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Analysis depth</p>
                <p className="mt-0.5 text-xs text-fg-muted">{DEPTH_PRESETS[settings.depthPreset].hint}</p>
              </div>
            </div>
            <Tabs
              label="Analysis depth"
              options={DEPTH_OPTIONS}
              value={settings.depthPreset}
              onChange={(depthPreset) => settingsStore.set({ depthPreset })}
            />
            <p className="mt-2 px-1 text-xs text-fg-subtle">Applies to games analysed from now on.</p>
          </div>
          <Divider />
          <Row
            icon={<Eraser />}
            tone="danger"
            title="Clear analysis"
            body={storage ? `${pluralize(storage.analysed, 'game')} analysed` : ' '}
            action={
              <Button variant="danger" onClick={() => setSheet('clear')} disabled={!storage?.analysed}>
                Clear
              </Button>
            }
          />
        </Card>
      </section>

      <section>
        <SectionHeader title="Data" />
        <Card className="space-y-4">
          <Row
            icon={<RefreshCw className={cn(sync.status === 'syncing' && 'animate-spin [animation-duration:2s]')} />}
            tone="accent"
            title="Sync with Chess.com"
            body={sync.status === 'syncing' ? 'Syncing…' : profile?.lastSyncAt ? `Last synced ${formatAgo(profile.lastSyncAt)}` : 'Never synced'}
            action={
              <Button onClick={() => void syncService.sync()} loading={sync.status === 'syncing'}>
                Re-sync
              </Button>
            }
          />
          <Divider />
          <Row
            icon={<Database />}
            title="Storage used"
            body={
              storage
                ? `${pluralize(storage.games, 'game')}${storage.usage !== undefined ? ` · ${formatBytes(storage.usage)} on this device` : ''}`
                : ' '
            }
          />
        </Card>
      </section>

      <div className="flex flex-col items-center gap-3 pt-2">
        <Logo className="size-8" />
        <p className="px-1 text-center text-xs leading-relaxed text-fg-subtle">
          BlunderLab · everything stays on this device.
          <br />
          Analysis by Stockfish 19 (lite, GPLv3). Games from the Chess.com public API.
          <br />
          Lichess puzzles from the{' '}
          <a href="https://database.lichess.org/#puzzles" target="_blank" rel="noopener noreferrer" className="text-lichess underline-offset-2 hover:underline">
            Lichess puzzle database
          </a>{' '}
          (CC0) and the{' '}
          <a href="https://lichess.org/api" target="_blank" rel="noopener noreferrer" className="text-lichess underline-offset-2 hover:underline">
            Lichess API
          </a>
          . Thank you, Lichess.
        </p>
        <details className="w-full px-1 text-center text-xs text-fg-subtle">
          <summary className="cursor-pointer py-2 underline-offset-2 hover:underline">Piece set credits</summary>
          <p className="mt-1 mb-2 leading-relaxed">
            Piece sets from the Lichess source (lichess-org/lila), used under their licences. Move sounds are synthesised in the app.
          </p>
          <ul className="space-y-1 text-left">
            {PIECE_SETS.map((p) => (
              <li key={p.id} className="flex justify-between gap-3">
                <span>
                  <span className="text-fg-muted">{p.name}</span> · {p.author}
                </span>
                <span className="shrink-0">{p.licence}</span>
              </li>
            ))}
          </ul>
        </details>
        <details className="w-full px-1 text-center text-xs text-fg-subtle">
          <summary className="cursor-pointer py-2 underline-offset-2 hover:underline">Coach credits</summary>
          <p className="mt-1 mb-2 leading-relaxed">
            Coach avatars are cartoon illustrations drawn for BlunderLab. All dialogue is original writing in the style of each player; only the
            lines below are their real words.
          </p>
          <ul className="space-y-2 text-left">
            {COACHES.flatMap((c) =>
              c.quotes.map((q) => (
                <li key={q.text}>
                  <span className="text-fg-muted">“{q.text}”</span> · {c.name}. {q.source}
                </li>
              )),
            )}
          </ul>
        </details>
      </div>

      <Sheet
        open={sheet === 'username'}
        onClose={() => !busy && setSheet(null)}
        title="Change username?"
        description="This deletes every synced game and all analysis stored on this device. You'll set up BlunderLab again with the new account."
        actions={
          <>
            <Button variant="danger" size="lg" loading={busy} onClick={changeUsername}>
              Delete local data and continue
            </Button>
            <Button variant="ghost" size="lg" disabled={busy} onClick={() => setSheet(null)}>
              Cancel
            </Button>
          </>
        }
      />
      <Sheet
        open={sheet === 'clear'}
        onClose={() => !busy && setSheet(null)}
        title="Clear all analysis?"
        description="Your games stay. Every game goes back into the analysis queue and will be re-analysed at the current depth."
        actions={
          <>
            <Button variant="danger" size="lg" loading={busy} onClick={clearAnalysis}>
              Clear analysis
            </Button>
            <Button variant="ghost" size="lg" disabled={busy} onClick={() => setSheet(null)}>
              Cancel
            </Button>
          </>
        }
      />
    </Page>
  );
}
