import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Check, ChevronRight, CircleCheck, Eye, Lightbulb, Sparkles } from 'lucide-react';
import { Page } from '../../../components/layout/Page';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button, Card, SectionHeader } from '../../../components/ui';
import { cn } from '../../../lib/cn';
import { pluralize } from '../../../lib/format';
import { uciLineToSan } from '../../../lib/pgn';
import type { Puzzle, PuzzleResult } from '../../../lib/types';
import { matches, type PuzzleFilters } from '../model/filters';
import { comesBack, movePrefix, whenPhrase } from '../model/labels';
import { isNew, trainingOrder } from '../model/schedule';
import type { TrainSession } from '../model/session';
import { useNow } from '../model/usePuzzleData';
import { CoachBubble } from '../../coach/CoachBubble';
import { setEndLine, useCoach } from '../../coach/engine';
import { SetProgress } from './SetProgress';

interface SetSummaryProps {
  session: TrainSession;
  puzzles: Puzzle[];
  filters: PuzzleFilters;
  onNextSet: () => void;
  onDone: () => void;
}

const RESULT: Record<PuzzleResult, { label: string; icon: ReactNode; tile: string; text: string }> = {
  solved: { label: 'Clean', icon: <Check />, tile: 'bg-best/14 text-best', text: 'text-best' },
  assisted: { label: 'With help', icon: <Lightbulb />, tile: 'bg-inaccuracy/14 text-inaccuracy', text: 'text-inaccuracy' },
  failed: { label: 'Missed', icon: <Eye />, tile: 'bg-mistake/14 text-mistake', text: 'text-mistake' },
};

/** After the last puzzle of a set: how it went, one row per puzzle, and the owner's choice to go on. */
export function SetSummary({ session, puzzles, filters, onNextSet, onDone }: SetSummaryProps) {
  const now = useNow(puzzles);
  const rows = session.ids.flatMap((id) => {
    const puzzle = puzzles.find((p) => p.id === id);
    const entry = session.results[id];
    return puzzle ? [{ puzzle, entry }] : [];
  });
  const count = (r: PuzzleResult) => rows.filter((x) => x.entry?.result === r).length;
  const clean = count('solved');
  const assisted = count('assisted');
  const missed = rows.length - clean - assisted;
  const total = rows.length;

  const used = useMemo(() => new Set(session.used), [session.used]);
  const matching = puzzles.filter((p) => matches(p, filters));
  const waiting = trainingOrder(matching.filter((p) => !used.has(p.id)), now);
  const upcoming = matching.filter((p) => !isNew(p) && p.dueAt > now).reduce<number | null>((min, p) => (min === null ? p.dueAt : Math.min(min, p.dueAt)), null);

  const coach = useCoach();
  const coachLine = coach && total > 0 ? setEndLine(coach, `${session.ids.join(',')}`, clean, clean + assisted, total) : null;

  const headline = clean === total ? 'Clean set' : `${clean + assisted} of ${total} solved`;
  const parts = [
    clean && `${clean} first try`,
    assisted && `${assisted} with help`,
    missed && `${missed} missed`,
  ].filter(Boolean);

  return (
    <Page className="space-y-5">
      <PageHeader title="Set complete" subtitle={session.setNo > 1 ? `Set ${session.setNo} of this session` : undefined} />

      <Card className="relative overflow-hidden">
        <div className="absolute -top-16 -right-16 size-48 rounded-full bg-best/10 blur-2xl" aria-hidden />
        <div className="relative space-y-4">
          <div className="flex items-center gap-3.5">
            <motion.span
              className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-surface-2 text-best [&_svg]:size-6"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            >
              {clean === total ? <Sparkles /> : <CircleCheck />}
            </motion.span>
            <div className="min-w-0">
              <p className="font-display text-2xl leading-tight font-semibold tnum">{headline}</p>
              <p className="text-sm text-fg-muted">{parts.join(' · ')}</p>
            </div>
          </div>
          <SetProgress index={total} results={rows.map((r) => r.entry?.result)} />
          {coach && coachLine && <CoachBubble coach={coach} line={coachLine} />}
          <p className="text-sm text-fg-muted">
            {missed
              ? 'Missed puzzles come back in a few minutes. Clean solves return after a few days, then less often, until they stick.'
              : 'Solved puzzles come back after a few days, then less often, until they stick.'}
          </p>
        </div>
      </Card>

      <section>
        <SectionHeader title="This set" />
        <Card padded={false} className="p-1.5">
          {rows.map(({ puzzle, entry }) => (
            <SummaryRow key={puzzle.id} puzzle={puzzle} result={entry?.result} dueAt={entry?.dueAt} now={now} />
          ))}
        </Card>
      </section>

      <div className="flex flex-col gap-2">
        {waiting.length > 0 ? (
          <>
            <p className="px-1 text-center text-sm text-fg-muted tnum">
              {pluralize(waiting.length, 'puzzle')} waiting
            </p>
            <Button variant="primary" size="lg" onClick={onNextSet}>
              Next set
            </Button>
            <Button variant="ghost" size="lg" onClick={onDone}>
              Done
            </Button>
          </>
        ) : (
          <>
            <p className="px-1 text-center text-sm text-fg-muted">
              {upcoming !== null ? `Nothing left for now. Next review ${whenPhrase(upcoming, now)}.` : 'Nothing left for now. New puzzles appear as your games are analysed.'}
            </p>
            <Button variant="primary" size="lg" onClick={onDone}>
              Done
            </Button>
          </>
        )}
      </div>
    </Page>
  );
}

function SummaryRow({ puzzle, result, dueAt, now }: { puzzle: Puzzle; result: PuzzleResult | undefined; dueAt: number | undefined; now: number }) {
  const meta = result ? RESULT[result] : null;
  const best = useMemo(() => uciLineToSan(puzzle.fen, [puzzle.steps[0]!.accepted[0]!], 1)[0] ?? '', [puzzle]);
  const prefix = movePrefix(puzzle.moveNumber, puzzle.ownerColor);
  return (
    <Link
      to={`/puzzles/p/${encodeURIComponent(puzzle.id)}`}
      state={{ explain: true }}
      className="flex min-h-[4.5rem] items-center gap-3 rounded-control px-2 py-2.5 transition-colors hover:bg-surface-2 active:bg-surface-2"
    >
      <span className={cn('grid size-10 shrink-0 place-items-center rounded-control [&_svg]:size-5', meta?.tile ?? 'bg-surface-3 text-fg-muted')}>{meta?.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          vs {puzzle.opponent.username}
          <span className="font-normal text-fg-subtle"> · move {puzzle.moveNumber}</span>
        </p>
        <p className="truncate text-xs text-fg-muted tnum">
          You {prefix}
          {puzzle.played.san} · Best <span className="font-semibold text-best">{prefix}{best}</span>
        </p>
        <p className="truncate text-xs text-fg-subtle">
          {meta && <span className={cn('font-medium', meta.text)}>{meta.label}</span>}
          {dueAt !== undefined && <> · {comesBack(dueAt, now)}</>}
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-fg-subtle" aria-hidden />
    </Link>
  );
}
