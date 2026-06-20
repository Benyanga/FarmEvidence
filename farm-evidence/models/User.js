import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true, default: null },
  phone: { type: String, trim: true, default: null },
  passwordHash: { type: String, required: true },
  photoUrl: { type: String, default: null },
  isDemo: { type: Boolean, default: false },

  // Mode/role — set at registration, immutable without re-registering
  // (mirrors the existing mode/role concept, now tied to a real account)
  mode: { type: String, enum: ['farmer', 'researcher'], required: true },
  role: { type: String, enum: ['Farmer', 'Researcher'], required: true },

  language: { type: String, enum: ['en', 'kin'], default: 'en' },

  // Default economic parameters (Settings → Default Economic Parameters)
  defaultMarketPriceRWF: { type: Number, default: 1200 },
  defaultWageRateRWF: { type: Number, default: 1500 },
  defaultWorkingHoursPerDay: { type: Number, default: 8 },
  defaultPlotSizeM2: { type: Number, default: 100 },

  // Appearance
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
  dateFormat: { type: String, enum: ['DD/MM/YYYY', 'MM/DD/YYYY'], default: 'DD/MM/YYYY' },

  // Notification preferences (Settings → Notifications)
  notificationPrefs: {
    timeBasedReminders: { type: Boolean, default: true },
    weedPressureAlerts: { type: Boolean, default: true },
    pestIncidenceAlerts: { type: Boolean, default: true },
    bcrLossAlerts: { type: Boolean, default: true },
    deltaCUpdates: { type: Boolean, default: true },
    emailDigest: { type: Boolean, default: false }
  },

  lastLoginAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Compound index for phone+mode lookups
UserSchema.index({ phone: 1, mode: 1 });

// Hash password before save, only if it was modified
UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

UserSchema.pre('validate', function (next) {
  if (!this.email && !this.phone) {
    return next(new Error('Either email or phone is required'));
  }
  next();
});

UserSchema.pre('save', async function (next) {
  if (this.isNew && this.phone) {
    const existing = await this.constructor.findOne({
      phone: this.phone,
      mode: this.mode,
      _id: { $ne: this._id }
    });
    if (existing) {
      return next(new Error(`An account with this phone number already exists for ${this.mode} mode`));
    }
  }
  next();
});

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

// Never expose passwordHash in API responses
UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export default mongoose.model('User', UserSchema);
