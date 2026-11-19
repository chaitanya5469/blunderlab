import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight, CircleCheck } from 'lucide-react';
import { Page } from '../../components/layout/Page';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button, EmptyState, Skeleton } from '../../components/ui';
import type { Puzzle } from '../../lib/types';
import { matches, usePuzzleFilters, type PuzzleFilters } from './model/filters';
import { trainingOrder, type AttemptInput } from './model/schedule';
import { clearSession, loadSession, saveSession, SET_SIZE, type TrainSession } from './model/session';
import { usePuzzles } from './model/usePuzzleData';
import { SolveView } from './solve/SolveView';
import { SetProgress } from './train/SetProgress';
import { SetSummary } from './train/SetSummary';

/** Due puzzles first, then new ones, within the filters, skipping anything already offered this session. */
const pick = (puzzles: Puzzle[], filters: PuzzleFilters, used: Set<string>, now: number) =>
  trainingOrder(puzzles.filter((p) => matches(p, filters) && !used.has(p.id)), now);

const freshSession = (ids: string[], used: string[], setNo: number): TrainSession => ({ ids, index: 0, results: {}, used: [...used, ...ids], setNo });

/**
 * Training in sets of three. Each set is fixed when it starts (so rescheduling a puzzle does not
 * reshuffle it); a solved puzzle moves straight on, and after the third a summary lets the owner
 * decide whether to take another set. Nothing starts by itself.
 */
export function TrainPage() {
  const [filters] = usePuzzleFilters();
  const { search } = useLocation();
  const navigate = useNavigate();
  const puzzles = usePuzzles();
  const [session, setSession] = useState<TrainSession | null>(null);
  const home = `/puzzles${search}`;

  // Start (or resume, after opening a puzzle from the summary or a reload) once the puzzles are loaded.
  useEffect(() => {
    if (!puzzles || session) return;
    const known = new Set(puzzles.map((p) => p.id));
    const saved = loadSession(search);
    if (saved && saved.ids.every((id) => known.has(id))) {
      // An attempt stored just before a reload counts as played.
      const index = saved.results[saved.ids[saved.index] ?? ''] ? saved.index + 1 : saved.index;
      setSession({ ...saved, index });
      return;
    }
    setSession(freshSession(pick(puzzles, filters, new Set(), Date.now()).slice(0, SET_SIZE).map((p) => p.id), [], 1));
  }, [puzzles, session, filters, search]);

  useEffect(() => {
    if (session && session.ids.length > 0) saveSession(search, session);
  }, [session, search]);

  const onAttempt = useCallback((id: string, a: AttemptInput, dueAt: number) => {
    setSession((s) => (s && !s.results[id] ? { ...s, results: { ...s.results, [id]: { result: a.result, wrongMoves: a.wrongMoves, hints: a.hints, dueAt } } } : s));
  }, []);

  const advance = useCallback((id: string) => {
    window.scrollTo({ top: 0 });
    setSession((s) => (s && s.ids[s.index] === id ? { ...s, index: s.index + 1 } : s));
  }, []);

  const done = () => {
    clearSession();
    navigate(home);
  };

  const byId = useMemo(() => new Map((puzzles ?? []).map((p) => [p.id, p])), [puzzles]);

  if (!puzzles || !session) {
    return (
      <Page className="space-y-3 pt-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="-mx-gutter aspect-square rounded-none" />
        <Skeleton className="h-16 w-full rounded-card" />
      </Page>
    );
  }

  if (session.ids.length === 0) {
    return (
      <Page>
        <PageHeader title="Train" backTo={home} />
        <EmptyState
          icon={<CircleCheck />}
          title="All caught up"
          body="Nothing is due and there are no new puzzles here. New ones appear as your games are analysed."
          action={<Button onClick={done}>Back to puzzles</Button>}
        />
      </Page>
    );
  }

  const current = byId.get(session.ids[session.index] ?? '');
  if (session.index >= session.ids.length || !current) {
    return (
      <SetSummary
        session={session}
        puzzles={puzzles}
        filters={filters}
        onNextSet={() => {
          const next = pick(puzzles, filters, new Set(session.used), Date.now()).slice(0, SET_SIZE).map((p) => p.id);
          if (next.length === 0) return;
          window.scrollTo({ top: 0 });
          setSession(freshSession(next, session.used, session.setNo + 1));
        }}
        onDone={done}
      />
    );
  }

  const last = session.index === session.ids.length - 1;
  return (
    <Page>
      <motion.div key={current.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}>
        <SolveView
          key={current.id}
          puzzle={current}
          backTo={home}
          title={
            <span className="tnum">
              {session.index + 1} <span className="text-fg-subtle">of {session.ids.length}</span>
            </span>
          }
          progress={<SetProgress index={session.index} results={session.ids.map((id) => session.results[id]?.result)} />}
          onAttempt={(a, dueAt) => onAttempt(current.id, a, dueAt)}
          onAdvance={() => advance(current.id)}
          actions={
            <Button variant="primary" size="lg" className="w-full" onClick={() => advance(current.id)} icon={<ArrowRight className="size-5" />}>
              {last ? 'See results' : 'Next puzzle'}
            </Button>
          }
        />
      </motion.div>
    </Page>
  );
}
