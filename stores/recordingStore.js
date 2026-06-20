import { create } from 'zustand';
import api from '../services/api';

const useRecordingStore = create((set, get) => ({
  // State
  entries: [],
  revenue: null,
  agronomicObservations: {
    PLANTING: null,
    MID_SEASON: null,
    HARVEST: null
  },
  csiDrivers: null,
  loading: false,
  error: null,
  lastSaved: null,
  
  // Actions
  
  // 1. loadEntries(plotId, trialSeasonId)
  loadEntries: async (plotId, trialSeasonId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/api/economic-records`, {
        params: { plot_id: plotId, trial_season_id: trialSeasonId }
      });
      set({ entries: response.data, loading: false });
    } catch (err) {
      set({ 
        loading: false, 
        error: 'Could not load records. Tap to retry.' 
      });
    }
  },
  
  // 2. addEntry(entryData)
  addEntry: async (entryData) => {
    // Optimistic update
    const tempId = crypto.randomUUID();
    set(state => ({
      entries: [...state.entries, { ...entryData, _id: tempId, _pending: true }]
    }));
    
    try {
      const saved = await api.post('/api/economic-records', entryData);
      // Replace optimistic entry with real saved entry
      set(state => ({
        entries: state.entries.map(e =>
          e._id === tempId ? saved.data : e
        )
      }));
    } catch (err) {
      // Rollback on failure
      set(state => ({
        entries: state.entries.filter(e => e._id !== tempId),
        error: 'Failed to save. Check connection and try again.'
      }));
    }
  },
  
  // 3. updateEntry(entryId, changes)
  updateEntry: async (entryId, changes) => {
    // Optimistic update
    set(state => ({
      entries: state.entries.map(e =>
        e._id === entryId ? { ...e, ...changes, _pending: true } : e
      )
    }));
    
    try {
      const updated = await api.patch(`/api/economic-records/${entryId}`, changes);
      // Replace with actual saved data
      set(state => ({
        entries: state.entries.map(e =>
          e._id === entryId ? updated.data : e
        )
      }));
    } catch (err) {
      // Rollback on failure
      set(state => ({
        entries: state.entries.map(e =>
          e._id === entryId ? 
            { ...e, _pending: false } : // Remove pending flag but keep changes
            e
        ),
        error: 'Failed to update. Check connection and try again.'
      }));
    }
  },
  
  // 4. deleteEntry(entryId)
  deleteEntry: async (entryId) => {
    // Optimistic removal
    const entryToDelete = get().entries.find(e => e._id === entryId);
    set(state => ({
      entries: state.entries.filter(e => e._id !== entryId)
    }));
    
    try {
      await api.delete(`/api/economic-records/${entryId}`);
      // Successfully deleted, nothing more to do
    } catch (err) {
      // Rollback - restore the entry
      set(state => ({
        entries: [...state.entries, entryToDelete],
        error: 'Failed to delete. Check connection and try again.'
      }));
    }
  },
  
  // 5. saveRevenue(plotId, trialSeasonId, yieldKg, priceRwf)
  saveRevenue: async (plotId, trialSeasonId, yieldKg, priceRwf) => {
    try {
      const saved = await api.post('/api/revenue-records', {
        plot_id: plotId,
        trial_season_id: trialSeasonId,
        yield_raw_kg: yieldKg,
        selling_price_rwf_kg: priceRwf
      });
      set({ revenue: saved.data });
    } catch (err) {
      set({ error: 'Failed to save revenue. Check connection and try again.' });
    }
  },
  
  // 6. saveAgronomicObservation(observationData)
  saveAgronomicObservation: async (observationData) => {
    try {
      const saved = await api.post('/api/agronomic-observations', observationData);
      // Update the specific observation in state
      set(state => ({
        agronomicObservations: {
          ...state.agronomicObservations,
          [observationData.observed_at]: saved.data
        }
      }));
    } catch (err) {
      set({ error: 'Failed to save observation. Check connection and try again.' });
    }
  },
  
  // 7. saveCsiDrivers(plotId, trialSeasonId, drivers)
  saveCsiDrivers: async (plotId, trialSeasonId, drivers) => {
    try {
      const saved = await api.post('/api/csi-records', {
        plot_id: plotId,
        trial_season_id: trialSeasonId,
        ...drivers
      });
      set({ csiDrivers: saved.data });
    } catch (err) {
      set({ error: 'Failed to save CSI drivers. Check connection and try again.' });
    }
  },
  
  // 8. autoSave()
  autoSave: async () => {
    const state = get();
    // Find entries with _pending flag
    const pendingEntries = state.entries.filter(e => e._pending);
    
    if (pendingEntries.length === 0) return;
    
    set({ loading: true }); // Show saving indicator
    
    try {
      // Batch all pending changes into individual PATCH calls
      const updatePromises = pendingEntries.map(async (entry) => {
        const { _id, _pending, ...changes } = entry;
        return await api.patch(`/api/economic-records/${_id}`, changes);
      });
      
      await Promise.all(updatePromises);
      
      // Clear _pending flags on success
      set(state => ({
        entries: state.entries.map(entry => {
          if (entry._pending) {
            const { _pending, ...cleanEntry } = entry;
            return cleanEntry;
          }
          return entry;
        }),
        loading: false,
        lastSaved: new Date().toLocaleTimeString()
      }));
    } catch (err) {
      set({ 
        loading: false,
        error: 'Auto-save failed. Check connection and try again.'
      });
    }
  },
  
  // Additional loaders for other data types
  
  // Load agronomic observations for a plot and season
  loadAgronomicObservations: async (plotId, trialSeasonId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/api/agronomic-observations`, {
        params: { plot_id: plotId, trial_season_id: trialSeasonId }
      });
      // Assuming response.data is an array of observations
      const observations = {
        PLANTING: null,
        MID_SEASON: null,
        HARVEST: null
      };
      response.data.forEach(obs => {
        observations[obs.observed_at] = obs;
      });
      set({ agronomicObservations: observations, loading: false });
    } catch (err) {
      set({ 
        loading: false, 
        error: 'Could not load observations. Tap to retry.' 
      });
    }
  },
  
  // Load CSI drivers for a plot and season
  loadCsiDrivers: async (plotId, trialSeasonId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/api/csi-records`, {
        params: { plot_id: plotId, trial_season_id: trialSeasonId }
      });
      set({ csiDrivers: response.data, loading: false });
    } catch (err) {
      set({ 
        loading: false, 
        error: 'Could not load CSI data. Tap to retry.' 
      });
    }
  },
  
  // Load revenue for a plot and season
  loadRevenue: async (plotId, trialSeasonId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/api/revenue-records`, {
        params: { plot_id: plotId, trial_season_id: trialSeasonId }
      });
      // Assuming we want the first (and only) revenue record for this plot/season
      set({ revenue: response.data[0] || null, loading: false });
    } catch (err) {
      set({ 
        loading: false, 
        error: 'Could not load revenue. Tap to retry.' 
      });
    }
  }
}));

export default useRecordingStore;