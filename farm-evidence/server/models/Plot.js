import mongoose from 'mongoose';

const InputCostSchema = new mongoose.Schema({
  id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  date: Date,
  item: {
    type: String,
    enum: ['Seeds', 'Mulch', 'Compost / Manure', 'Inorganic fertilizers (NPK)', 'Pesticides'],
  },
  costType: { type: String, enum: ['C_SD', 'C_SI'] },
  quantity: Number,
  unit: String,
  unitCostRWF: Number,
  notes: String,
}, { _id: false });

const LabourCostSchema = new mongoose.Schema({
  id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
  date: Date,
  practice: {
    type: String,
    enum: [
      'Land preparation (Slashing, Tilling)',
      'Planting (labour)',
      'Residue management (Mulch application)',
      'First weeding (labour)',
      'Second weeding (labour)',
      'Irrigation (labour)',
      'Pests and Diseases control (labour)',
      'Harvesting (threshing, Winnowing)',
      'Postharvest handling (Drying, Storage)',
    ],
  },
  costType: { type: String, enum: ['C_SD', 'C_SI'] },
  numLabourers: { type: Number, default: 1 },
  time: Number,
  timeUnit: { type: String, enum: ['min', 'hr', 'day'] },
  wageRateRWFPerDay: Number,
  notes: String,
}, { _id: false });

const PlotSchema = new mongoose.Schema({
  // Trial Mode linkage (null for Farm records)
  trialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trial', default: null },
  plotId: { type: String, required: true },
  treatment: { type: String, enum: ['CA', 'CF'], default: null },
  replicate: { type: String, default: null },
  plotSizeM2: { type: Number, default: 100 },

  // Farm Mode linkage (null/unused for Trial plots)
  farmId: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', default: null },
  year: { type: Number },          // year this record belongs to (Farm Mode)
  season: { type: String, enum: ['A', 'B', 'C'] },  // season this record belongs to (Farm Mode)
  crop: { type: String },          // crop grown THIS season (Farm Mode) — drives comparison logic

  // Discriminator-style field to make queries unambiguous
  recordType: { type: String, enum: ['trial_plot', 'farm_season'], required: true },
  inputCosts: { type: [InputCostSchema], default: [] },
  labourCosts: { type: [LabourCostSchema], default: [] },
  labourDisaggregated: {
    landPreparation: Number,
    planting: Number,
    weeding: Number,
    harvesting: Number,
    residueManagement: Number,
  },
  agronomicData: { type: mongoose.Schema.Types.Mixed, default: {} },
  yieldKg: Number,
  marketPriceRWF: Number,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indices for fast lookups
PlotSchema.index({ trialId: 1, plotId: 1 }, { unique: true, sparse: true });
PlotSchema.index({ farmId: 1, year: 1, season: 1 }, { unique: true, sparse: true });

export default mongoose.model('Plot', PlotSchema);
