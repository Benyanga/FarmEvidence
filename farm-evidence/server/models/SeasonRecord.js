import mongoose from 'mongoose';

const SeasonRecordSchema = new mongoose.Schema({
  trialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trial', required: true },
  treatment: { type: String, required: true },
  seasonIndex: { type: Number, required: true },
  phase: { type: String, enum: ['Transition', 'Stabilization', 'Mature'] },
  phi: Number,
  csi: Number,

  // Cost tiers
  cBase: Number,
  cSys: Number,
  cTime: Number,
  cAdopt: Number,
  cTotal: Number,

  // Outputs
  revenue: Number,
  profit: Number,
  roi: Number,
  cbr: Number,
  cpu: Number,
  yieldKgHa: Number,
  deltaC: Number,

  // Scenario outputs
  profitWorstCase: Number,
  profitBaseCase: Number,
  profitBestCase: Number,
  expectedProfit: Number,
  profitVariance: Number,
  profitStdDev: Number,
  scenarioWeights: {
    best: Number,
    normal: Number,
    worst: Number,
  },

  // CNB (cumulative — computed at save time)
  cnbThisSeason: Number,
  cnbCumulative: Number,

  // TTP reached this season?
  ttpReachedThisSeason: { type: Boolean, default: false },

  closedAt: { type: Date, default: Date.now },
});

SeasonRecordSchema.index({ trialId: 1, treatment: 1, seasonIndex: 1 }, { unique: true });

export default mongoose.model('SeasonRecord', SeasonRecordSchema);
