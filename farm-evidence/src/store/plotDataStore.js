import { create } from 'zustand';

// Holds per-plot data keyed by plotId
defaultPlotData = () => ({
  inputCosts: [], // [{date, input, costType, quantity, unit, unitCost, totalCost, notes}]
  labourCosts: [], // [{date, practice, costType, time, timeUnit, wageRate, totalCost, notes}]
  yield: '',
  price: '',
  notes: '',
});

export const usePlotDataStore = create((set, get) => ({
  plots: {}, // { plotId: { ...plotData } }
  setPlot: (plotId, data) => set((state) => ({ plots: { ...state.plots, [plotId]: { ...get().plots[plotId], ...data } } })),
  setPlots: (plots) => set(() => ({ plots })),
  resetPlots: () => set(() => ({ plots: {} })),
  addPlot: (plotId) => set((state) => ({ plots: { ...state.plots, [plotId]: defaultPlotData() } })),
  removePlot: (plotId) => set((state) => { const { [plotId]: _, ...rest } = state.plots; return { plots: rest }; }),
}));
