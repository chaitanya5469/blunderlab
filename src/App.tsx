import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { AppShell } from './components/layout/AppShell';
import { Splash } from './components/layout/Splash';
import { AchievementsPage } from './features/achievements/AchievementsPage';
import { GamesPage } from './features/games/GamesPage';
import { HomePage } from './features/home/HomePage';
import { LearnFeature } from './features/learn';
import { ProfilePage } from './features/profile/ProfilePage';
import { PuzzlesFeature } from './features/puzzles';
import { SettingsPage } from './features/settings/SettingsPage';

// Board-heavy screens load on demand to keep the first paint light.
const OnboardingPage = lazy(() => import('./features/onboarding/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));
const AnalyseFeature = lazy(() => import('./features/analyse').then((m) => ({ default: m.AnalyseFeature })));
const GameSummaryPage = lazy(() => import('./features/review/GameSummaryPage').then((m) => ({ default: m.GameSummaryPage })));
const GameReviewPage = lazy(() => import('./features/review/GameReviewPage').then((m) => ({ default: m.GameReviewPage })));

/** Hash routing so the app works from static files inside a WebView. */
export function App() {
  return (
    <HashRouter>
      <div className="relative mx-auto min-h-dvh max-w-app overflow-x-clip bg-canvas sm:border-x sm:border-line-soft">
        <Suspense fallback={<Splash />}>
          <Routes>
            <Route path="/welcome" element={<OnboardingPage />} />
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="games" element={<GamesPage />} />
              <Route path="games/:id" element={<GameSummaryPage />} />
              <Route path="games/:id/review" element={<GameReviewPage />} />
              <Route path="puzzles/*" element={<PuzzlesFeature />} />
              <Route path="learn/*" element={<LearnFeature />} />
              <Route path="analyse/*" element={<AnalyseFeature />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="achievements" element={<AchievementsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </div>
    </HashRouter>
  );
}
