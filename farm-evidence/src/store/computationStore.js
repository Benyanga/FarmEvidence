import { create } from "zustand";
import { runFullAnalysis } from "../engine/computationRunner";
import { computeBackendAnalysis } from "../utils/cloudApi";
import { db } from "./db";

export const useComputationStore = create((set, get) => ({
  results: {},
  computationStatus: "idle",
  currentStep: 0,
  errors: {},
  explainabilityCards: [],
  dismissedCards: new Set(),
  runAnalysis: (seasonId, sessionData, mode) => {
    set({ computationStatus: "running", currentStep: 0, errors: {} });
    const results = runFullAnalysis(sessionData, mode, ({ step }) => set({ currentStep: step }));
    if (!results.complete) {
      set({ computationStatus: "error", errors: results.errors });
      return results;
    }
    const enrichedResults = { ...results, computedAt: new Date().toISOString(), source: "local", sessionData };
    set((state) => ({
      computationStatus: "complete",
      results: { ...state.results, [seasonId]: enrichedResults },
      explainabilityCards: enrichedResults.steps.explainability ?? [],
      currentStep: 12,
    }));
    // Save computation results locally
    get().saveToLocal();
    return enrichedResults;
  },
  runRemoteAnalysis: async (seasonId, sessionData, mode, token) => {
    set({ computationStatus: "running", currentStep: 0, errors: {} });
    try {
      const response = await computeBackendAnalysis(token, { sessionData, mode });
      if (!response.ok || !response.results?.complete) {
        const message = response.error || "Remote computation failed. Check backend logs or authentication.";
        set({ computationStatus: "error", errors: { general: message } });
        return { complete: false, errors: { general: message } };
      }
      const results = { ...response.results, computedAt: new Date().toISOString(), source: "remote" };
      set((state) => ({
        computationStatus: "complete",
        results: { ...state.results, [seasonId]: results },
        explainabilityCards: results.steps.explainability ?? [],
        currentStep: 12,
      }));
      get().saveToLocal();
      return results;
    } catch (error) {
      set({ computationStatus: "error", errors: { general: error.message } });
      return { complete: false, errors: { general: error.message } };
    }
  },
  resetResults: () => set({ results: {}, computationStatus: "idle", currentStep: 0, errors: {} }),
  dismissCard: (cardId) =>
    set((state) => ({ dismissedCards: new Set([...state.dismissedCards, cardId]) })),
  archiveCard: (card) =>
    set((state) => ({ explainabilityCards: state.explainabilityCards.filter((c) => c.trigger !== card.trigger) })),
  hydrateFromCloud: ({ results, explainabilityCards }) =>
    set((state) => ({
      results: results ?? state.results,
      explainabilityCards: explainabilityCards ?? state.explainabilityCards,
    })),
  loadFromLocal: async () => {
    try {
      const computationData = await db.computations.get("results");
      if (computationData?.results) {
        set((state) => ({ 
          results: { ...state.results, ...computationData.results },
          explainabilityCards: computationData.explainabilityCards ?? state.explainabilityCards,
        }));
      }
    } catch (error) {
      console.warn("Failed to load local computation data:", error);
    }
  },
  saveToLocal: async () => {
    const state = get();
    try {
      await db.computations.put({ 
        id: "results", 
        results: state.results, 
        explainabilityCards: state.explainabilityCards,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.warn("Failed to save computation data locally:", error);
    }
  },
}));

