import { create } from 'zustand';

// Centralized trial parameters for RCBD
export const useTrialConfigStore = create((set) => ({
  trialName: '',
  treatments: ['CA', 'CF'], // dynamic, editable
  replications: 3,
  plotSizeM2: 25,
  plotDimensions: '5m x 5m',
  bufferZones: '',
  extrapolationFactor: 400, // auto: 10,000 / plotSizeM2
  crop: '',
  variety: '',
  plantingDate: '',
  previousCrop: '',
  season: '',
  interRowSpacing: 75,
  intraRowSpacing: 30,
  seedsPerHill: 1,
  marketPrice: 0,
  workingHoursPerDay: 8,
  seedRate: 0,
  seedPrice: 0,
  treatmentDescriptions: {}, // { CA: {...}, CF: {...} }
  sharedInputs: '',
  setConfig: (config) => set(config),
  updateField: (field, value) => set((state) => ({ ...state, [field]: value })),
  updateTreatmentDescriptions: (treatment, desc) => set((state) => ({
    treatmentDescriptions: { ...state.treatmentDescriptions, [treatment]: desc }
  })),
  setTreatments: (treatments) => set((state) => ({ treatments })),
  setReplications: (replications) => set((state) => ({ replications })),
  setPlotSizeM2: (plotSizeM2) => set((state) => ({ plotSizeM2, extrapolationFactor: 10000 / plotSizeM2 })),
}));
