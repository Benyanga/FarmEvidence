const router = require('express').Router();
const Trial  = require('../models/Trial');
const { requireAuth } = require('../middleware/authMiddleware');

// Create a trial
router.post('/', requireAuth, async (req, res) => {
  try {
    const trial = await Trial.create({ ...req.body, ownerId: req.user._id });
    res.status(201).json(trial);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get all trials
router.get('/', requireAuth, async (req, res) => {
  try {
    const trials = await Trial.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    res.json(trials);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get one trial
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const trial = await Trial.findById(req.params.id);
    if (!trial) return res.status(404).json({ error: 'Trial not found' });
    if (trial.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this trial' });
    res.json(trial);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Update trial parameters (market price, wage rate, etc.)
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const trial = await Trial.findById(req.params.id);
    if (!trial) return res.status(404).json({ error: 'Trial not found' });
    if (trial.ownerId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not authorized to access this trial' });
    const updated = await Trial.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
