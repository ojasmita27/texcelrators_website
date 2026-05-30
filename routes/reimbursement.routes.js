const { Router } = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { receiptUploader } = require('../utils/upload');
const { Reimbursement } = require('../models/Reimbursement');
const { User } = require('../models/User');
const { requireAuth, requireRole, blockIfMustChangePassword } = require('../middleware/auth');

const router = Router();
const upload = receiptUploader();

/**
 * POST /reimbursements/submit
 * 
 * Member submits a reimbursement claim for component purchase
 */
router.post(
  '/submit',
  requireAuth,
  blockIfMustChangePassword,
  upload.single('receipt'),
  asyncHandler(async (req, res) => {
    const {
      itemName,
      category,
      description,
      quantity,
      unitPrice,
      vendor,
      purchaseDate,
      invoiceNumber,
      linkedProjectId
    } = req.body;

    if (!itemName || !category || !quantity || !unitPrice) {
      return res.status(400).json({
        message: 'itemName, category, quantity, and unitPrice are required'
      });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Receipt file is required' });
    }

    const quantity_num = Number(quantity);
    const unitPrice_num = Number(unitPrice);
    const totalAmount = quantity_num * unitPrice_num;

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res.status(400).json({ message: 'Invalid amount calculation' });
    }

    const uploadDir = String(process.env.RECEIPT_UPLOAD_DIR || 'uploads/receipts').replace(/\\/g, '/');
    const publicBase = uploadDir.startsWith('uploads/') ? `/${uploadDir}` : '/uploads/receipts';

    const reimbursementData = {
      member: req.user._id,
      itemName,
      category,
      description: description || '',
      quantity: quantity_num,
      unitPrice: unitPrice_num,
      totalAmount,
      vendor: vendor ? JSON.parse(vendor) : {},
      purchaseDate: purchaseDate || new Date(),
      invoiceNumber: invoiceNumber || '',
      status: 'submitted',
      submittedAt: new Date(),
      receipt: {
        path: `${publicBase}/${req.file.filename}`,
        originalName: req.file.originalname,
        uploadedAt: new Date()
      }
    };

    if (linkedProjectId) {
      reimbursementData.linkedProject = linkedProjectId;
    }

    const reimbursement = await Reimbursement.create(reimbursementData);
    await reimbursement.populate(['member', 'linkedProject']);

    return res.status(201).json({
      message: 'Reimbursement claim submitted',
      reimbursement
    });
  })
);

/**
 * GET /reimbursements/list
 * 
 * List reimbursement claims
 * - Members: see their own claims
 * - Admins: see all claims
 */
router.get(
  '/list',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { status, limit = 50, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query = {};

    if (req.user.role === 'member') {
      query.member = req.user._id;
    }

    if (status) {
      query.status = status;
    }

    const reimbursements = await Reimbursement.find(query)
      .populate(['member', 'linkedProject', 'reviewedBy'])
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip);

    const total = await Reimbursement.countDocuments(query);

    return res.json({
      reimbursements,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  })
);

/**
 * GET /reimbursements/:id
 * 
 * Get reimbursement claim details
 */
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const reimbursement = await Reimbursement.findById(req.params.id)
      .populate(['member', 'linkedProject', 'reviewedBy']);

    if (!reimbursement) {
      return res.status(404).json({ message: 'Reimbursement not found' });
    }

    // Authorization: member can see own, admin can see all
    if (req.user.role === 'member' && reimbursement.member._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json(reimbursement);
  })
);

/**
 * POST /reimbursements/:id/review
 * 
 * Admin starts reviewing a reimbursement claim
 */
router.post(
  '/:id/review',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const reimbursement = await Reimbursement.findById(req.params.id);
    if (!reimbursement) {
      return res.status(404).json({ message: 'Reimbursement not found' });
    }

    if (reimbursement.status !== 'submitted') {
      return res.status(400).json({ message: 'Can only review submitted claims' });
    }

    reimbursement.status = 'under_review';
    reimbursement.reviewedBy = req.user._id;
    reimbursement.reviewedAt = new Date();

    await reimbursement.save();
    await reimbursement.populate(['member', 'linkedProject', 'reviewedBy']);

    return res.json({
      message: 'Reimbursement moved to review',
      reimbursement
    });
  })
);

/**
 * POST /reimbursements/:id/approve
 * 
 * Admin approves a reimbursement claim
 */
router.post(
  '/:id/approve',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { approvedAmount, adminNotes } = req.body;

    const reimbursement = await Reimbursement.findById(req.params.id);
    if (!reimbursement) {
      return res.status(404).json({ message: 'Reimbursement not found' });
    }

    if (!['submitted', 'under_review'].includes(reimbursement.status)) {
      return res.status(400).json({ message: 'Can only approve submitted or under review claims' });
    }

    const finalAmount = approvedAmount ? Number(approvedAmount) : reimbursement.totalAmount;

    reimbursement.status = 'approved';
    reimbursement.approvedAmount = finalAmount;
    reimbursement.reviewedBy = req.user._id;
    reimbursement.reviewedAt = new Date();

    if (adminNotes) {
      reimbursement.adminNotes = adminNotes;
    }

    await reimbursement.save();
    await reimbursement.populate(['member', 'linkedProject', 'reviewedBy']);

    return res.json({
      message: 'Reimbursement approved',
      reimbursement
    });
  })
);

/**
 * POST /reimbursements/:id/reject
 * 
 * Admin rejects a reimbursement claim
 */
router.post(
  '/:id/reject',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'rejection reason is required' });
    }

    const reimbursement = await Reimbursement.findById(req.params.id);
    if (!reimbursement) {
      return res.status(404).json({ message: 'Reimbursement not found' });
    }

    if (!['submitted', 'under_review'].includes(reimbursement.status)) {
      return res.status(400).json({ message: 'Can only reject submitted or under review claims' });
    }

    reimbursement.status = 'rejected';
    reimbursement.rejectionReason = reason;
    reimbursement.reviewedBy = req.user._id;
    reimbursement.reviewedAt = new Date();

    await reimbursement.save();
    await reimbursement.populate(['member', 'linkedProject', 'reviewedBy']);

    return res.json({
      message: 'Reimbursement rejected',
      reimbursement
    });
  })
);

/**
 * POST /reimbursements/:id/process-reimbursement
 * 
 * Admin processes the actual reimbursement payment
 */
router.post(
  '/:id/process-reimbursement',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { reimbursedVia, notes } = req.body;

    const reimbursement = await Reimbursement.findById(req.params.id);
    if (!reimbursement) {
      return res.status(404).json({ message: 'Reimbursement not found' });
    }

    if (reimbursement.status !== 'approved') {
      return res.status(400).json({ message: 'Can only reimburse approved claims' });
    }

    reimbursement.status = 'reimbursed';
    reimbursement.reimbursedAmount = reimbursement.approvedAmount;
    reimbursement.reimbursedAt = new Date();

    if (reimbursedVia) {
      reimbursement.reimbursedVia = reimbursedVia;
    }

    if (notes) {
      reimbursement.reimbursementNotes = notes;
    }

    await reimbursement.save();
    await reimbursement.populate(['member', 'linkedProject', 'reviewedBy']);

    return res.json({
      message: 'Reimbursement processed',
      reimbursement
    });
  })
);

const reimbursementRoutes = router;
module.exports = { reimbursementRoutes };
