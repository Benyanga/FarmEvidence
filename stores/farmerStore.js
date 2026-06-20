import { create } from 'zustand';

const useFarmerStore = create((set, get) => ({
  // State
  farmSetup: null, // Will contain farm setup data
  seasons: [], // Array of season objects
  currentSeasonId: null, // Id of the season being viewed/edited

  // Actions
  setFarmSetup: (farmSetup) => set({ farmSetup }),
  addSeason: (seasonData) => set((state) => ({
    seasons: [...state.seasons, { ...seasonData, id: Date.now().toString() }] // Simple ID generation
  })),
  updateSeason: (seasonId, seasonData) => set((state) => ({
    seasons: state.seasons.map(season =>
      season.id === seasonId ? { ...season, ...seasonData } : season
    )
  })),
  deleteSeason: (seasonId) => set((state) => ({
    seasons: state.seasons.filter(season => season.id !== seasonId)
  })),
  setCurrentSeasonId: (seasonId) => set({ currentSeasonId: seasonId }),
  clearCurrentSeasonId: () => set({ currentSeasonId: null }),
  // We can add more actions as needed, e.g., for updating specific parts of a season
}));

export default useFarmerStore;