const router = require('express').Router();
const Plot   = require('../models/Plot');
const Trial  = require('../models/Trial');
const { requireAuth } = require('../middleware/authMiddleware');

// Create or upsert a plot
router.post('/', requireAuth, async (req, res) => {
  try {
    const plot = await Plot.create(req.body);
    res.status(201).json(plot);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get all plots for a trial
router.get('/trial/:trialId', requireAuth, async (req, res) => {
  try {
    const trial = await Trial.findById(req.params.trialId);
    if (!trial) return res.status(404).json({ error: 'Trial not found' });
    if (trial.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this trial' });
    const plots = await Plot.find({ trialId: req.params.trialId });
    res.json(plots);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get single plot
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const plot = await Plot.findById(req.params.id);
    if (!plot) return res.status(404).json({ error: 'Plot not found' });
    // Verify ownership via trial
    const trial = await Trial.findById(plot.trialId);
    if (trial && trial.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this plot' });
    res.json(plot);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Update plot data (add/replace input or labour rows, yield)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const plot = await Plot.findById(req.params.id);
    if (!plot) return res.status(404).json({ error: 'Plot not found' });
    // Verify ownership via trial
    const trial = await Trial.findById(plot.trialId);
    if (trial && trial.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this plot' });
    const updated = await Plot.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Add an input cost row
router.post('/:id/inputs', requireAuth, async (req, res) => {
  try {
    const plot = await Plot.findById(req.params.id);
    if (!plot) return res.status(404).json({ error: 'Plot not found' });
    // Verify ownership via trial
    const trial = await Trial.findById(plot.trialId);
    if (trial && trial.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this plot' });
    plot.inputCosts.push(req.body);
    await plot.save();
    res.json(plot);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Add a labour cost row
router.post('/:id/labour', requireAuth, async (req, res) => {
  try {
    const plot = await Plot.findById(req.params.id);
    if (!plot) return res.status(404).json({ error: 'Plot not found' });
    // Verify ownership via trial
    const trial = await Trial.findById(plot.trialId);
    if (trial && trial.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this plot' });
    plot.labourCosts.push(req.body);
    await plot.save();
    res.json(plot);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Update yield
router.patch('/:id/yield', requireAuth, async (req, res) => {
  try {
    const plot = await Plot.findById(req.params.id);
    if (!plot) return res.status(404).json({ error: 'Plot not found' });
    // Verify ownership via trial
    const trial = await Trial.findById(plot.trialId);
    if (trial && trial.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this plot' });
    const { yieldKg, marketPriceRWF } = req.body;
    const update = {};
    if (yieldKg !== undefined) update.yieldKg = yieldKg;
    if (marketPriceRWF !== undefined) update.marketPriceRWF = marketPriceRWF;
    const updated = await Plot.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
