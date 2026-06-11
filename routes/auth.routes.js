const { Router } = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { signAccessToken } = require('../utils/jwt');
const { User } = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { logInfo, logWarn, logError } = require('../utils/logger');

const router = Router();

function getUserStatus(user) {
  return user.status || (user.active ? 'active' : 'inactive');
}

function normalizeEmail(email) {
  return String(email || '').toLowerCase().trim();
}

function normalizePassword(password) {
  return String(password || '').trim();
}

function loginFailure(res, status, message, code, meta = {}) {
  logWarn('auth/login', message, meta);
  return res.status(status).json({ message, code });
}

router.post(
  '/register-admin',
  asyncHandler(async (req, res) => {
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      return res.status(403).json({ message: 'Admin already exists', code: 'ADMIN_EXISTS' });
    }

    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, password are required', code: 'VALIDATION_ERROR' });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedName = String(name).trim();
    const passwordToSet = normalizePassword(password);

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

    logInfo('auth/register-admin', 'Initial admin registered', { email: normalizedEmail });
    return res.status(201).json({ message: 'Admin registered', user: user.toSafeJSON() });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password, role } = req.body || {};
    const normalizedEmail = normalizeEmail(email);
    const passwordToCheck = normalizePassword(password);
    const requestedRole = role ? String(role).trim().toLowerCase() : '';

    if (!normalizedEmail || !passwordToCheck) {
      return res.status(400).json({
        message: 'email and password are required',
        code: 'VALIDATION_ERROR'
      });
    }

    const matchingUsers = await User.find({ email: normalizedEmail }).limit(5);
    if (matchingUsers.length > 1) {
      logError('auth/login', 'Duplicate user records found for email', {
        email: normalizedEmail,
        count: matchingUsers.length
      });
    }

    const user = matchingUsers[0];
    if (!user) {
      return loginFailure(res, 401, 'No account found for this email address', 'USER_NOT_FOUND', {
        email: normalizedEmail
      });
    }

    const status = getUserStatus(user);
    if (status !== 'active') {
      return loginFailure(res, 403, 'User account is not active', 'USER_INACTIVE', {
        email: normalizedEmail,
        status
      });
    }

    if (requestedRole && user.role !== requestedRole) {
      return loginFailure(res, 403, `Selected role "${requestedRole}" does not match account role "${user.role}"`, 'ROLE_MISMATCH', {
        email: normalizedEmail,
        requestedRole,
        accountRole: user.role
      });
    }

    if (!user.passwordHash || user.passwordHash === 'temp') {
      return loginFailure(res, 401, 'Password is not configured for this account', 'PASSWORD_NOT_SET', {
        email: normalizedEmail
      });
    }

    let passwordMatches = false;
    try {
      passwordMatches = await user.comparePassword(passwordToCheck);
    } catch (err) {
      logError('auth/login', 'Password comparison failed', {
        email: normalizedEmail,
        message: err && err.message
      });
      return res.status(500).json({
        message: 'Unable to verify password at this time',
        code: 'PASSWORD_CHECK_FAILED'
      });
    }

    if (!passwordMatches) {
      return loginFailure(res, 401, 'Password does not match this account', 'PASSWORD_MISMATCH', {
        email: normalizedEmail
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    let token;
    try {
      token = signAccessToken({
        sub: String(user._id),
        role: user.role,
        email: user.email
      });
    } catch (err) {
      logError('auth/login', 'JWT generation failed', {
        email: normalizedEmail,
        message: err && err.message
      });
      return res.status(500).json({
        message: 'Unable to create login session',
        code: 'JWT_GENERATION_FAILED'
      });
    }

    logInfo('auth/login', 'Login successful', {
      email: normalizedEmail,
      userId: String(user._id),
      role: user.role
    });

    return res.json({
      token,
      user: user.toSafeJSON()
    });
  })
);

router.post(
  '/change-password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body || {};

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'oldPassword and newPassword are required', code: 'VALIDATION_ERROR' });
    }

    if (String(newPassword).trim().length < 6) {
      return res.status(400).json({ message: 'newPassword must be at least 6 characters', code: 'VALIDATION_ERROR' });
    }

    const ok = await req.user.comparePassword(normalizePassword(oldPassword));
    if (!ok) {
      return res.status(401).json({ message: 'Old password is incorrect', code: 'PASSWORD_MISMATCH' });
    }

    await req.user.setPassword(normalizePassword(newPassword));
    req.user.mustChangePassword = false;
    await req.user.save();

    logInfo('auth/change-password', 'Password changed', { userId: String(req.user._id) });
    return res.json({ message: 'Password changed', user: req.user.toSafeJSON() });
  })
);

module.exports = { authRoutes: router };
