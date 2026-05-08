const { Router } = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { receiptUploader } = require('../utils/upload');
const { Payment } = require('../models/Payment');
const { User } = require('../models/User');
const { requireAuth, requireRole, blockIfMustChangePassword } = require('../middleware/auth');

const router = Router();
const upload = receiptUploader();

// Required route: /add-payment
// - Member: submits payment with receipt (pending)
// - Admin: adds manual payment for a member (auto-approved)
router.post(
  '/add',
  requireAuth,
  blockIfMustChangePassword,
  upload.single('receipt'),
  asyncHandler(async (req, res) => {
    const amount = Number(req.body.amount);
    const notes = req.body.notes || '';

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'amount must be a positive number' });
    }

    if (req.user.role === 'admin') {
      const { memberId, isManual } = req.body || {};
      if (!memberId) {
        return res.status(400).json({ message: 'memberId is required for admin manual payments' });
      }

      if (String(isManual).toLowerCase() !== 'true') {
        return res.status(400).json({ message: 'Set isManual=true for admin manual payments' });
      }

      const member = await User.findOne({ _id: memberId, role: 'member' });
      if (!member) {
        return res.status(404).json({ message: 'Member not found' });
      }

      const payment = await Payment.create({
        member: member._id,
        amount,
        method: 'manual',
        status: 'approved',
        notes,
        submittedBy: req.user._id,
        verifiedBy: req.user._id,
        verifiedAt: new Date()
      });

      return res.status(201).json({ message: 'Manual payment added', payment });
    }

    // Member flow
    if (!req.file) {
      return res.status(400).json({ message: 'receipt file is required' });
    }

    // Public URL path (server serves local ./uploads at /uploads)
    // Default RECEIPT_UPLOAD_DIR=uploads/receipts -> public path /uploads/receipts/<file>
    const uploadDir = String(process.env.RECEIPT_UPLOAD_DIR || 'uploads/receipts').replace(/\\/g, '/');
    const publicBase = uploadDir.startsWith('uploads/') ? `/${uploadDir}` : '/uploads/receipts';
    const publicReceiptPath = `${publicBase}/${req.file.filename}`;

    const payment = await Payment.create({
      member: req.user._id,
      amount,
      method: 'receipt',
      receiptPath: publicReceiptPath,
      receiptOriginalName: req.file.originalname,
      status: 'pending',
      notes,
      submittedBy: req.user._id
    });

    return res.status(201).json({ message: 'Payment submitted', payment });
  })
);

// Required route: /verify-payment (admin only)
router.post(
  '/verify',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { paymentId, action, rejectedReason, notes } = req.body || {};

    if (!paymentId || !action) {
      return res.status(400).json({ message: 'paymentId and action are required' });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (action === 'approve') {
      payment.status = 'approved';
      payment.verifiedBy = req.user._id;
      payment.verifiedAt = new Date();
      payment.rejectedReason = '';
    } else if (action === 'reject') {
      payment.status = 'rejected';
      payment.verifiedBy = req.user._id;
      payment.verifiedAt = new Date();
      payment.rejectedReason = rejectedReason || 'Rejected';
    } else {
      return res.status(400).json({ message: "action must be 'approve' or 'reject'" });
    }

    if (typeof notes === 'string') {
      payment.notes = notes;
    }

    await payment.save();

    return res.json({ message: 'Payment updated', payment });
  })
);

module.exports = { paymentRoutes: router };
