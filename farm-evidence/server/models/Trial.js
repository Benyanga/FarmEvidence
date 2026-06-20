import mongoose from 'mongoose';

const TrialSchema = new mongoose.Schema({
  trialId: { type: String, required: true, unique: true },
  trialName: { type: String, required: true },
  name: String,
  season: String,
  location: String,
  crop: { type: String, default: 'Beans (Phaseolus vulgaris)' },
  variety: String,
  plantingDate: Date,
  design: { type: String, default: 'RCBD' },
  treatments: { type: [String], default: ['CA', 'CF'] },
  replicates: { type: Number, default: 4 },
  plotSize: { type: Number, default: 100 },
  plotSizeM2: { type: Number, default: 100 },
  // Key editable parameters
  marketPrice: { type: Number, default: 1200 },
  marketPriceRWF: { type: Number, default: 1200 },
  wageRate: { type: Number, default: 1500 },
  wageRateRWF: { type: Number, default: 1500 },
  hoursPerDay: { type: Number, default: 8 },
  workingHoursPerDay: { type: Number, default: 8 },
  seedRate: { type: Number, default: 0.59 },
  seedRateKgPerPlot: { type: Number, default: 0.59 },
  seedPrice: { type: Number, default: 2000 },
  seedPriceRWF: { type: Number, default: 2000 },
  alpha: { type: Number, default: 0.05 },
  // Role & Mode
  role: { type: String, enum: ['Farmer', 'Researcher'], default: 'Researcher' },
  mode: { type: String, enum: ['FarmLevel', 'ResearchTrial'], default: 'ResearchTrial' },
  language: { type: String, enum: ['en', 'kin'], default: 'en' },

  // Phase & Adoption
  adoptionStartSeason: { type: Number, default: 1 },
  adoptionCostInitial: { type: Number, default: 0 },
  adoptionDecayRate: { type: Number, default: 0.5 },

  // Context Sensitivity Index — 6 drivers
  csi_j1: { type: Number, min: 0, max: 1, default: 0.5 },
  csi_j2: { type: Number, min: 0, max: 1, default: 0.5 },
  csi_j3: { type: Number, min: 0, max: 1, default: 0.5 },
  csi_j4: { type: Number, min: 0, max: 1, default: 0.5 },
  csi_j5: { type: Number, min: 0, max: 1, default: 0.5 },
  csi_j6: { type: Number, min: 0, max: 1, default: 0.5 },

  // Current season index (updated each season)
  currentSeasonIndex: { type: Number, default: 1 },

  // System Plus
  systemPlusEnabled: { type: Boolean, default: false },
  systemPlusTechnologies: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  // Owner tracking for per-user queries
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtuals for derived calculations
TrialSchema.virtual('plotSizeHa').get(function () {
  return this.plotSizeM2 / 10000;
});

TrialSchema.virtual('extrapolationFactor').get(function () {
  return this.plotSizeM2 > 0 ? 10000 / this.plotSizeM2 : 0;
});

TrialSchema.virtual('csiComputed').get(function () {
  const weights = [0.25, 0.20, 0.15, 0.15, 0.15, 0.10];
  const scores = [this.csi_j1, this.csi_j2, this.csi_j3, this.csi_j4, this.csi_j5, this.csi_j6];
  const sumW = weights.reduce((a, b) => a + b, 0);
  const sumWS = weights.reduce((s, w, i) => s + w * scores[i], 0);
  return sumWS / sumW;
});

TrialSchema.virtual('phase').get(function () {
  const t = this.currentSeasonIndex || 1;
  if (t <= 6) return 'Transition';
  if (t <= 12) return 'Stabilization';
  return 'Mature';
});

TrialSchema.virtual('phiMultiplier').get(function () {
  const phase = this.phase;
  if (phase === 'Transition') return 0.30;
  if (phase === 'Stabilization') return 0.70;
  return 1.00;
});

// Index for fast per-user queries
TrialSchema.index({ ownerId: 1, year: 1, season: 1 });

export default mongoose.model('Trial', TrialSchema);
