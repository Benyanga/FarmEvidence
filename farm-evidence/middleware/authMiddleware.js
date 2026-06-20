import { requireAuth as clerkRequireAuth, getAuth } from '@clerk/express';
import User from '../models/User.js';

async function attachAppUser(req, res, next) {
  try {
    const auth = getAuth(req);
    const clerkUserId = auth.userId;
    if (!clerkUserId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let user = await User.findOne({ clerkUserId });
    if (!user) {
      const email = auth.emailAddresses?.[0]?.emailAddress || auth.email || null;
      const phone = auth.phoneNumbers?.[0]?.phoneNumber || null;
      const name = auth.fullName || auth.firstName || auth.lastName || 'Clerk User';

      user = await User.create({
        clerkUserId,
        name,
        email: email ? String(email).toLowerCase() : null,
        phone,
        passwordHash: null,
        mode: 'farmer',
        role: 'Farmer',
        language: 'en',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

function requireAuth(req, res, next) {
  const clerkAuthMiddleware = clerkRequireAuth();
  clerkAuthMiddleware(req, res, async (err) => {
    if (err) {
      return next(err);
    }
    return attachAppUser(req, res, next);
  });
}

function getAuthFn(req) {
  return getAuth(req);
}

export { requireAuth, getAuthFn };
