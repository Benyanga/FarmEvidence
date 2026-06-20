import mongoose from 'mongoose';

const { Schema } = mongoose;

const farmSeasonRecordSchema = new Schema({
  farm_id: { type: String, index: true },
  farmId: { type: String, index: true },
  farm_name: { type: String, index: true },
  farmName: { type: String, index: true },
  year: { type: Number, required: true },
  season: { type: String, required: true },
  season_ref: { type: String, index: true },
  cropType: String,
  crop_type: String,
  farmingSystem: String,
  farming_system: String,
  plot_m2: Number,
  plot_area_m2: Number,
  plot_size_ha: Number,
  wageRate: Number,
  wage_rate_rwf_day: Number,
  workingHoursPerDay: Number,
  marketPricePerKg: Number,
  seedPricePerKg: Number,
  seedRateKgPerPlot: Number,
  plantDensity: Number,
  status: { type: String, default: 'CONFIGURED' },
  phase: { type: String, default: 'TRANSITION' },
  seasons_elapsed: { type: Number, default: 1 },
  adoption_cost: { type: Number, default: 0 },
  plot_ids: { type: [String], default: [] },
  randomisation_layout: { type: [[String]], default: [] },
  treatments: { type: [String], default: [] },
  replications: { type: Number, default: 0 },
  costs: { type: Object, default: {} },
  revenue: { type: Object, default: {} },
  agronomics: { type: Object, default: {} },
  results: { type: Object, default: {} },
  extra: { type: Object, default: {} },
}, { timestamps: true, strict: false });

farmSeasonRecordSchema.pre('save', function (next) {
  if (!this.plot_size_ha && this.plot_m2 != null) {
    this.plot_size_ha = Number(this.plot_m2) / 10000;
  }
  if (!this.plot_size_ha && this.plot_area_m2 != null) {
    this.plot_size_ha = Number(this.plot_area_m2) / 10000;
  }
  if (!this.season_ref && this.season && this.year != null) {
    this.season_ref = `${this.season}-${this.year}`;
  }
  if (!this.farmId && this.farm_id) this.farmId = this.farm_id;
  if (!this.farm_id && this.farmId) this.farm_id = this.farmId;
  if (!this.farmName && this.farm_name) this.farmName = this.farm_name;
  if (!this.farm_name && this.farmName) this.farm_name = this.farmName;
  if (Array.isArray(this.randomisation_layout) && (!Array.isArray(this.plot_ids) || this.plot_ids.length === 0)) {
    this.plot_ids = this.randomisation_layout.flat().filter(Boolean);
  }
  next();
});

export default mongoose.model('FarmSeasonRecord', farmSeasonRecordSchema);
