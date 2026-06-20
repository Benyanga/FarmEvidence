import mongoose from 'mongoose';

const { Schema } = mongoose;

const labourEntrySchema = new Schema({
  plot_id: { type: String, required: true },
  trial_season_id: { type: Schema.Types.ObjectId, ref: 'FarmSeasonRecord', required: true },
  entry_date: { type: Date, required: true },
  activity: { type: String, required: true },
  cost_type: { type: String, enum: ['C_SD', 'C_SI'], default: 'C_SD' },
  description: { type: String, default: '' },
  time_value: { type: Number, required: true, min: 0 },
  time_unit: { type: String, enum: ['seconds','minutes','hours','days'], required: true },
  workers: { type: Number, default: 1, min: 1 },
  wage_per_day: { type: Number, default: null, min: 0 },
  decimal_days: { type: Number, default: null },
  cost_plot_rwf: { type: Number, default: 0 },
}, { timestamps: true });

labourEntrySchema.index({ trial_season_id: 1, plot_id: 1 });

labourEntrySchema.pre('save', async function(next) {
  try {
    // compute decimal_days from time_value and time_unit
    const conv = {
      seconds: 1 / (8 * 3600),
      minutes: 1 / (8 * 60),
      hours: 1 / 8,
      days: 1,
    };
    this.decimal_days = (Number(this.time_value) || 0) * (conv[this.time_unit] || 0) * (Number(this.workers) || 1);

    // Determine wage rate: prefer explicit wage_per_day, else try to get from FarmSeasonRecord, else 0
    let wage = Number(this.wage_per_day);
    if (!wage) {
      try {
        const FarmSeasonRecord = mongoose.model('FarmSeasonRecord');
        const season = await FarmSeasonRecord.findById(this.trial_season_id).select('wage_rate_rwf_day');
        wage = season?.wage_rate_rwf_day || 0;
      } catch (e) {
        wage = 0;
      }
    }

    this.cost_plot_rwf = (this.decimal_days || 0) * (wage || 0);

    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model('LabourEntry', labourEntrySchema);
