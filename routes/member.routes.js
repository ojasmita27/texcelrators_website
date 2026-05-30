const { Router } = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { User } = require('../models/User');
const { requireAuth, requireRole, blockIfMustChangePassword } = require('../middleware/auth');
const { profileUploader, certificatesUploader } = require('../utils/upload');

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

// Member self-service profile update
router.put(
  '/update-my-profile',
  requireAuth,
  requireRole('member'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const {
      name,
      phone,
      skills,
      certificates
    } = req.body || {};

    if (typeof name === 'string') {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      req.user.name = trimmedName;
    }

    if (typeof phone === 'string') {
      req.user.phone = phone.trim();
    }

    if (Array.isArray(skills)) {
      req.user.skills = skills
        .map((s) => String(s || '').trim())
        .filter(Boolean)
        .slice(0, 20);
    }

    if (Array.isArray(certificates)) {
      req.user.certificates = certificates
        .map((c) => String(c || '').trim())
        .filter(Boolean)
        .slice(0, 20);
    }

    await req.user.save();
    return res.json({
      message: 'Profile updated successfully',
      user: req.user.toSafeJSON()
    });
  })
);

// Upload profile picture (member-only)
router.post(
  '/upload-profile-pic',
  requireAuth,
  requireRole('member'),
  blockIfMustChangePassword,
  profileUploader().single('profilePic'),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Save relative URL to user
    const fileUrl = `/uploads/profile/${req.file.filename}`;
    req.user.profilePic = fileUrl;
    await req.user.save();

    return res.json({ message: 'Profile image uploaded', file: { filename: req.file.filename, url: fileUrl }, user: req.user.toSafeJSON() });
  })
);

// Upload certificates (member-only, multiple)
router.post(
  '/upload-certificates',
  requireAuth,
  requireRole('member'),
  blockIfMustChangePassword,
  certificatesUploader().array('certificates', 12),
  asyncHandler(async (req, res) => {
    if (!req.files || !req.files.length) return res.status(400).json({ message: 'No files uploaded' });

    const added = [];
    (req.files || []).forEach((f) => {
      const url = `/uploads/certificates/${f.filename}`;
      added.push({ filename: f.filename, url });
      req.user.certificates = Array.isArray(req.user.certificates) ? req.user.certificates : [];
      req.user.certificates.push(url);
    });

    req.user.certificates = Array.from(new Set(req.user.certificates)).slice(0, 20);
    await req.user.save();

    return res.json({ message: 'Certificates uploaded', files: added, user: req.user.toSafeJSON() });
  })
);

// Remove a certificate URL from the user's certificates list
router.post(
  '/remove-certificate',
  requireAuth,
  requireRole('member'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ message: 'url is required' });

    req.user.certificates = Array.isArray(req.user.certificates) ? req.user.certificates.filter((c) => c !== url) : [];
    await req.user.save();

    return res.json({ message: 'Certificate removed', user: req.user.toSafeJSON() });
  })
);

// SOP acceptance storage
router.post(
  '/accept-sop',
  requireAuth,
  requireRole('member'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { version } = req.body || {};
    req.user.sopAcceptedAt = new Date();
    req.user.sopAcceptedVersion = String(version || 'official-sop-v1');
    await req.user.save();

    return res.json({ message: 'SOP accepted', user: req.user.toSafeJSON() });
  })
);

module.exports = { memberRoutes: router };

