import { settingsStore } from './settings';
import type { MoveClass } from './types';

/**
 * Sound effects: the MP3s in `public/sounds`, decoded once into Web Audio buffers (low latency,
 * overlapping plays). Nothing plays while the app is in the background or when sound is off in Settings.
 */

/** `move` = the owner's / user's move, `opponent` = the other side's (or a reply). */
export type MoveSound = 'move' | 'opponent' | 'capture' | 'castle' | 'check' | 'promote' | 'mate';

export type SoundName = 'capture' | 'castle' | 'game-end' | 'game-start' | 'game-win-long' | 'illegal' | 'move-check' | 'move-opponent' | 'move-self' | 'promote' | 'puzzle-correct-2' | 'puzzle-wrong';

const FILES: SoundName[] = ['capture', 'castle', 'game-end', 'game-start', 'game-win-long', 'illegal', 'move-check', 'move-opponent', 'move-self', 'promote', 'puzzle-correct-2', 'puzzle-wrong'];

const MOVE_FILE: Record<MoveSound, SoundName> = {
  move: 'move-self',
  opponent: 'move-opponent',
  capture: 'capture',
  castle: 'castle',
  check: 'move-check',
  promote: 'promote',
  mate: 'game-end',
};

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
const buffers = new Map<SoundName, AudioBuffer>();
let loading: Promise<void> | null = null;

const hidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';

/** Perceptual-ish volume curve. */
const volumeGain = () => Math.pow(settingsStore.get().soundVolume, 1.6);

function audio(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }
  master = ctx.createGain();
  master.gain.value = volumeGain();
  master.connect(ctx.destination);
  return ctx;
}

/** Fetches and decodes every sound once (decoding works while the context is still suspended). */
function preload(): Promise<void> {
  if (loading) return loading;
  const c = audio();
  if (!c) return Promise.resolve();
  const base = import.meta.env.BASE_URL;
  loading = Promise.all(
    FILES.map(async (name) => {
      try {
        const res = await fetch(`${base}sounds/${name}.mp3`);
        if (!res.ok) throw new Error(String(res.status));
        buffers.set(name, await c.decodeAudioData(await res.arrayBuffer()));
      } catch {
        /* that sound stays silent */
      }
    }),
  ).then(() => undefined);
  return loading;
}

function ready(): AudioContext | null {
  const s = settingsStore.get();
  if (!s.sound || s.soundVolume <= 0 || hidden()) return null;
  const c = audio();
  if (!c) return null;
  if (c.state === 'suspended') void c.resume().catch(() => undefined);
  master!.gain.value = volumeGain();
  return c;
}

/** Plays one decoded sound, `delay` seconds from now. */
function start(c: AudioContext, name: SoundName, delay = 0) {
  const buffer = buffers.get(name);
  if (!buffer) return;
  const src = c.createBufferSource();
  src.buffer = buffer;
  src.connect(master!);
  src.start(c.currentTime + 0.005 + delay);
}

/** Plays a named sound, optionally after `delay` seconds. */
export function playSound(name: SoundName, delay = 0) {
  const c = ready();
  if (c) start(c, name, delay);
}

/** Haptic pulse via the Vibration API; no-op when unsupported or while the app is in the background. Independent of the sound setting. */
export function vibrate(pattern: number | number[]) {
  if (hidden()) return;
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
  } catch {
    /* unsupported */
  }
}

/** Plays one move sound, followed by a cue for a great / brilliant move. */
export function playMoveSound(kind: MoveSound, cls?: MoveClass | null) {
  if (kind === 'mate') vibrate([60, 50, 120, 50, 220]);
  const c = ready();
  if (!c) return;
  start(c, MOVE_FILE[kind]);
  if (cls === 'brilliant') start(c, 'game-win-long', 0.2);
  else if (cls === 'great') start(c, 'puzzle-correct-2', 0.2);
}

/**
 * Unlocks audio on the first touch / key (WebView autoplay rules), decodes the sounds and suspends
 * audio in the background. Call once at startup.
 */
export function setupSound() {
  void preload();
  const unlock = () => {
    if (!settingsStore.get().sound) return;
    const c = audio();
    if (!c) return;
    void c.resume().then(() => {
      if (c.state === 'running') for (const e of EVENTS) window.removeEventListener(e, unlock, true);
    }, () => undefined);
  };
  const EVENTS = ['pointerdown', 'touchend', 'keydown'] as const;
  for (const e of EVENTS) window.addEventListener(e, unlock, true);
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (hidden()) void ctx.suspend().catch(() => undefined);
    else if (settingsStore.get().sound) void ctx.resume().catch(() => undefined);
  });
}
