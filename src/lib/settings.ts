import { DEFAULT_DEPTH_PRESET, DEPTH_PRESETS } from './constants';
import { createStore } from './store';
import type { AppSettings } from './types';

const KEY = 'blunderlab:settings';

function load(): AppSettings {
  const defaults: AppSettings = { depthPreset: DEFAULT_DEPTH_PRESET, analysisPaused: false, pieceSet: 'default', boardTheme: 'slate', sound: true, soundVolume: 0.7, showLegalMoves: true, coach: 'capablanca' };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      depthPreset: parsed.depthPreset && parsed.depthPreset in DEPTH_PRESETS ? parsed.depthPreset : defaults.depthPreset,
      analysisPaused: parsed.analysisPaused === true,
      pieceSet: typeof parsed.pieceSet === 'string' ? parsed.pieceSet : defaults.pieceSet,
      boardTheme: typeof parsed.boardTheme === 'string' ? parsed.boardTheme : defaults.boardTheme,
      sound: parsed.sound !== false,
      showLegalMoves: parsed.showLegalMoves !== false,
      coach: typeof parsed.coach === 'string' ? parsed.coach : defaults.coach,
      soundVolume: typeof parsed.soundVolume === 'number' && parsed.soundVolume >= 0 && parsed.soundVolume <= 1 ? parsed.soundVolume : defaults.soundVolume,
    };
  } catch {
    return defaults;
  }
}

/** Device-local app preferences (survive a username change). */
export const settingsStore = createStore<AppSettings>(load());

settingsStore.subscribe(() => {
  try {
    localStorage.setItem(KEY, JSON.stringify(settingsStore.get()));
  } catch {
    /* storage unavailable: settings stay in memory for this session */
  }
});

export const analysisDepth = () => DEPTH_PRESETS[settingsStore.get().depthPreset].depth;
