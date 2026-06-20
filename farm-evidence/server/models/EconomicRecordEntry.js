import mongoose from 'mongoose';

const { Schema } = mongoose;

const economicRecordEntrySchema = new Schema({
  plot_id: {
    type: String,
    required: true,
    // Research Mode: "CAR1", "CFR2" etc.
    // Farmer Mode: farm_season_id as string
  },
  trial_season_id: {
    type: Schema.Types.ObjectId,
    ref: 'FarmSeasonRecord',
    required: true,
  },
  mode: {
    type: String,
    enum: ['research', 'farmer'],
    required: true,
  },
  entry_date: {
    type: Date,
    required: true,
  },
  item_activity: {
    type: String,
    required: true,
    maxlength: 200,
  },
  category: {
    type: String,
    enum: ['SDC', 'SIC'],
    required: true,
    default: 'SDC',
  },
  sub_category: {
    type: String,
    enum: [
      // SDC sub-categories
      'Labour', 'Tillage', 'Fertilizer', 'Pesticide',
      'Irrigation', 'Residue', 'Other_SDC',
      // SIC sub-categories
      'Land_rent', 'Taxes', 'Transport', 'Storage',
      'Loan', 'Family_labour', 'Extension', 'Other_SIC',
    ],
    required: true,
  },
  unit: {
    type: String,
    required: function() { return this.category === 'SDC'; },
  },
  quantity: {
    type: Number,
    min: 0,
    required: function() { return this.category === 'SDC'; },
  },
  // Labour-only fields
  time_unit: {
    type: String,
    enum: ['seconds', 'minutes', 'hours', 'days'],
    default: null,
  },
  workers: {
    type: Number,
    default: 1,
    min: 1,
  },
  decimal_days: {
    type: Number,
    default: null,
    // Computed by backend before save for Labour entries:
    // seconds → qty ÷ (8 × 3600) × workers
    // minutes → qty ÷ (8 × 60) × workers
    // hours   → qty ÷ 8 × workers
    // days    → qty × workers
  },
  unit_cost_rwf: {
    type: Number,
    min: 0,
    required: function() { return this.category === 'SDC'; },
  },
  total_plot_rwf: {
    type: Number,
    // Computed: quantity × unit_cost_rwf
    // For Labour: decimal_days × wage_rate (from parent TrialSeason)
  },
  total_ha_rwf: {
    type: Number,
    default: null,
    // Computed: total_plot_rwf × extrapolation_factor
    // NULL for all SIC entries — never computed
  },
  note: {
    type: String,
    required: function() {
      return ['Other_SDC', 'Other_SIC'].includes(this.sub_category);
    },
  },
}, { timestamps: true });

// Indexes
economicRecordEntrySchema.index({ trial_season_id: 1, plot_id: 1 });
economicRecordEntrySchema.index({ trial_season_id: 1, category: 1 });
economicRecordEntrySchema.index({ trial_season_id: 1, sub_category: 1 });

// Pre-save hook: compute decimal_days, total_plot_rwf, total_ha_rwf
economicRecordEntrySchema.pre('save', async function(next) {
  try {
    // Compute decimal_days for Labour
    if (this.sub_category === 'Labour' && this.time_unit) {
      const conv = {
        seconds: 1 / (8 * 3600),
        minutes: 1 / (8 * 60),
        hours: 1 / 8,
        days: 1,
      };
      this.decimal_days = this.quantity * conv[this.time_unit] * this.workers;
    }

    // Get extrapolation_factor and wage_rate from parent TrialSeason
    const TrialSeason = mongoose.model('FarmSeasonRecord');
    const season = await TrialSeason
      .findById(this.trial_season_id)
      .select('extrapolation_factor wage_rate_rwf_day plot_m2');

    if (!season) {
      return next(new Error('Trial season not found'));
    }

    // Compute total_plot_rwf
    if (this.sub_category === 'Labour' && this.decimal_days != null) {
      this.total_plot_rwf = this.decimal_days * (season.wage_rate_rwf_day || 0);
    } else {
      this.total_plot_rwf = (this.quantity || 0) * (this.unit_cost_rwf || 0);
    }

    // Compute total_ha_rwf (SDC only)
    if (this.category === 'SDC' && season.extrapolation_factor) {
      this.total_ha_rwf = this.total_plot_rwf * season.extrapolation_factor;
    } else {
      this.total_ha_rwf = null; // SIC entries never get a per-ha value
    }

    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model('EconomicRecordEntry', economicRecordEntrySchema);
