const mongoose = require('mongoose');
const { Schema } = mongoose;

const agronomicObservationSchema = new Schema({
  plot_id: { type: String, required: true },
  trial_season_id: {
    type: Schema.Types.ObjectId,
    ref: 'TrialSeason',
    required: true,
  },
  mode: { type: String, enum: ['research', 'farmer'], required: true },
  observed_at: {
    type: String,
    enum: ['PLANTING', 'MID_SEASON', 'HARVEST'],
    required: true,
  },
  observation_date: { type: Date, required: true },
  not_observed: { type: Boolean, default: false },

  // Soil indicators
  soil_colour_score: { type: Number, min: 1, max: 5, default: null },
  earthworm_count:   { type: Number, min: 0, default: null },
  soil_fauna_score:  { type: Number, min: 1, max: 5, default: null },
  // Derived pre-save from earthworm_count:
  // 0 → 1 | 1-2 → 2 | 3-5 → 3 | 6-10 → 4 | ≥11 → 5
  soil_structure_score: { type: Number, min: 1, max: 5, default: null },
  composite_soil_score: { type: Number, default: null },
  // Derived: (colour + fauna + structure) ÷ 3

  weed_pressure_score: { type: Number, min: 0, max: 5, default: null },
  pest_incidence_pct:  { type: Number, min: 0, max: 100, default: null },

  // Research Mode only — null in Farmer Mode
  crop_vigor_score:      { type: Number, min: 1, max: 5, default: null },
  disease_incidence_pct: { type: Number, min: 0, max: 100, default: null },
}, { timestamps: true });

// Unique constraint: one observation per plot per stage per season
agronomicObservationSchema.index(
  { trial_season_id: 1, plot_id: 1, observed_at: 1 },
  { unique: true }
);

// Pre-save: derive fauna score and composite
agronomicObservationSchema.pre('save', function(next) {
  // Fauna score from earthworm count
  if (this.earthworm_count !== null) {
    const c = this.earthworm_count;
    this.soil_fauna_score =
      c === 0 ? 1 :
      c <= 2  ? 2 :
      c <= 5  ? 3 :
      c <= 10 ? 4 : 5;
  }
  // Composite soil score
  const scores = [
    this.soil_colour_score,
    this.soil_fauna_score,
    this.soil_structure_score,
  ].filter(s => s !== null);
  if (scores.length === 3) {
    this.composite_soil_score =
      Math.round((scores.reduce((a,b) => a+b, 0) / 3) * 100) / 100;
  }
  next();
});

module.exports = mongoose.model('AgronomicObservation', agronomicObservationSchema);