import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  trialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trial', required: true },
  plotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plot' },
  type: { type: String, enum: ['time_based', 'condition_based', 'system'], required: true },
  trigger: { type: String, required: true },
  severity: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' },
  message: { type: String, required: true },
  dismissed: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
  triggeredAt: { type: Date, default: Date.now },
  dismissedAt: { type: Date },
});

export default mongoose.model('Notification', NotificationSchema);
