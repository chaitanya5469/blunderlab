import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Check, ChevronRight, Flame, Moon } from 'lucide-react';
import { Card, Progress, Skeleton } from '../../components/ui';
import { cn } from '../../lib/cn';
import type { ProgressSnapshot } from './model/snapshot';
import { dayStart, type DayState } from './model/streak';

const weekday = (index: number) => new Date(dayStart(index)).toLocaleDateString(undefined, { weekday: 'narrow' });

function DayDot({ state, label }: { state: DayState; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5">
      <span
        className={cn(
          'grid size-7 place-items-center rounded-full text-[0.625rem] font-semibold',
          state === 'done' && 'bg-mistake text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_4px_12px_-4px_var(--color-mistake)]',
          state === 'rest' && 'border border-dashed border-mistake/60 text-mistake',
          state === 'missed' && 'bg-surface-3/70',
          state === 'today' && 'border-2 border-mistake/70 bg-mistake/10',
        )}
      >
        {state === 'done' && <Check className="size-3.5" strokeWidth={3} />}
        {state === 'rest' && <Moon className="size-3" />}
      </span>
      <span className={cn('text-2xs', state === 'today' ? 'font-semibold text-fg' : 'text-fg-subtle')}>{label}</span>
    </div>
  );
}

function headline(s: ProgressSnapshot['streak']) {
  if (s.current === 0) return s.todayDone ? 'Streak started' : 'Start a streak';
  return `${s.current}-day streak`;
}

function subline(s: ProgressSnapshot['streak']) {
  if (s.todayDone) return s.current >= s.best && s.best > 1 ? 'Done for today · your best yet' : 'Done for today. See you tomorrow.';
  if (s.current === 0) return 'Solve a puzzle or play a lesson line today.';
  return 'Keep it going today: one puzzle or lesson line.';
}

/** Home: the daily streak with this week's days, and progress to the next title. */
export function StreakCard({ snapshot, className }: { snapshot: ProgressSnapshot | null; className?: string }) {
  if (!snapshot) return <Skeleton className={cn('min-h-[188px] rounded-card', className)} />;
  const { streak, title } = snapshot;
  const lit = streak.todayDone;
  return (
    <Link to="/achievements" className={cn('flex flex-col rounded-card pressable', className)} aria-label="Streak, title and badges">
      <Card variant="feature" tint={lit ? 'mistake' : 'accent'} className="flex flex-1 flex-col justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <span
            className={cn(
              'relative grid size-12 shrink-0 place-items-center rounded-[16px] edge-current',
              lit ? 'bg-mistake/16 text-mistake' : 'bg-surface-3 text-fg-subtle',
            )}
          >
            {lit && <span className="absolute inset-0 rounded-[16px] bg-[radial-gradient(circle_at_50%_70%,rgb(242_146_76/0.35),transparent_70%)]" aria-hidden />}
            <motion.span
              className="relative"
              animate={lit ? { scale: [1, 1.08, 1], rotate: [0, -3, 2, 0] } : undefined}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Flame className="size-6" fill={lit ? 'currentColor' : 'none'} fillOpacity={0.25} strokeWidth={2} />
            </motion.span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl leading-tight font-semibold tracking-[-0.02em] tnum">{headline(streak)}</p>
            <p className={cn('mt-0.5 text-xs', lit ? 'text-fg-muted' : 'font-medium text-mistake')}>{subline(streak)}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xs font-semibold tracking-[0.12em] text-fg-subtle uppercase">Best</p>
            <p className="font-display text-lg leading-tight font-semibold tnum">{streak.best}</p>
          </div>
        </div>

        <div className="flex gap-1" aria-label="This week">
          {streak.week.map((d) => (
            <DayDot key={d.index} state={d.state} label={weekday(d.index)} />
          ))}
        </div>

        <div>
          <div className="-mx-4 mb-4 h-px bg-line-soft" aria-hidden />
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <p className="min-w-0 text-sm font-semibold">{title.title.name}</p>
            <p className="flex shrink-0 items-center gap-0.5 text-xs text-fg-muted tnum">
              {title.next ? `${title.toNext.toLocaleString()} XP to ${title.next.name}` : `${title.xp.toLocaleString()} XP`}
              <ChevronRight className="size-3.5 text-fg-subtle" aria-hidden />
            </p>
          </div>
          <Progress value={title.fraction} label="Progress to the next title" />
        </div>
      </Card>
    </Link>
  );
}
