import { useStore } from '../lib/store';
import { settingsStore } from '../lib/settings';
import { analysisService } from '../services/analysisService';
import { syncService } from '../services/syncService';

export const useSyncState = () => useStore(syncService.store);
export const useAnalysisState = () => useStore(analysisService.store);
export const useSettings = () => useStore(settingsStore);
export const useDeepAnalysisState = () => useStore(analysisService.deep);
