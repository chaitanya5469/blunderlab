import { createStore } from '../../lib/store';

/**
 * First-run walkthrough and launch tips: device-local flags in localStorage, plus the decision
 * for this app launch, made once when this module loads (a cold start, not a screen change).
 *
 * - The walkthrough shows until it is finished or skipped.
 * - A tip shows at most once per launch, only when the walkthrough was already done before this
 *   launch began (so never on the run where the walkthrough shows, nor during onboarding).
 */

const GUIDE_KEY = 'blunderlab:guide:v1';
const TIPS_KEY = 'blunderlab:tips:v1';

interface GuidePrefs {
  walkthroughDone: boolean;
}
interface TipPrefs {
  enabled: boolean;
  /** Next tip to show (index into TIPS, wraps). */
  next: number;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<T>) } : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the flag lasts for this session */
  }
}

const doneAtLaunch = read<GuidePrefs>(GUIDE_KEY, { walkthroughDone: false }).walkthroughDone;

export const guideStore = createStore<{ walkthrough: boolean; step: number }>({ walkthrough: false, step: 0 });
export const tipStore = createStore<TipPrefs & { open: boolean }>({
  ...read<TipPrefs>(TIPS_KEY, { enabled: true, next: -1 }),
  open: false,
});
tipStore.subscribe(() => {
  const { enabled, next } = tipStore.get();
  write(TIPS_KEY, { enabled, next });
});

let launchHandled = false;

/** Called by the signed-in shell once the owner is on Home: starts this launch's walkthrough or tip. */
export function runLaunchPrompt() {
  if (launchHandled) return;
  launchHandled = true;
  if (!read<GuidePrefs>(GUIDE_KEY, { walkthroughDone: false }).walkthroughDone) {
    guideStore.set({ walkthrough: true, step: 0 });
    return;
  }
  if (doneAtLaunch && tipStore.get().enabled) tipStore.set({ open: true });
}

export function finishWalkthrough() {
  write(GUIDE_KEY, { walkthroughDone: true });
  guideStore.set({ walkthrough: false, step: 0 });
}

export function replayWalkthrough() {
  launchHandled = true;
  tipStore.set({ open: false });
  guideStore.set({ walkthrough: true, step: 0 });
}
