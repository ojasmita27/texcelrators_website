const { Router } = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const Collaboration = require('../models/Collaboration');

const router = Router();

/**
 * POST /api/collaboration
 * Submit a new collaboration inquiry
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { fullName, email, phone, college, roleInterested, skills, collaborationReason, portfolioLink } = req.body || {};

    // Validate required fields
    if (!fullName || !email || !phone || !college || !roleInterested || !skills || !collaborationReason) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Validate email format (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Normalize inputs
    const trimmedName = String(fullName).trim();
    const trimmedEmail = String(email).toLowerCase().trim();
    const trimmedPhone = String(phone).trim();
    const trimmedCollege = String(college).trim();
    const trimmedRole = String(roleInterested).trim();
    const trimmedSkills = String(skills).trim();
    const trimmedReason = String(collaborationReason).trim();
    const trimmedPortfolio = portfolioLink ? String(portfolioLink).trim() : null;

    // Validate role
    const validRoles = [
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
    if (!validRoles.includes(trimmedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role selected'
      });
    }

    // Check for duplicate submissions (same email in last 24 hours)
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

    // Create new collaboration document
    const collaboration = new Collaboration({
      fullName: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      college: trimmedCollege,
      roleInterested: trimmedRole,
      skills: trimmedSkills,
      collaborationReason: trimmedReason,
      portfolioLink: trimmedPortfolio,
      status: 'new'
    });

    await collaboration.save();

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
 * GET /api/collaboration (Optional - for future admin dashboard)
 * Get all collaboration inquiries (admin only - not implemented yet)
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    // Reserved for future admin authentication
    return res.status(501).json({
      success: false,
      message: 'Admin endpoint not yet implemented'
    });
  })
);

module.exports = { collaborationRoutes: router };
