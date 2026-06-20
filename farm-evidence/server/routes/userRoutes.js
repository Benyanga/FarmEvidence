import express from 'express';
import User from '../../models/User.js';
import { requireAuth } from '../../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/auth/me — current user (derived from Clerk auth via middleware)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ clerkUserId: req.user?.clerkUserId || req.user?._id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: user.toSafeObject() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/auth/me — update profile
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const allowed = ['name', 'phone', 'photoUrl', 'language', 'theme', 'dateFormat',
      'defaultMarketPriceRWF', 'defaultWageRateRWF', 'defaultWorkingHoursPerDay', 'defaultPlotSizeM2', 'notificationPrefs'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const user = await User.findOneAndUpdate({ clerkUserId: req.user?.clerkUserId || req.user?._id }, updates, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toSafeObject());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/auth/me/email — update email (ensure uniqueness)
router.patch('/me/email', requireAuth, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const existing = await User.findOne({ email: String(email).toLowerCase(), clerkUserId: { $ne: req.user?.clerkUserId } });
    if (existing) return res.status(409).json({ error: 'This email is already in use' });
    const user = await User.findOneAndUpdate({ clerkUserId: req.user?.clerkUserId || req.user?._id }, { email: String(email).toLowerCase() }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toSafeObject());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/auth/me/password — unsupported for Clerk-managed accounts
router.patch('/me/password', requireAuth, async (_req, res) => {
  res.status(400).json({ error: 'Password changes are managed by Clerk. Use the Clerk dashboard or user settings.' });
});

// DELETE /api/auth/me — account deletion
router.delete('/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ clerkUserId: req.user?.clerkUserId || req.user?._id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isDemo) return res.status(403).json({ error: 'Demo accounts cannot be deleted' });
    await User.deleteOne({ _id: user._id });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/auth/me/export — lightweight export (user object only)
router.get('/me/export', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ clerkUserId: req.user?.clerkUserId || req.user?._id }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.setHeader('Content-Disposition', 'attachment; filename="farmevidence-export.json"');
    res.json({ exportedAt: new Date(), user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
