import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { useProfile } from '../../hooks/useProfile';
import { db } from '../../lib/db';
import type { Profile } from '../../lib/types';
import { syncService } from '../../services/syncService';
import { Logo } from '../../components/layout/Logo';
import { Splash } from '../../components/layout/Splash';
import { HeroBoard } from './HeroBoard';
import { ProfileConfirm } from './ProfileConfirm';
import { UsernameForm } from './UsernameForm';

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
};

/** First launch: ask for the Chess.com username, confirm the profile, start syncing. */
export function OnboardingPage() {
  const existing = useProfile();
  const navigate = useNavigate();
  const [found, setFound] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  if (existing === undefined) return <Splash />;
  if (existing && !saving) return <Navigate to="/" replace />;

  const confirm = async () => {
    if (!found) return;
    setSaving(true);
    await db.profile.put({ ...found, createdAt: Date.now() });
    void syncService.sync();
    navigate('/', { replace: true });
  };

  return (
    <div className="flex min-h-dvh flex-col px-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <div className="flex items-center gap-2.5">
        <Logo className="size-8" />
        <span className="font-display text-lg font-semibold tracking-tight">BlunderLab</span>
      </div>

      <AnimatePresence mode="wait">
        {found ? (
          <motion.div key="confirm" {...fade} className="flex flex-1 flex-col justify-center py-8">
            <ProfileConfirm profile={found} saving={saving} onConfirm={confirm} onBack={() => setFound(null)} />
          </motion.div>
        ) : (
          <motion.div key="ask" {...fade} className="flex flex-1 flex-col py-8">
            <HeroBoard />
            <h1 className="mt-9 text-hero font-semibold">
              Every blunder is
              <br />a <span className="text-accent">lesson</span>.
            </h1>
            <p className="mt-3 max-w-[34ch] text-fg-muted">
              BlunderLab pulls in your Chess.com games, reviews each one with Stockfish on this device, and turns your
              own mistakes into training.
            </p>
            <div className="mt-auto pt-8">
              <UsernameForm onFound={setFound} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
