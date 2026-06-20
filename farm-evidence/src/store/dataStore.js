import { create } from "zustand";
import { db } from "./db";
import * as api from "../services/api.js";

const now = () => new Date().toISOString();

export function buildFarmSeasonPayload(record) {
  const payload = { ...record };
  payload.farm_id = payload.farm_id || payload.farmId || payload.farm_name || payload.farmName;
  payload.farmId = payload.farm_id;
  payload.farm_name = payload.farm_name || payload.farmName;
  payload.farmName = payload.farmName || payload.farm_name;

  if (!payload.season_ref && payload.season && payload.year != null) {
    payload.season_ref = `${payload.season}-${payload.year}`;
  }

  if (payload.remoteId) {
    payload.id = payload.remoteId;
  } else {
    delete payload.id;
    delete payload._id;
  }

  return payload;
}

export const useDataStore = create((set, get) => ({
  setup: {
    farmName: "",
    siteName: "",
    siteIdentifier: "",
    cropType: "",
    plotSize: "",
    plotSpacing: "",
    seasonReference: "",
    treatments: [],
    replications: 0,
    adoptionStartSeason: null,
    currentSeason: null,
    system: "",
    language: "en",
    setupConfirmed: false,
    rcbdMatrix: [],
  },
  years: [],
  farms: {},
  farmSeasonRecords: {},
  economicRecords: {},
  agronomicRecords: {},
  revenueRecords: {},
  computationResults: {},
  hydrated: false,
  seasons: {},
  updateSetup: (patch) => set((state) => ({ setup: { ...state.setup, ...patch } })),
  confirmSetup: (confirmed = true) => set((state) => ({ setup: { ...state.setup, setupConfirmed: confirmed } })),
  updateSeason: (seasonId, patch) =>
    set((state) => ({
      seasons: {
        ...state.seasons,
        [seasonId]: { ...(state.seasons[seasonId] ?? {}), ...patch, updatedAt: now() },
      },
    })),
  updateCosts: (seasonId, costs) => get().updateSeason(seasonId, { costs }),
  updateLabor: (seasonId, laborOps) => get().updateSeason(seasonId, { laborOps }),
  updateRevenue: (seasonId, revenue) => get().updateSeason(seasonId, { revenue }),
  updateCSI: (seasonId, csiScores) => get().updateSeason(seasonId, { csiScores }),
  updateAgronomics: (seasonId, agronomics) => get().updateSeason(seasonId, { agronomics }),
  addYear: (year) => {
    const normalized = Number(year);
    if (!Number.isInteger(normalized) || normalized < 1900) return;
    set((state) => {
      if (state.years.some((yearEntry) => yearEntry.year === normalized)) return state;
      return {
        years: [{ year: normalized, createdAt: now() }, ...state.years].sort((a, b) => b.year - a.year),
      };
    });
  },
  findFarmMatches: (farmName) => {
    const normalized = String(farmName ?? "").trim().toLowerCase();
    if (!normalized) return [];
    const farms = Object.values(get().farms);
    return farms.filter((farm) => String(farm.name).trim().toLowerCase() === normalized);
  },
addFarmSeasonRecord: ({ year, season, farmName, cropType, farmingSystem, plot_m2, workingHoursPerDay, marketPricePerKg, seedPricePerKg, seedRateKgPerPlot, linkedFarmId, ...extraFields }) => {
     const recordId = `${year}-${season}-${linkedFarmId || `farm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}`;
     const farmId = linkedFarmId || `farm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
     const farmEntry = linkedFarmId
       ? get().farms[linkedFarmId] ?? { id: linkedFarmId, name: farmName, cropType, farmingSystem, createdAt: now() }
       : { id: farmId, name: farmName, cropType, farmingSystem, createdAt: now() };

     set((state) => ({
       farms: {
         ...state.farms,
         [farmEntry.id]: farmEntry,
       },
       farmSeasonRecords: {
         ...state.farmSeasonRecords,
         [recordId]: {
           id: recordId,
           farmId: farmEntry.id,
           farmName,
           cropType,
           farmingSystem,
           year,
           season,
           workingHoursPerDay: Number(workingHoursPerDay) || 8,
           marketPricePerKg: Number(marketPricePerKg) || 0,
           seedPricePerKg: Number(seedPricePerKg) || 0,
           seedRateKgPerPlot: Number(seedRateKgPerPlot) || 0,
           plot_m2: Number(plot_m2) || 0,
           status: "CONFIGURED",
           createdAt: now(),
           updatedAt: now(),
           plotData: [], // Initialize empty plot data array
           ...extraFields,
         },
       },
     }));
     return recordId;
   },
  updateFarmSeasonRecord: (recordId, patch) =>
    set((state) => ({
      farmSeasonRecords: {
        ...state.farmSeasonRecords,
        [recordId]: {
          ...(state.farmSeasonRecords[recordId] ?? {}),
          ...patch,
          updatedAt: now(),
        },
      },
    })),
  deleteFarmSeasonRecord: (recordId) =>
    set((state) => {
      const next = { ...state.farmSeasonRecords };
      delete next[recordId];
      return { farmSeasonRecords: next };
    }),
  hasDataEntryForFarm: (recordId) => {
    const data = get();
    const economic = data.economicRecords[recordId];
    const agronomic = data.agronomicRecords[recordId];
    return (
      (economic && Object.values(economic).some((value) => value !== null && value !== undefined && value !== "")) ||
      (agronomic && Object.values(agronomic).some((value) => value !== null && value !== undefined && value !== ""))
    );
  },
  saveEconomicRecord: (recordId, patch) =>
    set((state) => ({
      economicRecords: {
        ...state.economicRecords,
        [recordId]: {
          ...(state.economicRecords[recordId] ?? {}),
          ...patch,
          updatedAt: now(),
        },
      },
    })),
  saveAgronomicRecord: (recordId, patch) =>
    set((state) => ({
      agronomicRecords: {
        ...state.agronomicRecords,
        [recordId]: {
          ...(state.agronomicRecords[recordId] ?? {}),
          ...patch,
          updatedAt: now(),
        },
      },
    })),
  markComputationStale: (recordId) =>
    set((state) => ({
      computationResults: {
        ...state.computationResults,
        [recordId]: {
          ...(state.computationResults[recordId] ?? {}),
          stale: true,
          updatedAt: now(),
        },
      },
    })),
  hydrateFromCloud: ({ setup, seasons, years, farms, farmSeasonRecords }) =>
    set(() => ({
      setup: setup ?? get().setup,
      seasons: seasons ?? get().seasons,
      years: years ?? get().years,
      farms: farms ?? get().farms,
      farmSeasonRecords: farmSeasonRecords ?? get().farmSeasonRecords,
    })),
  loadFromLocal: async () => {
    try {
      const sessionData = await db.sessions.get("current");
      const seasonsData = await db.seasons.get("all");
      
      if (sessionData?.setup) {
        set((state) => ({ setup: { ...state.setup, ...sessionData.setup } }));
      }
      if (sessionData?.years) {
        set(() => ({ years: sessionData.years }));
      }
      if (sessionData?.farms) {
        set(() => ({ farms: sessionData.farms }));
      }
      if (sessionData?.farmSeasonRecords) {
        set(() => ({ farmSeasonRecords: sessionData.farmSeasonRecords }));
      }
      if (sessionData?.economicRecords) {
        set(() => ({ economicRecords: sessionData.economicRecords }));
      }
      if (sessionData?.agronomicRecords) {
        set(() => ({ agronomicRecords: sessionData.agronomicRecords }));
      }
      if (sessionData?.computationResults) {
        set(() => ({ computationResults: sessionData.computationResults }));
      }
      if (seasonsData?.seasons) {
        set((state) => ({ seasons: { ...state.seasons, ...seasonsData.seasons } }));
      }
    } catch (error) {
      console.warn("Failed to load local data:", error);
    } finally {
      set(() => ({ hydrated: true }));
    }
  },
  markCategoryNA: (seasonId, category) =>
    set((state) => ({
      seasons: {
        ...state.seasons,
        [seasonId]: {
          ...(state.seasons[seasonId] ?? {}),
          costs: { ...(state.seasons[seasonId]?.costs ?? {}), [category]: "N/A" },
          updatedAt: now(),
        },
      },
    })),
  autosave: async () => {
    const state = get();
    await db.sessions.put({
      id: "current",
      setup: state.setup,
      years: state.years,
      farms: state.farms,
      farmSeasonRecords: state.farmSeasonRecords,
      economicRecords: state.economicRecords,
      agronomicRecords: state.agronomicRecords,
      computationResults: state.computationResults,
      updatedAt: now(),
    });
    await db.seasons.put({ id: "all", seasons: state.seasons, updatedAt: now() });
  },
  // Remote API integration
  loadEconomicRecords: async (plot_id, trial_season_id, token) => {
    try {
      const res = await api.getEconomicRecords(plot_id, trial_season_id, token);
      if (res.ok) {
        // normalize into local map keyed by id
        const map = {};
        for (const r of res.records) map[r._id] = r;
        set(() => ({ economicRecords: { ...get().economicRecords, [plot_id]: map } }));
      }
      return res;
    } catch (e) {
      console.warn("Failed to load economic records:", e.message);
      return { ok: false, error: e.message };
    }
  },
  addEconomicRecordRemote: async (payload, token) => {
    try {
      const res = await api.addEconomicRecord(payload, token);
      if (res.ok) {
        const plotId = payload.plot_id;
        set((state) => ({
          economicRecords: {
            ...state.economicRecords,
            [plotId]: { ...(state.economicRecords[plotId] ?? {}), [res.id]: res.data },
          },
        }));
      }
      return res;
    } catch (e) {
      console.warn("Failed to add economic record:", e.message);
      return { ok: false, error: e.message };
    }
  },
  updateEconomicRecordRemote: async (recordId, updates, token) => {
    try {
      const res = await api.updateEconomicRecord(recordId, updates, token);
      if (res.ok) {
        // find the plot map that contains this id and update
        set((state) => {
          const next = { ...state.economicRecords };
          for (const plotId of Object.keys(next)) {
            if (next[plotId] && next[plotId][recordId]) {
              next[plotId] = { ...next[plotId], [recordId]: res.data };
              break;
            }
          }
          return { economicRecords: next };
        });
      }
      return res;
    } catch (e) {
      console.warn("Failed to update economic record:", e.message);
      return { ok: false, error: e.message };
    }
  },
  deleteEconomicRecordRemote: async (recordId, token) => {
    try {
      const res = await api.deleteEconomicRecord(recordId, token);
      if (res.ok) {
        set((state) => {
          const next = { ...state.economicRecords };
          for (const plotId of Object.keys(next)) {
            if (next[plotId] && next[plotId][recordId]) {
              const copy = { ...next[plotId] };
              delete copy[recordId];
              next[plotId] = copy;
              break;
            }
          }
          return { economicRecords: next };
        });
      }
      return res;
    } catch (e) {
      console.warn("Failed to delete economic record:", e.message);
      return { ok: false, error: e.message };
    }
  },
  saveRevenueRemote: async (payload, token) => {
    try {
      const res = await api.saveRevenue(payload, token);
      if (res.ok) {
        const key = payload.plot_id;
        set((state) => ({
          revenueRecords: {
            ...state.revenueRecords,
            [key]: {
              ...(state.revenueRecords[key] ?? {}),
              [res.data._id]: res.data,
            },
          },
        }));
      }
      return res;
    } catch (e) {
      console.warn("Failed to save revenue:", e.message);
      return { ok: false, error: e.message };
    }
  },
  loadRevenueRemote: async (plot_id, trial_season_id, token) => {
    try {
      const res = await api.getRevenue(plot_id, trial_season_id, token);
      return res;
    } catch (e) {
      console.warn("Failed to load revenue:", e.message);
      return { ok: false, error: e.message };
    }
  },
  saveAgronomicRemote: async (payload, token) => {
    try {
      const res = await api.saveAgronomic(payload, token);
      if (res.ok) {
        const key = payload.plot_id;
        set((state) => ({ agronomicRecords: { ...state.agronomicRecords, [key]: { ...(state.agronomicRecords[key] ?? {}), [res.data._id]: res.data } } }));
      }
      return res;
    } catch (e) {
      console.warn("Failed to save agronomic record:", e.message);
      return { ok: false, error: e.message };
    }
  },
  loadAgronomicRemote: async (plot_id, trial_season_id, token) => {
    try {
      const res = await api.getAgronomic(plot_id, trial_season_id, token);
      return res;
    } catch (e) {
      console.warn("Failed to load agronomic records:", e.message);
      return { ok: false, error: e.message };
    }
  },
  saveCsiRemote: async (payload, token) => {
    try {
      const res = await api.saveCsi(payload, token);
      if (res.ok) {
        const key = payload.plot_id;
        set(() => ({ /* store if desired */ }));
      }
      return res;
    } catch (e) {
      console.warn("Failed to save CSI record:", e.message);
      return { ok: false, error: e.message };
    }
  },
  loadCsiRemote: async (plot_id, trial_season_id, token) => {
    try {
      const res = await api.getCsi(plot_id, trial_season_id, token);
      return res;
    } catch (e) {
      console.warn("Failed to load CSI record:", e.message);
      return { ok: false, error: e.message };
    }
  },
  loadFarmSeasonRecordsRemote: async (farmId, token) => {
    try {
      const res = await api.getFarmSeasonRecords(farmId, token);
      const records = Array.isArray(res) ? res : res.records || [];
      if (records.length > 0) {
        const mapped = records.reduce((acc, record) => {
          const id = record._id || record.id || `${record.year}-${record.season}-${record.farmId || record.farm_id || record.farmName}`;
          acc[id] = { ...record, id };
          return acc;
        }, {});
        set((state) => ({ farmSeasonRecords: { ...state.farmSeasonRecords, ...mapped } }));
      }
      return res;
    } catch (e) {
      console.warn("Failed to load farm season records:", e.message);
      return { ok: false, error: e.message };
    }
  },
  addFarmSeasonRecordRemote: async (recordData, token) => {
    const recordId = get().addFarmSeasonRecord(recordData);
    const record = get().farmSeasonRecords[recordId];
    try {
      const payload = buildFarmSeasonPayload(record);
      const res = await api.saveFarmSeasonRecord(payload, token);
      if (res) {
        set((state) => ({
          farmSeasonRecords: {
            ...state.farmSeasonRecords,
            [recordId]: {
              ...state.farmSeasonRecords[recordId],
              remoteId: res._id || res.id,
              ...res,
              id: recordId,
            },
          },
        }));
      }
      return { localId: recordId, remote: res };
    } catch (e) {
      console.warn("Failed to save farm season record remotely:", e.message);
      return { localId: recordId, remote: { ok: false, error: e.message } };
    }
  },
  saveFarmSeasonRecordRemote: async (payload, token) => {
    try {
      const apiPayload = buildFarmSeasonPayload(payload);
      const res = await api.saveFarmSeasonRecord(apiPayload, token);
      const localId = payload.id || `${payload.year}-${payload.season}-${payload.farmId || payload.farm_id || payload.farmName || payload.farm_name}`;
      const success = Boolean(res && (res.ok === true || res._id || res.id));
      if (localId) {
        set((state) => ({
          farmSeasonRecords: {
            ...state.farmSeasonRecords,
            [localId]: {
              ...(state.farmSeasonRecords[localId] ?? {}),
              ...payload,
              ...res,
              id: localId,
              remoteId: res._id || res.id,
            },
          },
        }));
      }
      return success ? { ...res, ok: true } : { ok: false, error: res?.error || 'Failed to save farm season record' };
    } catch (e) {
      console.warn("Failed to save farm season record:", e.message);
      return { ok: false, error: e.message };
    }
  },
  getGatesRemote: async (plot_id, trial_season_id, token) => {
    try {
      const res = await api.getPlotGates(plot_id, trial_season_id, token);
      return res;
    } catch (e) {
      console.warn("Failed to fetch gates:", e.message);
      return { ok: false, error: e.message };
    }
  },
}));
