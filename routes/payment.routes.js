const { Router } = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { receiptUploader } = require('../utils/upload');
const { Payment } = require('../models/Payment');
const { User } = require('../models/User');
const { requireAuth, requireRole, blockIfMustChangePassword } = require('../middleware/auth');
const { buildReceiptNumber, generateReceiptPdf } = require('../utils/pdfGenerator');
const fs = require('fs/promises');
const path = require('path');

const router = Router();
const upload = receiptUploader();
const generatedReceiptDir = path.join(process.cwd(), 'uploads', 'receipts', 'generated');

function normalizePaymentMember(member) {
  if (!member) return null;
  if (typeof member === 'object') return member;
  return null;
}

function getPersonLabel(person, fallback = 'N/A') {
  if (!person) return fallback;
  if (typeof person === 'string') return person || fallback;
  return person.name || person.email || fallback;
}

async function getNextReceiptSequence(year) {
  const prefix = `TXC-${year}-`;
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const payments = await Payment.find({
    receiptNumber: { $regex: `^${escapedPrefix}\\d+$` }
  })
    .select('receiptNumber')
    .lean();

  let maxSequence = 0;
  payments.forEach((entry) => {
    const suffix = String(entry.receiptNumber || '').slice(prefix.length);
    const sequence = Number.parseInt(suffix, 10);
    if (Number.isFinite(sequence) && sequence > maxSequence) {
      maxSequence = sequence;
    }
  });

  return maxSequence + 1;
}

async function removeGeneratedPdf(filePath) {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (err) {
    if (!err || err.code === 'ENOENT') return;
    throw err;
  }
}

async function generateReceiptForApprovedPayment(payment, approver) {
  const approvedAt = payment.verifiedAt || new Date();
  const generatedAt = new Date();
  const paymentMember = normalizePaymentMember(payment.member);
  const memberName = getPersonLabel(paymentMember, 'Member');
  const memberEmail = paymentMember && paymentMember.email ? paymentMember.email : 'N/A';
  const membershipId = paymentMember && (paymentMember._id || paymentMember.id)
    ? String(paymentMember._id || paymentMember.id)
    : 'N/A';
  const approverName = getPersonLabel(approver, 'Admin');

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const receiptYear = generatedAt.getFullYear();
    const sequence = await getNextReceiptSequence(receiptYear);
    const receiptNumber = buildReceiptNumber(receiptYear, sequence);

    const generatedPdf = await generateReceiptPdf({
      outputDir: generatedReceiptDir,
      receiptNumber,
      memberName,
      memberEmail,
      membershipId,
      amount: payment.amount,
      paymentMethod: payment.method,
      submissionDate: payment.submittedAt || payment.createdAt || approvedAt,
      status: 'Approved',
      approvedByName: approverName,
      approvalDateTime: approvedAt,
      receiptGeneratedAt: generatedAt,
      paymentNotes: payment.notes || ''
    });

    payment.status = 'approved';
    payment.verifiedBy = approver._id;
    payment.verifiedAt = approvedAt;
    payment.rejectedReason = '';
    payment.receiptNumber = receiptNumber;
    payment.receiptPdfPath = generatedPdf.publicPath;
    payment.receiptPdfName = generatedPdf.fileName;
    payment.receiptGeneratedAt = generatedAt;
    payment.receiptGeneratedBy = approver._id;

    try {
      await payment.save();
      return payment;
    } catch (err) {
      await removeGeneratedPdf(generatedPdf.absolutePath);

      if (err && err.code === 11000 && String(err.message || '').includes('receiptNumber')) {
        continue;
      }

      throw err;
    }
  }

  throw new Error('Unable to generate a unique receipt number');
}

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

      const payment = new Payment({
        member: member._id,
        amount,
        method: 'manual',
        status: 'approved',
        notes,
        submittedBy: req.user._id,
        verifiedBy: req.user._id,
        verifiedAt: new Date()
      });

      payment.member = member;
      const savedPayment = await generateReceiptForApprovedPayment(payment, req.user);

      return res.status(201).json({ message: 'Manual payment added', payment: savedPayment });
    }

    // Member flow
    if (!req.file) {
      return res.status(400).json({ message: 'receipt file is required' });
    }

    const memberTotalFee = Number.parseInt(String(process.env.MEMBER_TOTAL_FEE || ''), 10) || 13500;
    const approvedSum = await Payment.aggregate([
      { $match: { member: req.user._id, status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const approvedTotal = approvedSum[0]?.total || 0;
    const remainingBalance = Math.max(0, memberTotalFee - approvedTotal);

    if (amount > remainingBalance) {
      return res.status(400).json({
        message: `Amount cannot exceed remaining balance of ${remainingBalance}`
      });
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

      await payment.populate('member', 'name email');
      const savedPayment = await generateReceiptForApprovedPayment(payment, req.user);

      return res.json({ message: 'Payment updated', payment: savedPayment });
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
