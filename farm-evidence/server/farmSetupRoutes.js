// farmSetupRoutes.js
// Express routes for Farmer Mode farm setup
import express from 'express';
import FarmSetup from './models/farmSetupModel.js';

const router = express.Router();

// Create or update farm setup (one per user/farm)
router.post('/', async (req, res) => {
  try {
    const { farmName, farmerName, plotSize, cropType, seasonRef, language, workingHoursPerDay } = req.body;
    let setup = await FarmSetup.findOne({ farmName });
    if (setup) {
      setup.farmerName = farmerName;
      setup.plotSize = plotSize;
      setup.cropType = cropType;
      setup.seasonRef = seasonRef;
      setup.language = language;
      setup.workingHoursPerDay = workingHoursPerDay;
      await setup.save();
    } else {
      setup = new FarmSetup({ farmName, farmerName, plotSize, cropType, seasonRef, language, workingHoursPerDay });
      await setup.save();
    }
    res.json(setup);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get farm setup by farm name
router.get('/:farmName', async (req, res) => {
  try {
    const setup = await FarmSetup.findOne({ farmName: req.params.farmName });
    if (!setup) return res.status(404).json({ error: 'Not found' });
    res.json(setup);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
