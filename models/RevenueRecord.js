const mongoose = require('mongoose');
const { Schema } = mongoose;

const revenueRecordSchema = new Schema({
  plot_id:          { type: String, required: true },
  trial_season_id: {
    type: Schema.Types.ObjectId,
    ref: 'TrialSeason',
    required: true,
  },
  mode: { type: String, enum: ['research','farmer'], required: true },
  yield_raw_kg: {
    type: Number,
    required: true,
    min: 0.001,
    // Raw yield from this specific plot — never pre-filled
  },
  yield_ha_kg: {
    type: Number,
    // Computed: yield_raw_kg × extrapolation_factor
  },
  selling_price_rwf_kg: {
    type: Number,
    required: true,
    min: 0.001,
    // Price received at sale — never pre-filled
  },
  revenue_plot_rwf: {
    type: Number,
    // Computed: yield_raw_kg × selling_price
  },
  revenue_ha_rwf: {
    type: Number,
    // Computed: yield_ha_kg × selling_price
  },
}, { timestamps: true });

revenueRecordSchema.index(
  { trial_season_id: 1, plot_id: 1 },
  { unique: true }
);

revenueRecordSchema.pre('save', async function(next) {
  const season = await mongoose.model('TrialSeason')
    .findById(this.trial_season_id)
    .select('extrapolation_factor');
  this.yield_ha_kg = this.yield_raw_kg * season.extrapolation_factor;
  this.revenue_plot_rwf = this.yield_raw_kg * this.selling_price_rwf_kg;
  this.revenue_ha_rwf = this.yield_ha_kg * this.selling_price_rwf_kg;
  next();
});

module.exports = mongoose.model('RevenueRecord', revenueRecordSchema);