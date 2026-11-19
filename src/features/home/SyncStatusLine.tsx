import { CloudDownload } from 'lucide-react';
import { Progress } from '../../components/ui';
import { useSyncState } from '../../hooks/useServices';
import { pluralize } from '../../lib/format';
import { cn } from '../../lib/cn';

/** Live sync progress, e.g. "March 2025 · 412 games", with a month-based progress bar. */
export function SyncStatusLine({ className }: { className?: string }) {
  const s = useSyncState();
  if (s.status !== 'syncing') return null;
  const value = s.monthsTotal ? s.monthsDone / s.monthsTotal : undefined;
  return (
    <div className={cn('space-y-2', className)} aria-live="polite">
      <div className="flex items-center gap-2 text-sm">
        <CloudDownload className="size-4 shrink-0 text-accent-strong" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-fg-muted">
          {s.lastMonth ? (
            <>
              <span className="text-fg">{s.lastMonth.label}</span>
              <span className="tnum"> · {pluralize(s.lastMonth.games, 'game')}</span>
            </>
          ) : s.fetchingMonth ? (
            `Fetching ${s.fetchingMonth}`
          ) : (
            'Finding your archives'
          )}
        </span>
        {s.monthsTotal > 0 && (
          <span className="shrink-0 text-xs text-fg-subtle tnum">
            {s.monthsDone}/{s.monthsTotal} months
          </span>
        )}
      </div>
      <Progress value={value} label="Sync progress" />
    </div>
  );
}
