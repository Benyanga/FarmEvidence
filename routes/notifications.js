const router = require('express').Router();
const Notification = require('../models/Notification');
const Plot = require('../models/Plot');
const Trial = require('../models/Trial');

// Get all notifications for a trial (unread first)
router.get('/trial/:trialId', async (req, res) => {
  const notes = await Notification.find({ trialId: req.params.trialId, dismissed: false })
    .sort({ triggeredAt: -1 });
  res.json(notes);
});

// Mark as read
router.patch('/:id/read', async (req, res) => {
  const n = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
  res.json(n);
});

// Dismiss
router.patch('/:id/dismiss', async (req, res) => {
  const n = await Notification.findByIdAndUpdate(
    req.params.id,
    { dismissed: true, dismissedAt: new Date() },
    { new: true }
  );
  res.json(n);
});

// Get unread count
router.get('/trial/:trialId/count', async (req, res) => {
  const count = await Notification.countDocuments({
    trialId: req.params.trialId, dismissed: false, read: false
  });
  res.json({ count });
});

// Time-based alert check: POST /api/notifications/check/:trialId
// Call this on app load or when user opens the dashboard
router.post('/check/:trialId', async (req, res) => {
  const trial = await Trial.findById(req.params.trialId);
  const plots = await Plot.find({ trialId: req.params.trialId });
  const created = [];

  for (const plot of plots) {
    if (!plot.yieldKg) {
      const exists = await Notification.findOne({ trialId: trial._id, plotId: plot._id, trigger: 'yield_missing', dismissed: false });
      if (!exists) {
        const n = await Notification.create({ trialId: trial._id, plotId: plot._id, type: 'condition_based', trigger: 'yield_missing', severity: 'error', message: `Plot ${plot.plotId}: No yield recorded. Analysis cannot run until yield is entered.` });
        created.push(n);
      }
    }

    const weed = plot.agronomicData?.weedPressureScore;
    if (weed >= 3) {
      const exists = await Notification.findOne({ trialId: trial._id, plotId: plot._id, trigger: 'weed_pressure_high', dismissed: false });
      if (!exists) {
        const n = await Notification.create({ trialId: trial._id, plotId: plot._id, type: 'condition_based', trigger: 'weed_pressure_high', severity: 'warning', message: `High weed pressure at ${plot.plotId} (score ${weed}). Expect +15–25% weed control cost next season. Recommend early intervention.` });
        created.push(n);
      }
    }

    const pest = plot.agronomicData?.pestIncidencePct;
    if (pest >= 30) {
      const exists = await Notification.findOne({ trialId: trial._id, plotId: plot._id, trigger: 'pest_incidence_high', dismissed: false });
      if (!exists) {
        const n = await Notification.create({ trialId: trial._id, plotId: plot._id, type: 'condition_based', trigger: 'pest_incidence_high', severity: 'error', message: `Significant pest infestation at ${plot.plotId} (${pest}% affected). Yield loss risk flagged.` });
        created.push(n);
      }
    }
  }

  res.json({ checked: plots.length, created: created.length, notifications: created });
});

module.exports = router;