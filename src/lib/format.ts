const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** '2025/03' -> 'March 2025' */
export function formatMonth(month: string): string {
  const [y, m] = month.split('/');
  return `${MONTHS[Number(m) - 1] ?? m} ${y}`;
}

const dayMs = 24 * 60 * 60 * 1000;

/** 'Today', 'Yesterday', '3 days ago', or a short date. */
export function formatRelativeDate(ms: number, now = Date.now()): string {
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  if (ms >= startOfToday) return 'Today';
  if (ms >= startOfToday - dayMs) return 'Yesterday';
  const days = Math.floor((startOfToday - ms) / dayMs) + 1;
  if (days < 7) return `${days} days ago`;
  const d = new Date(ms);
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) });
}

/** 'just now', '5 min ago', '3 h ago', then a relative date. */
export function formatAgo(ms: number, now = Date.now()): string {
  const s = Math.max(0, (now - ms) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return formatRelativeDate(ms, now).toLowerCase();
}

export function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/** '180+2' -> '3+2', '600' -> '10 min', '1/86400' -> '1 day' */
export function formatTimeControl(tc: string): string {
  if (tc.includes('/')) {
    const days = Math.round(Number(tc.split('/')[1]) / 86400);
    return `${days} day${days === 1 ? '' : 's'}`;
  }
  const [base, inc] = tc.split('+').map(Number);
  if (!base) return tc;
  const min = base >= 60 ? `${+(base / 60).toFixed(1)}` : `${base}s`;
  return inc ? `${min}+${inc}` : `${min} min`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 ? 1 : 0)} ${units[i]}`;
}

/** '1 game', '3 games', '1,204 games'. Pass `plural` for irregular nouns. */
export function pluralize(n: number, noun: string, plural = `${noun}s`): string {
  return `${n.toLocaleString()} ${n === 1 ? noun : plural}`;
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Time of day in the user's locale, e.g. '14:32' or '2:32 PM'. */
export function formatClock(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** Weekday + day, e.g. 'Tue 3'; used inside month groups. */
export function formatDayShort(ms: number): string {
  const d = new Date(ms);
  return `${d.toLocaleDateString(undefined, { weekday: 'short' })} ${d.getDate()}`;
}

export interface DateGroup {
  /** Stable key: 'today', 'yesterday', 'week', or 'YYYY-MM'. */
  key: string;
  label: string;
}

/**
 * Bucket for grouping a newest-first list: Today, Yesterday, This week (the five days
 * before yesterday), then calendar months ('October', or 'October 2025' in other years).
 */
export function dateGroup(ms: number, now = Date.now()): DateGroup {
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  if (ms >= startOfToday) return { key: 'today', label: 'Today' };
  if (ms >= startOfToday - dayMs) return { key: 'yesterday', label: 'Yesterday' };
  if (ms >= startOfToday - 6 * dayMs) return { key: 'week', label: 'This week' };
  const d = new Date(ms);
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return {
    key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    label: sameYear ? (MONTHS[d.getMonth()] ?? '') : `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
  };
}

/** 'Sicilian Defense: Najdorf Variation, English Attack' -> ['Sicilian Defense', 'Najdorf Variation, English Attack']. */
export function splitOpening(name: string): [family: string, variation: string | undefined] {
  const i = name.indexOf(':');
  if (i < 0) return [name, undefined];
  return [name.slice(0, i).trim(), name.slice(i + 1).trim() || undefined];
}
