import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import type { Profile } from '../lib/types';

/** The owner's profile: undefined while loading, null when not onboarded. */
export function useProfile(): Profile | null | undefined {
  return useLiveQuery(async () => (await db.profile.get('owner')) ?? null, [], undefined);
}
