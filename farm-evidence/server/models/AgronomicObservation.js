import mongoose from 'mongoose';

const { Schema } = mongoose;

const agronomicObservationSchema = new Schema({
  plot_id: { type: String, required: true },
  trial_season_id: {
    type: Schema.Types.ObjectId,
    ref: 'FarmSeasonRecord',
    required: true,
  },
  mode: { type: String, enum: ['research', 'farmer'], default: 'research', required: true },
  observed_at: {
    type: String,
    enum: ['PLANTING', 'MID_SEASON', 'HARVEST'],
    required: true,
  },
  observation_date: { type: Date, required: true },
  not_observed: { type: Boolean, default: false },

  yield_kg: { type: Number, min: 0, default: null },
  yield_kg_ha: { type: Number, min: 0, default: null },
  plot_size_ha: { type: Number, min: 0, default: null },
  yield_notes: { type: String, default: '' },

  weed_pressure_score: { type: Number, min: 0, max: 5, default: null },
  weed_notes: { type: String, default: '' },

  pest_incidence_pct: { type: Number, min: 0, max: 100, default: null },
  pest_notes: { type: String, default: '' },

  disease_severity: { type: Number, min: 1, max: 5, default: null },
  disease_notes: { type: String, default: '' },

  soil_fauna_score: { type: Number, min: 1, max: 5, default: null },
  fauna_notes: { type: String, default: '' },

  soil_colour_score: { type: Number, min: 1, max: 5, default: null },
  soil_colour_munsell: { type: String, default: '' },
  soil_colour_notes: { type: String, default: '' },
  use_munsell: { type: Boolean, default: false },

  crop_vigour_score: { type: Number, min: 1, max: 5, default: null },
  crop_vigour_ndvi: { type: Number, min: 0, max: 1, default: null },
  vigour_notes: { type: String, default: '' },

  observations: { type: String, default: '' },
}, { timestamps: true });

// Unique constraint: one observation per plot per stage per season
agronomicObservationSchema.index(
  { trial_season_id: 1, plot_id: 1, observed_at: 1 },
  { unique: true }
);

// Pre-save: derive yield conversion and normalize farmer mode values
agronomicObservationSchema.pre('save', function(next) {
  if (this.yield_kg !== null && this.yield_kg !== undefined && (this.yield_kg_ha === null || this.yield_kg_ha === undefined) && this.plot_size_ha) {
    this.yield_kg_ha = Number(this.yield_kg) / Number(this.plot_size_ha);
  }

  // Farmer and research mode now retain the same indicator set for reporting.
  next();
});

export default mongoose.model('AgronomicObservation', agronomicObservationSchema);
