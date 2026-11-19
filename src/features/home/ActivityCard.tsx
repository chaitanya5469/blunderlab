import { useLiveQuery } from 'dexie-react-hooks';
import { AlertTriangle, Check, Cpu, Pause, Play, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, ErrorState, Progress } from '../../components/ui';
import { useAnalysisState, useSyncState } from '../../hooks/useServices';
import { cn } from '../../lib/cn';
import { db } from '../../lib/db';
import { formatAgo, pluralize } from '../../lib/format';
import { analysisService } from '../../services/analysisService';
import { syncService } from '../../services/syncService';
import { SyncStatusLine } from './SyncStatusLine';

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="-my-1.5 -mr-1.5 grid size-11 shrink-0 place-items-center rounded-full text-fg-muted pressable hover:bg-surface-3 hover:text-fg active:bg-surface-3 active:text-fg disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Row({ icon, title, subtitle, action, tone }: { icon: ReactNode; title: ReactNode; subtitle: ReactNode; action?: ReactNode; tone: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-[12px] edge-current [&_svg]:size-4.5', tone)}>{icon}</span>
      <div className="min-w-0 flex-1">
        {/* Wraps rather than truncating: a status cut to "Games up to…" says nothing. */}
        <p className="text-sm leading-snug font-semibold [overflow-wrap:anywhere]">{title}</p>
        <p className="mt-0.5 truncate text-xs text-fg-muted">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

/** Sync and engine status with their controls, on one card. */
export function ActivityCard({ lastSyncAt }: { lastSyncAt?: number }) {
  const sync = useSyncState();
  const an = useAnalysisState();
  const current = useLiveQuery(() => (an.currentGameId ? db.games.get(an.currentGameId) : undefined), [an.currentGameId]);
  const opponent = current ? (current.ownerColor === 'white' ? current.black : current.white).username : null;
  const syncing = sync.status === 'syncing';
  const running = an.status === 'running' && an.currentGameId;

  const analysisTitle = an.error
    ? 'Engine stopped'
    : an.paused
      ? 'Analysis paused'
      : running
        ? `Analysing vs ${opponent ?? '…'}`
        : an.status === 'starting'
          ? 'Starting engine'
          : an.queueLength === 0
            ? 'All games analysed'
            : 'Waiting';
  const analysedCount = useLiveQuery(() => db.games.where('analysisStatus').equals('done').count(), []);
  const analysisSubtitle =
    an.queueLength === 0 && !running
      ? analysedCount === undefined
        ? ' '
        : `${pluralize(analysedCount, 'game')} analysed`
      : `${pluralize(an.queueLength, 'game')} in queue${running && an.total ? ` · position ${an.done} of ${an.total}` : ''}`;

  return (
    <Card className="space-y-3.5">
      <Row
        tone={sync.status === 'error' ? 'bg-blunder/14 text-blunder' : 'bg-accent-soft text-accent-strong'}
        icon={syncing ? <RefreshCw className="animate-spin [animation-duration:2s]" /> : sync.status === 'error' ? <AlertTriangle /> : <Check />}
        title={syncing ? 'Syncing games' : sync.status === 'error' ? 'Sync failed' : 'Games up to date'}
        subtitle={
          syncing
            ? `${sync.newGames.toLocaleString()} new so far`
            : lastSyncAt
              ? `Synced ${formatAgo(lastSyncAt)}`
              : 'Not synced yet'
        }
        action={
          <IconButton label="Sync now" onClick={() => void syncService.sync()} disabled={syncing}>
            <RefreshCw className="size-4.5" />
          </IconButton>
        }
      />
      {syncing && <SyncStatusLine />}
      {sync.status === 'error' && sync.error && <ErrorState message={sync.error} onRetry={() => void syncService.sync()} />}

      <div className="-mx-4 h-px bg-line-soft" />

      <Row
        tone={an.error ? 'bg-blunder/14 text-blunder' : 'bg-best/14 text-best'}
        icon={<Cpu />}
        title={analysisTitle}
        subtitle={analysisSubtitle}
        action={
          an.queueLength > 0 && !an.error ? (
            an.paused ? (
              <IconButton label="Resume analysis" onClick={() => analysisService.resume()}>
                <Play className="size-4.5" />
              </IconButton>
            ) : (
              <IconButton label="Pause analysis" onClick={() => analysisService.pause()}>
                <Pause className="size-4.5" />
              </IconButton>
            )
          ) : undefined
        }
      />
      {running && !an.paused && <Progress value={an.total ? an.done / an.total : 0} barClassName="bg-best" label="Current game analysis" />}
      {an.error && <ErrorState message={an.error} onRetry={() => analysisService.retry()} />}
    </Card>
  );
}
