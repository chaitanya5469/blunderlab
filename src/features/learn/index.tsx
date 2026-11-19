import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Route, Routes } from 'react-router';
import { Page } from '../../components/layout/Page';
import { Skeleton } from '../../components/ui';
import { lessonStatus, useNow, useProgress } from './lib/progress';
import type { Lesson } from './types';

// Lesson content and boards load on demand, keeping them out of the first paint.
const LearnHomePage = lazy(() => import('./home/LearnHomePage').then((m) => ({ default: m.LearnHomePage })));
const LessonPage = lazy(() => import('./lesson/LessonPage').then((m) => ({ default: m.LessonPage })));
const LessonPlayerPage = lazy(() => import('./player/LessonPlayerPage').then((m) => ({ default: m.LessonPlayerPage })));

/**
 * Learn feature root, mounted by the app at `/learn/*` (with the tab bar).
 * - `#/learn`                              course home: continue, due, recommended, your openings, all lessons
 * - `#/learn/:lessonId`                    one opening or trap: overview and its lines
 * - `#/learn/:lessonId/play/:key?mode=…`   play a line in Learn (guided) or Practice (from memory) mode
 * Lesson data lives in `content/` and is checked by `npm run validate:lessons`.
 */
export function LearnFeature() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route index element={<LearnHomePage />} />
        <Route path=":lessonId" element={<LessonPage />} />
        <Route path=":lessonId/play/:key" element={<LessonPlayerPage />} />
      </Routes>
    </Suspense>
  );
}

function Loading() {
  return (
    <Page className="space-y-5 pt-5">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-56 w-full rounded-card" />
      <Skeleton className="h-40 w-full rounded-card" />
    </Page>
  );
}

export interface LearnSummary {
  /** Lessons whose every line has been practised cleanly from memory. */
  completed: number;
  total: number;
  /** Lessons with at least one line due for review. */
  dueForReview: number;
}

/** Live Learn numbers for other screens (e.g. Home). Undefined while the course loads. */
export function useLearnSummary(): LearnSummary | undefined {
  const progress = useProgress();
  const now = useNow();
  const [lessons, setLessons] = useState<Lesson[]>();
  useEffect(() => {
    let live = true;
    void import('./lib/catalog').then((m) => live && setLessons(m.LESSONS));
    return () => {
      live = false;
    };
  }, []);
  return useMemo(() => {
    if (!lessons) return undefined;
    const statuses = lessons.map((l) => lessonStatus(l, progress, now));
    return { completed: statuses.filter((s) => s.completed).length, total: lessons.length, dueForReview: statuses.filter((s) => s.due > 0).length };
  }, [lessons, progress, now]);
}
