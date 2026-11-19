import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db';
import { useStore } from '../../lib/store';
import type { AchievementUnlock } from '../../lib/types';
import { achievementsStore } from './model/service';

/** Progress snapshot (null until the first evaluation) and earned badges, most recent first. */
export function useAchievements() {
  const { snapshot } = useStore(achievementsStore);
  const unlocks = useLiveQuery(
    async () => (await db.achievements.toArray()).sort((a, b) => b.recordedAt - a.recordedAt || b.unlockedAt - a.unlockedAt),
    [],
  );
  return { snapshot, unlocks: unlocks as AchievementUnlock[] | undefined };
}
