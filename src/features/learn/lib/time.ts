const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** 'in 5 hours', 'tomorrow', 'in 3 days', 'in 2 weeks'. */
export function formatIn(at: number, now = Date.now()): string {
  const ms = at - now;
  if (ms <= 0) return 'now';
  if (ms < 20 * HOUR) {
    const h = Math.max(1, Math.round(ms / HOUR));
    return `in ${h} hour${h === 1 ? '' : 's'}`;
  }
  const days = Math.round(ms / DAY);
  if (days <= 1) return 'tomorrow';
  if (days < 14) return `in ${days} days`;
  return `in ${Math.round(days / 7)} weeks`;
}
