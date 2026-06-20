// farmSetupModel.js
// Mongoose model for Farmer Mode farm setup
import mongoose from 'mongoose';

const farmSetupSchema = new mongoose.Schema({
  farmName: { type: String, required: true },
  farmerName: { type: String },
  plotSize: {
    value: { type: Number, required: true },
    unit: { type: String, enum: ['ha', 'm²'], required: true }
  },
  cropType: { type: String, enum: ['Maize', 'Beans', 'Wheat', 'Sorghum', 'Other'], required: true },
  seasonRef: {
    season: { type: String, enum: ['A', 'B', 'C'], required: true },
    year: { type: Number, required: true }
  },
  language: { type: String, enum: ['English', 'Kinyarwanda'], required: true },
  workingHoursPerDay: { type: Number, default: 8 }
});

export default mongoose.model('FarmSetup', farmSetupSchema);
