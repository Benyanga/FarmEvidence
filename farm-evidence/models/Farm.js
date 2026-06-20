import mongoose from 'mongoose';

const FarmSchema = new mongoose.Schema({
  farmName:      { type: String, required: true },
  ownerName:     { type: String },
  location:      { type: String },
  district:      { type: String },
  sector:        { type: String },
  totalAreaHa:   { type: Number },           // total farm size, informational

  // Creation context
  createdYear:   { type: Number, required: true },   // e.g. 2026
  createdSeason: { type: String, enum: ['A', 'B', 'C'], required: true },

  // Default economic parameters (can be overridden per season record)
  defaultMarketPriceRWF:     { type: Number, default: 1200 },
  defaultWageRateRWF:        { type: Number, default: 1500 },
  defaultWorkingHoursPerDay: { type: Number, default: 8 },
  defaultPlotSizeM2:         { type: Number, default: 100 },

  // Language preference for this farmer
  language: { type: String, enum: ['en', 'kin'], default: 'en' },

  // Adoption tracking for CA phase model (Farmer Mode still benefits from phase/CSI)
  systemType:           { type: String, default: 'CA' }, // the farmer's own system label
  adoptionStartSeason:  { type: Number, default: 1 },
  adoptionCostInitial:  { type: Number, default: 0 },

  // CSI drivers (same 6-driver model, Farmer fills these once, can update each season)
  csi_j1: { type: Number, min: 0, max: 1, default: 0.5 },
  csi_j2: { type: Number, min: 0, max: 1, default: 0.5 },
  csi_j3: { type: Number, min: 0, max: 1, default: 0.5 },
  csi_j4: { type: Number, min: 0, max: 1, default: 0.5 },
  csi_j5: { type: Number, min: 0, max: 1, default: 0.5 },
  csi_j6: { type: Number, min: 0, max: 1, default: 0.5 },

  // Owner tracking for per-user queries
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// CSI virtual — same formula as Trial
FarmSchema.virtual('csiComputed').get(function () {
  const weights = [0.25, 0.20, 0.15, 0.15, 0.15, 0.10];
  const scores  = [this.csi_j1, this.csi_j2, this.csi_j3, this.csi_j4, this.csi_j5, this.csi_j6];
  const sumW    = weights.reduce((a, b) => a + b, 0);
  const sumWS   = weights.reduce((s, w, i) => s + w * scores[i], 0);
  return sumWS / sumW;
});

// Index for fast per-owner queries
FarmSchema.index({ ownerId: 1 });

export default mongoose.model('Farm', FarmSchema);
