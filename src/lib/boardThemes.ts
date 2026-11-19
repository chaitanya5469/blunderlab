import { settingsStore } from './settings';

/* Kept apart from the piece sets so startup does not pull in react-chessboard. */


export interface BoardThemeInfo {
  id: string;
  name: string;
  light: string;
  dark: string;
  /** Last-move tint (translucent). */
  highlight: string;
  /** Selected-square tint (translucent). */
  select: string;
  /** Coordinate text on light squares. */
  notation: string;
}

export const BOARD_THEMES: BoardThemeInfo[] = [
  { id: 'slate', name: 'Slate', light: '#dde2e9', dark: '#7d8ea6', highlight: 'rgb(233 196 94 / 0.48)', select: 'rgb(111 149 255 / 0.42)', notation: '#4a5870' },
  { id: 'walnut', name: 'Walnut', light: '#f0d9b5', dark: '#b58863', highlight: 'rgb(205 210 60 / 0.5)', select: 'rgb(20 110 60 / 0.42)', notation: '#8b6340' },
  { id: 'tournament', name: 'Green', light: '#eeeed2', dark: '#769656', highlight: 'rgb(255 236 64 / 0.5)', select: 'rgb(60 120 220 / 0.4)', notation: '#58763c' },
  { id: 'ocean', name: 'Ocean', light: '#dee3e6', dark: '#8ca2ad', highlight: 'rgb(155 199 0 / 0.45)', select: 'rgb(20 85 140 / 0.42)', notation: '#5d7581' },
  { id: 'coral', name: 'Coral', light: '#f3e1d4', dark: '#cf8e7c', highlight: 'rgb(240 200 80 / 0.55)', select: 'rgb(70 110 200 / 0.4)', notation: '#a1614f' },
  { id: 'amethyst', name: 'Amethyst', light: '#e8e1f1', dark: '#9a84b9', highlight: 'rgb(255 210 100 / 0.5)', select: 'rgb(60 190 140 / 0.42)', notation: '#6c5690' },
  { id: 'mint', name: 'Mint', light: '#e6f0ea', dark: '#7faa98', highlight: 'rgb(240 205 90 / 0.5)', select: 'rgb(80 120 230 / 0.4)', notation: '#4f7a69' },
  { id: 'midnight', name: 'Midnight', light: '#9aa6b8', dark: '#4a5669', highlight: 'rgb(233 196 94 / 0.5)', select: 'rgb(111 149 255 / 0.5)', notation: '#36404f' },
];

export const themeById = (id: string) => BOARD_THEMES.find((t) => t.id === id) ?? BOARD_THEMES[0]!;

/** Writes the chosen theme's colours to the board CSS tokens (every board reads them). */
function applyTheme(id: string) {
  const t = themeById(id);
  const s = document.documentElement.style;
  s.setProperty('--color-board-light', t.light);
  s.setProperty('--color-board-dark', t.dark);
  s.setProperty('--color-board-highlight', t.highlight);
  s.setProperty('--color-board-select', t.select);
  s.setProperty('--color-board-notation', t.notation);
}

/** Applies the saved board theme now and whenever it changes. Call once at startup. */
export function initBoardStyle() {
  let current = settingsStore.get().boardTheme;
  applyTheme(current);
  settingsStore.subscribe(() => {
    const next = settingsStore.get().boardTheme;
    if (next !== current) applyTheme((current = next));
  });
}
