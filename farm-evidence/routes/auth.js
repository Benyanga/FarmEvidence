import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Trial from '../server/models/Trial.js';
import Farm from '../models/Farm.js';
import Plot from '../server/models/Plot.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

function issueToken(user) {
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, mode, role, language } = req.body;

    if (!name || !password || !mode || !role) {
      return res.status(400).json({ error: 'Name, password, mode, and role are required' });
    }
    if (!email && !phone) {
      return res.status(400).json({ error: 'Either an email or a phone number is required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) return res.status(409).json({ error: 'An account with this email already exists' });
    }
    if (phone) {
      const existingPhone = await User.findOne({ phone, mode });
      if (existingPhone) {
        return res.status(409).json({ error: `An account with this phone number already exists for ${mode} mode` });
      }
    }

    const user = await User.create({
      name,
      email: email ? email.toLowerCase() : null,
      phone: phone || null,
      passwordHash: password,
      mode,
      role,
      language: language || 'en'
    });

    const token = issueToken(user);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/auth/login
// Accepts EITHER an email or a phone number as `identifier`.
// `mode` is REQUIRED because phone numbers are only unique per-mode
// (this matches the UI flow: mode is always selected before login/demo).
router.post('/login', async (req, res) => {
  try {
    const { identifier, password, mode } = req.body;
    if (!identifier || !password || !mode) {
      return res.status(400).json({ error: 'Identifier, password, and mode are required' });
    }

    const isEmailFormat = identifier.includes('@');
    const query = isEmailFormat
      ? { email: identifier.toLowerCase(), mode }
      : { phone: identifier, mode };

    const user = await User.findOne(query);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    user.lastLoginAt = new Date();
    await user.save();

    const token = issueToken(user);
    res.json({ token, user: user.toSafeObject() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/auth/me — current user from token
router.get('/me', requireAuth, async (req, res) => {
  res.json(req.user.toSafeObject());
});

// PATCH /api/auth/me — update profile fields
router.patch('/me', requireAuth, async (req, res) => {
  const allowed = ['name', 'phone', 'photoUrl', 'language', 'theme', 'dateFormat',
    'defaultMarketPriceRWF', 'defaultWageRateRWF',
    'defaultWorkingHoursPerDay', 'defaultPlotSizeM2',
    'notificationPrefs'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
  res.json(user.toSafeObject());
});

// PATCH /api/auth/me/email — separate endpoint since it requires uniqueness check
router.patch('/me/email', requireAuth, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.user._id } });
  if (existing) return res.status(409).json({ error: 'This email is already in use' });

  const user = await User.findByIdAndUpdate(req.user._id, { email: email.toLowerCase() }, { new: true });
  res.json(user.toSafeObject());
});

// PATCH /api/auth/me/password — security settings
router.patch('/me/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(req.user._id);
    const valid = await user.comparePassword(currentPassword);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    user.passwordHash = newPassword; // re-hashed by pre-save hook
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/auth/me — account deletion (Settings → Data & Privacy)
router.delete('/me', requireAuth, async (req, res) => {
  try {
    if (req.user.isDemo) {
      return res.status(403).json({ error: 'Demo accounts cannot be deleted. This is shared sandbox data for presentations.' });
    }

    const { password } = req.body;
    const user = await User.findById(req.user._id);
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ error: 'Password is incorrect' });

    // Note: this does NOT cascade-delete the user's Trials/Farms by default.
    // ADD cascade logic here if full data deletion is required:
    //   await Trial.deleteMany({ ownerId: user._id });
    //   await Farm.deleteMany({ ownerId: user._id });
    await User.deleteOne({ _id: user._id });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/auth/me/export — data export (Settings → Data & Privacy)
router.get('/me/export', requireAuth, async (req, res) => {
  const trials = await Trial.find({ ownerId: req.user._id }).lean();
  const farms = await Farm.find({ ownerId: req.user._id }).lean();
  const trialIds = trials.map((t) => t._id);
  const farmIds = farms.map((f) => f._id);
  const plots = await Plot.find({
    $or: [{ trialId: { $in: trialIds } }, { farmId: { $in: farmIds } }]
  }).lean();

  res.setHeader('Content-Disposition', 'attachment; filename="farmevidence-export.json"');
  res.json({
    exportedAt: new Date(),
    user: req.user.toSafeObject(),
    trials,
    farms,
    plots
  });
});

export default router;
