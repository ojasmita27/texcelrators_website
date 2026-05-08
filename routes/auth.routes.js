const { Router } = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { signAccessToken } = require('../utils/jwt');
const { User } = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = Router();

function getUserStatus(user) {
  return user.status || (user.active ? 'active' : 'inactive');
}

// Setup route: allow creating the first admin ONLY if none exists
router.post(
  '/register-admin',
  asyncHandler(async (req, res) => {
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      return res.status(403).json({ message: 'Admin already exists' });
    }

    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, password are required' });
    }

    // normalize and trim inputs
    const normalizedEmail = String(email).toLowerCase().trim();
    const normalizedName = String(name).trim();
    const passwordToSet = String(password).trim();

    const user = new User({
      name: normalizedName,
      email: normalizedEmail,
      role: 'admin',
      passwordHash: 'temp',
      status: 'active',
      active: true,
      mustChangePassword: false
    });

    await user.setPassword(passwordToSet);
    await user.save();

    return res.status(201).json({ message: 'Admin registered', user: user.toSafeJSON() });
  })
);

// Required route: /login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password, role } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const passwordToCheck = String(password).trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const status = getUserStatus(user);
    if (status !== 'active') {
      return res.status(403).json({ message: 'User is not active' });
    }

    if (role && user.role !== role) {
    }

    const ok = await user.comparePassword(passwordToCheck);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signAccessToken({
      sub: String(user._id),
      role: user.role,
      email: user.email
    });

    return res.json({
      token,
      user: user.toSafeJSON()
    });
  })
);

// Not in the original route list, but required for "First login → force password change"
router.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body || {};

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'oldPassword and newPassword are required' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'newPassword must be at least 6 characters' });
    }

    const ok = await req.user.comparePassword(oldPassword);
    if (!ok) {
      return res.status(401).json({ message: 'Old password is incorrect' });
    }

    await req.user.setPassword(newPassword);
    req.user.mustChangePassword = false;
    await req.user.save();

    return res.json({ message: 'Password changed', user: req.user.toSafeJSON() });
  })
);

module.exports = { authRoutes: router };
