// seasonModel.js
// Mongoose model for Farmer Mode season data
import mongoose from 'mongoose';

const costRowSchema = new mongoose.Schema({
  category: { type: String, required: true },
  date: String,
  input: String,
  quantity: Number,
  unit: String,
  unitCost: Number,
  totalCost: Number,
  notes: String,
});

const labourRowSchema = new mongoose.Schema({
  op: String,
  time: Number,
  timeUnit: String,
  wage: Number,
  total: Number,
  note: String,
});

const seasonSchema = new mongoose.Schema({
  farmName: { type: String, required: true },
  label: { type: String, required: true },
  year: Number,
  season: String,
  costs: { type: Object, default: {} },
  labour: { type: [labourRowSchema], default: [] },
  wageRate: Number,
  revenue: {
    yield: Number,
    price: Number,
    gross: Number,
  },
  agronomic: {
    weed: Number,
    notes: String,
  },
  computed: { type: Boolean, default: false },
  results: { type: Object, default: {} },
});

export default mongoose.model('Season', seasonSchema);
