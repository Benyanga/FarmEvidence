import { create } from "zustand";

export const usePlotRecordingStore = create((set, get) => ({
  // Current recording context
  currentTrialSeasonId: null,
  currentPlotId: null,
  currentPhase: null, // PLANTING, MID_SEASON, HARVEST (agronomic)
  
  // Economic records for current plot
  economicRecords: [], // { id, date, item, category, subCategory, unit, quantity, unitCost, ... }
  
  // Revenue for current plot
  revenue: null, // { yieldRawKg, yieldHaKg, sellingPrice, revenuePlot, revenueHa }
  
  // Agronomic observations for current plot (3 phases)
  agronomicRecords: {
    PLANTING: null,
    MID_SEASON: null,
    HARVEST: null,
  },
  plotAgronomicRecords: {},
  
  // CSI drivers for current plot
  csiDrivers: null, // { j1, j2, j3, j4, j5, j6, csiValue, csiLevel }
  
  // UI state
  economicAccordionOpen: true,
  agronomicAccordionOpen: false,
  
  // Gate checklist state
  gateStates: {
    labourRecorded: false,
    tillageConfirmed: false,
    fertilizerConfirmed: false,
    pesticideConfirmed: false,
    irrigationConfirmed: false,
    residueConfirmed: false,
    yieldEntered: false,
    priceEntered: false,
  },
  
  // Setters
  setContext: (trialSeasonId, plotId) => {
    set({
      currentTrialSeasonId: trialSeasonId,
      currentPlotId: plotId,
      economicRecords: [],
      revenue: null,
      agronomicRecords: { PLANTING: null, MID_SEASON: null, HARVEST: null },
      plotAgronomicRecords: {},
      csiDrivers: null,
      gateStates: {
        labourRecorded: false,
        tillageConfirmed: false,
        fertilizerConfirmed: false,
        pesticideConfirmed: false,
        irrigationConfirmed: false,
        residueConfirmed: false,
        yieldEntered: false,
        priceEntered: false,
      },
    });
  },
  
  clearContext: () => {
    set({
      currentTrialSeasonId: null,
      currentPlotId: null,
      economicRecords: [],
      revenue: null,
      agronomicRecords: { PLANTING: null, MID_SEASON: null, HARVEST: null },
      plotAgronomicRecords: {},
      csiDrivers: null,
    });
  },
  
  // Economic records management
  addEconomicRecord: (record) => {
    set((state) => ({
      economicRecords: [...state.economicRecords, { id: `temp-${Date.now()}`, costType: 'C_SD', labourCount: record?.labourCount || 1, unit: record?.unit || '', ...record }],
    }));
  },
  
  updateEconomicRecord: (recordId, updates) => {
    set((state) => ({
      economicRecords: state.economicRecords.map((r) =>
        r.id === recordId ? { ...r, ...updates } : r
      ),
    }));
  },
  
  deleteEconomicRecord: async (recordId) => {
    const state = get();
    if ((recordId || '').toString().startsWith('temp-')) {
      set({ economicRecords: state.economicRecords.filter((r) => r.id !== recordId) });
      return;
    }

    try {
      await fetch(`/api/records/economic/${recordId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Failed to delete record on server', e.message);
    }

    set({ economicRecords: state.economicRecords.filter((r) => r.id !== recordId) });
  },
  
  setEconomicRecords: (records) => {
    set({ economicRecords: records });
  },

  saveEconomicRecord: async (record, plotId) => {
    try {
      const state = get();
      const trialSeasonId = state.currentTrialSeasonId;
      if (!trialSeasonId || !plotId) throw new Error('Missing trialSeasonId or plotId');

      const payload = {
        plot_id: plotId,
        trial_season_id: trialSeasonId,
        entry_date: record.date,
        item_activity: record.item,
        costType: record.costType || 'C_SD',
        subCategoryText: record.subCategory || record.sub_category || '',
        unit: record.unit || '',
        quantity: Number(record.quantity) || 0,
        time_unit: record.unit || null,
        workers: Number(record.labourCount || record.workers || 1) || 1,
        unit_cost_rwf: Number(record.unitCost || record.unit_cost_rwf || 0) || 0,
        note: record.notes || record.note || '',
        mode: state.mode || 'research',
      };

      const res = await fetch('/api/records/economic/add', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Save failed');

      // Replace local temp id with saved id and update computed fields
      set((s) => ({
        economicRecords: s.economicRecords.map((r) => r.id === record.id ? { ...r, id: data.id, totalPlotRwf: data.data.total_plot_rwf, totalHaRwf: data.data.total_ha_rwf } : r),
      }));
      return { ok: true, id: data.id };
    } catch (error) {
      console.error('saveEconomicRecord error', error.message);
      return { ok: false, error: error.message };
    }
  },

  saveAllEconomicRecords: async (plotId) => {
    const state = get();
    const records = state.economicRecords || [];
    for (const r of records) {
      if ((r.id || '').toString().startsWith('temp-')) {
        // eslint-disable-next-line no-await-in-loop
        await state.saveEconomicRecord(r, plotId);
      }
    }
  },
  
  // Revenue management
  setRevenue: (yieldRawKg, sellingPrice, extrapolationFactor) => {
    const yieldHaKg = (Number(yieldRawKg) || 0) * (Number(extrapolationFactor) || 1);
    const revenuePlot = (Number(yieldRawKg) || 0) * (Number(sellingPrice) || 0);
    const revenueHa = yieldHaKg * (Number(sellingPrice) || 0);
    
    set((state) => ({
      revenue: {
        yieldRawKg: Number(yieldRawKg),
        yieldHaKg,
        sellingPrice: Number(sellingPrice),
        revenuePlot,
        revenueHa,
      },
      gateStates: {
        ...state.gateStates,
        yieldEntered: true,
        priceEntered: true,
      },
    }));
  },
  
  // Agronomic observations
  setAgronomicObservation: (phase, observations) => {
    set((state) => ({
      agronomicRecords: {
        ...state.agronomicRecords,
        [phase]: observations,
      },
    }));
  },
  setPlotAgronomicRecord: (plotId, record) => {
    set((state) => ({
      plotAgronomicRecords: {
        ...state.plotAgronomicRecords,
        [plotId]: record,
      },
    }));
  },
  updatePlotAgronomicRecord: (plotId, updates) => {
    set((state) => ({
      plotAgronomicRecords: {
        ...state.plotAgronomicRecords,
        [plotId]: {
          ...(state.plotAgronomicRecords[plotId] || {}),
          ...updates,
        },
      },
    }));
  },
  
  // CSI drivers
  setCSIDrivers: (j1, j2, j3, j4, j5, j6, csiValue, csiLevel) => {
    set({
      csiDrivers: { j1, j2, j3, j4, j5, j6, csiValue, csiLevel },
    });
  },
  
  // Gate checklist
  updateGateState: (gate, value) => {
    set((state) => {
      if (state.gateStates[gate] === value) {
        return state;
      }
      return {
        gateStates: { ...state.gateStates, [gate]: value },
      };
    });
  },
  
  // UI state
  toggleEconomicAccordion: () => {
    set((state) => ({ economicAccordionOpen: !state.economicAccordionOpen }));
  },
  
  toggleAgronomicAccordion: () => {
    set((state) => ({ agronomicAccordionOpen: !state.agronomicAccordionOpen }));
  },
  
  // Computed getters
  getEconomicTotal: () => {
    const state = get();
    return state.economicRecords
      .filter((r) => r.category !== "REVENUES")
      .reduce((sum, r) => sum + (Number(r.totalPlotRwf) || 0), 0);
  },
  
  getEconomicTotalPerHa: () => {
    const state = get();
    return state.economicRecords
      .filter((r) => r.category !== "REVENUES")
      .reduce((sum, r) => sum + (Number(r.totalHaRwf) || 0), 0);
  },
  
  getLabourTotal: () => {
    const state = get();
    return state.economicRecords
      .filter((r) => r.category === "LABOUR_COSTS")
      .reduce((sum, r) => sum + (Number(r.totalPlotRwf) || 0), 0);
  },
  
  allGatesPassed: () => {
    const state = get();
    return Object.values(state.gateStates).every((v) => v === true);
  },
}));
