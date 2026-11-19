import { useEffect } from 'react';
import { useStore } from '../../lib/store';
import { analysisService, type LiveAnalysisState } from '../../services/analysisService';

/**
 * Live engine analysis of `fen` on the shared engine (null: not needed). Changing `fen`
 * supersedes the previous request at once; unmounting hands the engine back to background work.
 * Returned lines belong to `fen` only when `state.fen === fen`.
 */
export function useLiveAnalysis(fen: string | null): LiveAnalysisState {
  useEffect(() => {
    analysisService.setLivePosition(fen);
  }, [fen]);
  useEffect(() => () => analysisService.setLivePosition(null), []);
  return useStore(analysisService.live);
}
