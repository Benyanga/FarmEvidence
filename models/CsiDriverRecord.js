const mongoose = require('mongoose');
const { Schema } = mongoose;

const csiDriverRecordSchema = new Schema({
  plot_id:          { type: String, required: true },
  trial_season_id: {
    type: Schema.Types.ObjectId,
    ref: 'TrialSeason',
    required: true,
  },
  // One set per plot per season — upsert on save
  j1_rainfall:      { type: Number, min: 0, max: 1, default: 0.5 },
  j2_soil_om:       { type: Number, min: 0, max: 1, default: 0.5 },
  j3_residue_cover: { type: Number, min: 0, max: 1, default: 0.5 },
  j4_weed_pressure: { type: Number, min: 0, max: 1, default: 0.5 },
  j5_farmer_skill:  { type: Number, min: 0, max: 1, default: 0.5 },
  j6_equipment:     { type: Number, min: 0, max: 1, default: 0.5 },
  // Computed pre-save
  csi_value: { type: Number, default: null },
  csi_level: { type: String, enum: ['LOW','MODERATE','HIGH'], default: null },
  all_drivers_set: { type: Boolean, default: false },
}, { timestamps: true });

// Weights: j1=0.25 j2=0.20 j3=0.15 j4=0.15 j5=0.15 j6=0.10
const WEIGHTS = [0.25, 0.20, 0.15, 0.15, 0.15, 0.10];

csiDriverRecordSchema.pre('save', function(next) {
  const scores = [
    this.j1_rainfall, this.j2_soil_om, this.j3_residue_cover,
    this.j4_weed_pressure, this.j5_farmer_skill, this.j6_equipment,
  ];
  const weightedSum = scores.reduce((s, v, i) => s + WEIGHTS[i] * v, 0);
  const weightTotal = WEIGHTS.reduce((a, b) => a + b, 0);
  this.csi_value = Math.round((weightedSum / weightTotal) * 1000) / 1000;
  this.csi_level =
    this.csi_value < 0.4 ? 'LOW' :
    this.csi_value < 0.7 ? 'MODERATE' : 'HIGH';
  this.all_drivers_set = scores.every(s => s !== 0.5);
  next();
});

csiDriverRecordSchema.index(
  { trial_season_id: 1, plot_id: 1 },
  { unique: true }
);

module.exports = mongoose.model('CsiDriverRecord', csiDriverRecordSchema);