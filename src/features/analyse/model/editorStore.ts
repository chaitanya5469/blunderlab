import { createStore, useStore } from '../../../lib/store';
import type { Color } from '../../../lib/types';
import { emptyPosition, sanitize, type EditorPosition } from './position';

/** Per-square recognition confidence (0..1) keyed by square name, for squares worth checking. */
export type SquareConfidence = Record<string, number>;

export interface EditorState {
  pos: EditorPosition;
  orientation: Color;
  history: EditorPosition[];
  /** Set when the position came from a scan: squares the recogniser was unsure about. */
  confidence: SquareConfidence | null;
  /** Bumped when a new position is loaded wholesale (scan, FEN, preset) so the board can reset selection. */
  loadId: number;
}

const HISTORY_MAX = 100;

/**
 * The position being set up. It lives outside the editor screen so it survives a trip to the
 * analysis board and back (and the scan screen can hand a recognised position to it).
 */
// The draft survives app restarts until a new position replaces it (undo history is not kept).
const DRAFT_KEY = 'blunderlab:analyse:draft:v1';

export const editorStore = createStore<EditorState>({ pos: emptyPosition(), orientation: 'white', history: [], confidence: null, loadId: 0, ...loadDraft() });

function loadDraft(): Partial<EditorState> {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return {};
    const d = JSON.parse(raw) as Partial<EditorState>;
    if (!d.pos || !Array.isArray(d.pos.board) || d.pos.board.length !== 64) return {};
    return {
      pos: sanitize({ ...emptyPosition(), ...d.pos }),
      orientation: d.orientation === 'black' ? 'black' : 'white',
      confidence: d.confidence && typeof d.confidence === 'object' ? d.confidence : null,
    };
  } catch {
    return {};
  }
}

let saved = '';
editorStore.subscribe(() => {
  const { pos, orientation, confidence } = editorStore.get();
  const json = JSON.stringify({ pos, orientation, confidence });
  if (json === saved) return;
  saved = json;
  try {
    localStorage.setItem(DRAFT_KEY, json);
  } catch {
    /* storage unavailable: the draft lasts for this session only */
  }
});

export const useEditor = () => useStore(editorStore);

/** Applies an edit (board changes are sanitised: impossible castling rights / en passant are dropped). */
export function edit(change: (pos: EditorPosition) => EditorPosition, opts: { sanitize?: boolean } = {}) {
  const s = editorStore.get();
  const next = change(s.pos);
  if (next === s.pos) return;
  editorStore.set({ pos: opts.sanitize === false ? next : sanitize(next), history: [...s.history, s.pos].slice(-HISTORY_MAX) });
}

/** Replaces the position (keeps undo so a mistaken preset or paste can be taken back). */
export function loadPosition(pos: EditorPosition, extra: { orientation?: Color; confidence?: SquareConfidence | null } = {}) {
  const s = editorStore.get();
  editorStore.set({
    pos,
    history: [...s.history, s.pos].slice(-HISTORY_MAX),
    orientation: extra.orientation ?? s.orientation,
    confidence: extra.confidence === undefined ? null : extra.confidence,
    loadId: s.loadId + 1,
  });
}

export function undo() {
  const s = editorStore.get();
  const prev = s.history[s.history.length - 1];
  if (!prev) return;
  editorStore.set({ pos: prev, history: s.history.slice(0, -1) });
}

export function flip() {
  const s = editorStore.get();
  editorStore.set({ orientation: s.orientation === 'white' ? 'black' : 'white' });
}

export function dismissConfidence() {
  editorStore.set({ confidence: null });
}
