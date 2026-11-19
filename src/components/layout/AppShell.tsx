import { useEffect } from 'react';
import { Navigate, useLocation, useOutlet } from 'react-router';
import { MotionConfig, motion } from 'motion/react';
import { startAchievements } from '../../features/achievements/model/service';
import { UnlockToast } from '../../features/achievements/UnlockToast';
import { runLaunchPrompt } from '../../features/guide/launch';
import { TipSheet } from '../../features/guide/TipSheet';
import { Walkthrough } from '../../features/guide/Walkthrough';
import { useProfile } from '../../hooks/useProfile';
import { analysisService } from '../../services/analysisService';
import { reclassifyAnalyses } from '../../services/reclassify';
import { syncService } from '../../services/syncService';
import { cn } from '../../lib/cn';
import { Splash } from './Splash';
import { TabBar } from './TabBar';

/** Detail screens that hide the tab bar to give content the full height. */
const isDetailRoute = (path: string) => /^\/games\/[^/]+/.test(path) || path.startsWith('/analyse') || path === '/settings' || path === '/achievements' || path === '/profile';

/**
 * Shell for all signed-in routes: guards onboarding, starts the app-level services,
 * renders the tab bar and a subtle enter transition per page.
 */
export function AppShell() {
  const profile = useProfile();
  const location = useLocation();
  const outlet = useOutlet();
  const detail = isDetailRoute(location.pathname);
  const section = location.pathname.split('/')[1] ?? '';

  useEffect(() => {
    if (!profile) return;
    analysisService.start();
    syncService.startAutoSync();
  }, [profile]);

  const signedIn = !!profile;
  useEffect(() => {
    if (!signedIn) return;
    // One-time reclassification of analyses stored with older rules or accuracy formula, after first paint.
    const t = window.setTimeout(() => {
      reclassifyAnalyses().catch((e) => console.warn('Reclassification failed', e));
    }, 1500);
    return () => window.clearTimeout(t);
  }, [signedIn]);

  useEffect(() => {
    if (signedIn) startAchievements();
  }, [signedIn]);

  // This launch's first-run walkthrough or chess tip, once the owner is on Home.
  const onHome = location.pathname === '/';
  useEffect(() => {
    if (!signedIn || !onHome) return;
    const t = window.setTimeout(runLaunchPrompt, 700);
    return () => window.clearTimeout(t);
  }, [signedIn, onHome]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  if (profile === undefined) return <Splash />;
  if (profile === null) return <Navigate to="/welcome" replace />;

  return (
    // reducedMotion="user": transform and layout animations are skipped when the OS asks for less motion.
    <MotionConfig reducedMotion="user">
      <div className={cn('pt-safe', !detail && 'pb-[calc(var(--spacing-tabbar)+env(safe-area-inset-bottom))]')}>
        <motion.main
          key={detail ? location.pathname : section}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {outlet}
        </motion.main>
        {!detail && <TabBar />}
        <Walkthrough onHome={onHome} />
        <TipSheet />
        <UnlockToast />
        {/* Status-bar scrim (edge-to-edge Android): content scrolls under it, sticky headers stop below it. */}
        <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-30 mx-auto h-[env(safe-area-inset-top)] max-w-app bg-canvas" />
      </div>
    </MotionConfig>
  );
}
