// seasonRoutes.js
// Express routes for Farmer Mode season data
import express from 'express';
import Season from './models/seasonModel.js';

const router = express.Router();

// Get all seasons for a farm
router.get('/:farmName', async (req, res) => {
  try {
    const seasons = await Season.find({ farmName: req.params.farmName }).sort({ year: 1, season: 1 });
    res.json(seasons);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add or update a season
router.post('/', async (req, res) => {
  try {
    const { farmName, label, year, season } = req.body;
    let s = await Season.findOne({ farmName, label });
    if (s) {
      Object.assign(s, req.body);
      await s.save();
    } else {
      s = new Season(req.body);
      await s.save();
    }
    res.json(s);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get a single season by farm and label
router.get('/:farmName/:label', async (req, res) => {
  try {
    const s = await Season.findOne({ farmName: req.params.farmName, label: req.params.label });
    if (!s) return res.status(404).json({ error: 'Not found' });
    res.json(s);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
