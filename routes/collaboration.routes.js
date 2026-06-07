const { Router } = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const Collaboration = require('../models/Collaboration');
const { requireAuth, requireRole, blockIfMustChangePassword } = require('../middleware/auth');

const router = Router();

const VALID_ROLES = [
  'Technical Team',
  'Designing Team',
  'Fabrication Team',
  'Media Team',
  'Management Team',
  'Sponsorship / Partnership',
  'Volunteer',
  'Event Collaboration',
  'Other'
];

/**
 * POST /api/collaboration
 * Submit a new collaboration inquiry
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { fullName, email, phone, college, roleInterested, skills, collaborationReason, portfolioLink } = req.body || {};

    if (!fullName || !email || !phone || !college || !roleInterested || !skills || !collaborationReason) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const trimmedName = String(fullName).trim();
    const trimmedEmail = String(email).toLowerCase().trim();
    const trimmedPhone = String(phone).trim();
    const trimmedCollege = String(college).trim();
    const trimmedRole = String(roleInterested).trim();
    const trimmedSkills = String(skills).trim();
    const trimmedReason = String(collaborationReason).trim();
    const trimmedPortfolio = portfolioLink ? String(portfolioLink).trim() : null;

    if (!VALID_ROLES.includes(trimmedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role selected'
      });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSubmission = await Collaboration.findOne({
      email: trimmedEmail,
      submittedAt: { $gte: twentyFourHoursAgo }
    });

    if (recentSubmission) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted a collaboration inquiry in the last 24 hours'
      });
    }

    const collaboration = await Collaboration.create({
      fullName: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      college: trimmedCollege,
      roleInterested: trimmedRole,
      skills: trimmedSkills,
      collaborationReason: trimmedReason,
      portfolioLink: trimmedPortfolio,
      status: 'pending'
    });

    return res.status(201).json({
      success: true,
      message: 'Welcome to the Texcelerators innovation ecosystem',
      data: {
        id: collaboration._id,
        email: collaboration.email,
        submittedAt: collaboration.submittedAt
      }
    });
  })
);

/**
 * GET /api/collaboration
 * Admin: list all collaboration requests
 */
router.get(
  '/',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const collaborations = await Collaboration.find()
      .sort({ submittedAt: -1 })
      .limit(500)
      .lean();

    return res.json({ collaborations });
  })
);

/**
 * POST /api/collaboration/:id/approve
 */
router.post(
  '/:id/approve',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const collaboration = await Collaboration.findById(req.params.id);
    if (!collaboration) {
      return res.status(404).json({ success: false, message: 'Collaboration request not found' });
    }

    collaboration.status = 'approved';
    await collaboration.save();

    return res.json({ success: true, message: 'Collaboration request approved', collaboration });
  })
);

/**
 * POST /api/collaboration/:id/reject
 */
router.post(
  '/:id/reject',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const collaboration = await Collaboration.findById(req.params.id);
    if (!collaboration) {
      return res.status(404).json({ success: false, message: 'Collaboration request not found' });
    }

    collaboration.status = 'rejected';
    await collaboration.save();

    return res.json({ success: true, message: 'Collaboration request rejected', collaboration });
  })
);

/**
 * DELETE /api/collaboration/:id
 */
router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const collaboration = await Collaboration.findById(req.params.id);
    if (!collaboration) {
      return res.status(404).json({ success: false, message: 'Collaboration request not found' });
    }

    await collaboration.deleteOne();
    return res.json({ success: true, message: 'Collaboration request deleted' });
  })
);

module.exports = { collaborationRoutes: router };
