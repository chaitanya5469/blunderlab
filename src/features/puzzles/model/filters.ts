import { useSearchParams } from 'react-router';
import type { GamePhase, Puzzle, PuzzleMotif, PuzzleSource } from '../../../lib/types';

export interface PuzzleFilters {
  source: PuzzleSource | null;
  phase: GamePhase | null;
  timeClass: string | null;
  motif: PuzzleMotif | null;
}

const PARAM: Record<keyof PuzzleFilters, string> = { source: 'src', phase: 'phase', timeClass: 'tc', motif: 'motif' };
const KEYS = Object.keys(PARAM) as (keyof PuzzleFilters)[];

export function matches(p: Puzzle, f: PuzzleFilters): boolean {
  return (
    (!f.source || p.source === f.source) &&
    (!f.phase || p.phase === f.phase) &&
    (!f.timeClass || p.timeClass === f.timeClass) &&
    (!f.motif || p.motifs.includes(f.motif))
  );
}

export const activeCount = (f: PuzzleFilters) => KEYS.filter((k) => f[k]).length;

/** Query string for the filters ("" when none), e.g. to carry them into a training session. */
export function filtersToSearch(f: PuzzleFilters): string {
  const p = new URLSearchParams();
  for (const k of KEYS) if (f[k]) p.set(PARAM[k], f[k]);
  const s = p.toString();
  return s ? `?${s}` : '';
}

const TC_KEY = 'blunderlab.puzzles.timeClass';

function storedTimeClass(): string | null {
  try {
    return localStorage.getItem(TC_KEY) || null;
  } catch {
    return null;
  }
}

function storeTimeClass(tc: string | null) {
  try {
    if (tc) localStorage.setItem(TC_KEY, tc);
    else localStorage.removeItem(TC_KEY);
  } catch {
    /* storage unavailable: the choice just will not persist */
  }
}

/**
 * Filters live in the URL so they survive opening a puzzle and coming back. The time control is
 * also remembered on this device: it applies whenever the URL does not name one.
 */
export function usePuzzleFilters(): [PuzzleFilters, (patch: Partial<PuzzleFilters>) => void] {
  const [params, setParams] = useSearchParams();
  const filters = Object.fromEntries(KEYS.map((k) => [k, params.get(PARAM[k]) || null])) as unknown as PuzzleFilters;
  if (!filters.timeClass) filters.timeClass = storedTimeClass();
  const update = (patch: Partial<PuzzleFilters>) => {
    if ('timeClass' in patch) storeTimeClass(patch.timeClass ?? null);
    setParams(new URLSearchParams(filtersToSearch({ ...filters, ...patch })), { replace: true });
  };
  return [filters, update];
}
