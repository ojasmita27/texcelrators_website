const { Router } = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { User } = require('../models/User');
const { requireAuth, requireRole, blockIfMustChangePassword } = require('../middleware/auth');

const router = Router();

// Helper: generate random password for password resets (not for initial creation)
function generateTempPassword() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}

function getStatus(user) {
  return user.status || (user.active ? 'active' : 'inactive');
}

function applyStatus(user, status) {
  user.status = status;
  user.active = status === 'active';
}

function buildMemberQuery({ memberId, email }) {
  return memberId
    ? { _id: memberId, role: 'member' }
    : { email: String(email).toLowerCase().trim(), role: 'member' };
}

// Admin creates member accounts only. Members cannot self-register.
router.post(
  '/add',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { name, email, tempPassword } = req.body || {};

    if (!name || !email) {
      return res.status(400).json({ message: 'name and email are required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    let passwordToUse = tempPassword || 'Texcel@123';
    passwordToUse = String(passwordToUse).trim();

    const member = new User({
      name: String(name).trim(),
      email: normalizedEmail,
      role: 'member',
      passwordHash: 'temp',
      status: 'active',
      active: true,
      mustChangePassword: true,
      createdBy: req.user._id
    });

    await member.setPassword(passwordToUse);
    member.mustChangePassword = true;
    await member.save();

    return res.status(201).json({
      message: 'Member added',
      member: member.toSafeJSON(),
      tempPassword: passwordToUse
    });
  })
);

// Deactivate member -> cannot login until reactivated
router.post(
  '/deactivate',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { memberId, email } = req.body || {};

    if (!memberId && !email) {
      return res.status(400).json({ message: 'memberId or email is required' });
    }

    const member = await User.findOne(buildMemberQuery({ memberId, email }));
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    applyStatus(member, 'inactive');
    await member.save();

    return res.json({ message: 'Member deactivated', member: member.toSafeJSON() });
  })
);

// Remove member -> status becomes removed, account stays in DB for audit/history
router.post(
  '/remove',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { memberId, email } = req.body || {};

    if (!memberId && !email) {
      return res.status(400).json({ message: 'memberId or email is required' });
    }

    const member = await User.findOne(buildMemberQuery({ memberId, email }));
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    applyStatus(member, 'removed');
    await member.save();

    return res.json({ message: 'Member removed', member: member.toSafeJSON() });
  })
);

// Reactivate member -> status becomes active
router.post(
  '/reactivate',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { memberId, email } = req.body || {};

    if (!memberId && !email) {
      return res.status(400).json({ message: 'memberId or email is required' });
    }

    const member = await User.findOne(buildMemberQuery({ memberId, email }));
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    applyStatus(member, 'active');
    await member.save();

    return res.json({ message: 'Member reactivated', member: member.toSafeJSON() });
  })
);

// Reset password without changing membership status.
router.post(
  '/reset-password',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { memberId, email, tempPassword } = req.body || {};

    if (!memberId && !email) {
      return res.status(400).json({ message: 'memberId or email is required' });
    }

    const member = await User.findOne(buildMemberQuery({ memberId, email }));
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const passwordToUse = tempPassword || generateTempPassword();
    await member.setPassword(passwordToUse);
    member.mustChangePassword = true;
    applyStatus(member, getStatus(member));
    await member.save();

    return res.json({
      message: 'Member password reset',
      member: member.toSafeJSON(),
      tempPassword: passwordToUse
    });
  })
);

module.exports = { memberRoutes: router };
