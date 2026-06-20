import { create } from 'zustand';
import * as api from '../services/api';

const useDashboardStore = create((set, get) => ({
  // State for Farmer Mode
  farmerData: null,
  farmerLoading: false,
  farmerError: null,
  
  // State for Research Mode
  researchData: null,
  researchLoading: false,
  researchError: null,
  
  // Shared state
  activeFarm: null, // { farm_id, trial_id, season_ref, year, mode }
  
  // Actions
  setActiveFarm: (farm) => set({ activeFarm: farm }),
  
  // Fetch farmer mode dashboard data
  fetchFarmerData: async (arg) => {
    set({ farmerLoading: true, farmerError: null });
    try {
      // Backwards-compatible: allow passing a farmSeasonId string (existing callers)
      if (typeof arg === 'string') {
        const farmSeasonId = arg;
        const compRes = await api.getComputationResults?.(farmSeasonId) ?? { ok: false };
        const farmerData = { latest: compRes?.data ?? compRes, prior: null, alerts: [], seasonHistory: null, agronomicSummary: null, gates: null, recordId: farmSeasonId };
        set({ farmerData, farmerLoading: false });
        return;
      }

      const { farm_id, season_ref, recordId } = arg || {};
      // Call the six farmer-specific endpoints in parallel.
      const [latestRes, priorRes, alertsRes, historyRes, agronomicRes, gatesRes] = await Promise.all([
        api.getFarmerDashboardLatest?.(farm_id, season_ref) ?? { ok: false, error: 'Missing API' },
        api.getFarmerDashboardPrior?.(farm_id) ?? { ok: false, error: 'Missing API' },
        api.getAlerts?.(farm_id, season_ref) ?? { ok: false, error: 'Missing API' },
        api.getSeasonHistory?.(farm_id) ?? { ok: false, error: 'Missing API' },
        api.getAgronomicSummary?.(farm_id, season_ref) ?? { ok: false, error: 'Missing API' },
        api.getGates?.(farm_id, season_ref) ?? { ok: false, error: 'Missing API' },
      ]);

      const farmerData = {
        latest: latestRes?.data ?? latestRes,
        prior: priorRes?.data ?? priorRes,
        alerts: alertsRes?.data ?? alertsRes,
        seasonHistory: historyRes?.data ?? historyRes,
        agronomicSummary: agronomicRes?.data ?? agronomicRes,
        gates: gatesRes?.data ?? gatesRes,
        recordId,
      };

      set({ farmerData, farmerLoading: false });
    } catch (err) {
      set({ farmerLoading: false, farmerError: 'Could not load farmer dashboard data.' });
    }
  },
  
  // Fetch research mode dashboard data
  fetchResearchData: async (trialSeasonId) => {
    set({ researchLoading: true, researchError: null });
    try {
      const res = await api.getTrialResults?.(trialSeasonId) ?? { ok: false };
      set({ researchData: res?.data ?? res, researchLoading: false });
    } catch (err) {
      set({ researchLoading: false, researchError: 'Could not load results. Tap to retry.' });
    }
  },
  
  // Clear data
  clearData: () => set({
    farmerData: null,
    farmerLoading: false,
    farmerError: null,
    researchData: null,
    researchLoading: false,
    researchError: null
  })
}));

export default useDashboardStore;