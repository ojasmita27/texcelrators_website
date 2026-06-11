const { Router } = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { receiptUploader } = require('../utils/upload');
const { Payment } = require('../models/Payment');
const { User } = require('../models/User');
const { requireAuth, requireRole, blockIfMustChangePassword } = require('../middleware/auth');
const { generateReceiptPdf } = require('../utils/pdfGenerator');
const { allocateReceiptNumber } = require('../utils/receiptSequence');
const { getActiveInstallmentContext } = require('../utils/membershipInstallments');
const { logInfo, logWarn, logError } = require('../utils/logger');
const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');

const router = Router();
const upload = receiptUploader();
const generatedReceiptDir = path.join(process.cwd(), 'uploads', 'receipts', 'generated');
const proofReceiptDir = path.join(process.cwd(), 'uploads', 'receipts', 'proofs');

async function ensureReceiptDirs() {
  await fs.mkdir(generatedReceiptDir, { recursive: true });
  await fs.mkdir(proofReceiptDir, { recursive: true });
}

ensureReceiptDirs().catch((err) => {
  logWarn('payments', 'Initial receipt directory setup deferred', { message: err && err.message });
});

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

function getInstallmentLabel(installmentNumber) {
  const num = Number(installmentNumber);
  if (!Number.isFinite(num) || num <= 0) return 'Membership Fee';
  return `Installment ${num}`;
}

async function getMemberApprovedTotal(memberId) {
  const approvedSum = await Payment.aggregate([
    { $match: { member: memberId, status: 'approved' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  return approvedSum[0]?.total || 0;
}

function validateInstallmentPayment(amount, installmentContext, requestedInstallmentNumber) {
  if (!installmentContext.activeInstallmentNumber) {
    return { ok: false, message: 'Membership fee is already fully paid' };
  }

  if (
    requestedInstallmentNumber
    && Number(requestedInstallmentNumber) !== installmentContext.activeInstallmentNumber
  ) {
    return {
      ok: false,
      message: `Payments must be applied to installment ${installmentContext.activeInstallmentNumber} only`
    };
  }

  if (amount > installmentContext.activeInstallmentRemaining) {
    return {
      ok: false,
      message: `Amount cannot exceed installment ${installmentContext.activeInstallmentNumber} remaining balance of ${installmentContext.activeInstallmentRemaining}`
    };
  }

  return {
    ok: true,
    installmentNumber: installmentContext.activeInstallmentNumber
  };
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

function resolveUploadAbsolutePath(publicPath) {
  if (!publicPath || typeof publicPath !== 'string') return null;
  const normalizedPublicPath = publicPath.trim().replace(/\\/g, '/');
  if (!normalizedPublicPath.startsWith('/uploads/')) return null;

  const relativePath = normalizedPublicPath.slice('/uploads/'.length);
  if (!relativePath || relativePath.includes('..')) return null;

  const absolutePath = path.normalize(path.join(process.cwd(), 'uploads', relativePath));
  const uploadsRoot = path.normalize(path.join(process.cwd(), 'uploads'));
  if (!absolutePath.startsWith(uploadsRoot)) return null;

  return absolutePath;
}

async function fileExistsAtPath(absolutePath) {
  if (!absolutePath) return false;
  try {
    await fs.access(absolutePath);
    return true;
  } catch {
    return false;
  }
}

async function findExistingOfficialPdf(payment) {
  const candidates = new Set();

  if (payment.receiptPdfPath) candidates.add(payment.receiptPdfPath);
  if (payment.receiptNumber) {
    candidates.add(`/uploads/receipts/generated/${payment.receiptNumber}.pdf`);
  }

  for (const publicPath of candidates) {
    const absolutePath = resolveUploadAbsolutePath(publicPath);
    if (absolutePath && await fileExistsAtPath(absolutePath)) {
      return { absolutePath, publicPath };
    }
  }

  return null;
}

async function buildReceiptPdfForPayment(payment, approver, receiptNumber) {
  const approvedAt = payment.verifiedAt || new Date();
  const generatedAt = payment.receiptGeneratedAt || new Date();
  const paymentMember = normalizePaymentMember(payment.member);
  const memberName = getPersonLabel(paymentMember, 'Member');
  const memberEmail = paymentMember && paymentMember.email ? paymentMember.email : 'N/A';
  const membershipId = paymentMember && (paymentMember._id || paymentMember.id)
    ? String(paymentMember._id || paymentMember.id)
    : 'N/A';
  const approverName = getPersonLabel(approver, 'Admin');
  const approverRole = approver && approver.role ? String(approver.role) : 'admin';

  await ensureReceiptDirs();

  return generateReceiptPdf({
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
    paymentNotes: payment.notes || '',
    installmentLabel: getInstallmentLabel(payment.installmentNumber),
    approverRole
  });
}

async function generateReceiptForApprovedPayment(payment, approver) {
  const approvedAt = payment.verifiedAt || new Date();
  const generatedAt = new Date();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const receiptNumber = await allocateReceiptNumber(generatedAt.getFullYear());
    const generatedPdf = await buildReceiptPdfForPayment(payment, approver, receiptNumber);

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
      logInfo('payments', 'Official receipt generated on approval', {
        paymentId: String(payment._id),
        receiptNumber,
        receiptPdfPath: generatedPdf.publicPath
      });
      return payment;
    } catch (err) {
      await removeGeneratedPdf(generatedPdf.absolutePath);

      if (err && err.code === 11000 && String(err.message || '').includes('receiptNumber')) {
        logWarn('payments', 'Receipt number collision during approval, retrying', {
          paymentId: String(payment._id),
          receiptNumber
        });
        continue;
      }

      throw err;
    }
  }

  throw new Error('Unable to generate a unique receipt number');
}

async function regenerateMissingOfficialReceipt(payment, requester) {
  if (!payment || payment.status !== 'approved' || !payment.receiptNumber) {
    return null;
  }

  if (!payment.member || typeof payment.member === 'string') {
    await payment.populate('member', 'name email');
  }

  if (!payment.verifiedBy || typeof payment.verifiedBy === 'string') {
    await payment.populate('verifiedBy', 'name email role');
  }

  const approver = payment.verifiedBy && typeof payment.verifiedBy === 'object'
    ? payment.verifiedBy
    : requester;

  const generatedPdf = await buildReceiptPdfForPayment(payment, approver, payment.receiptNumber);
  payment.receiptPdfPath = generatedPdf.publicPath;
  payment.receiptPdfName = generatedPdf.fileName;
  if (!payment.receiptGeneratedAt) {
    payment.receiptGeneratedAt = new Date();
  }
  if (!payment.receiptGeneratedBy && requester && requester._id) {
    payment.receiptGeneratedBy = requester._id;
  }

  await payment.save();
  logInfo('payments', 'Regenerated missing official receipt PDF', {
    paymentId: String(payment._id),
    receiptNumber: payment.receiptNumber,
    receiptPdfPath: generatedPdf.publicPath
  });

  return generatedPdf.absolutePath;
}

async function resolveOfficialReceiptTarget(payment, requester) {
  const existing = await findExistingOfficialPdf(payment);
  if (existing) return existing;

  if (payment.receiptNumber) {
    const regeneratedPath = await regenerateMissingOfficialReceipt(payment, requester);
    if (regeneratedPath && await fileExistsAtPath(regeneratedPath)) {
      return {
        absolutePath: regeneratedPath,
        publicPath: payment.receiptPdfPath
      };
    }
  }

  return null;
}

async function resolveProofReceiptTarget(payment) {
  if (!payment.receiptPath) return null;

  const absolutePath = resolveUploadAbsolutePath(payment.receiptPath);
  if (!absolutePath || !await fileExistsAtPath(absolutePath)) {
    return null;
  }

  return {
    absolutePath,
    publicPath: payment.receiptPath
  };
}

function authorizePaymentAccess(payment, requester) {
  const paymentMemberId = String(payment.member);
  const requesterId = String(requester._id);

  if (requester.role !== 'admin' && paymentMemberId !== requesterId) {
    return { ok: false, status: 403, message: 'Not authorized to access this receipt' };
  }

  return { ok: true };
}

function sendReceiptDownload(res, absolutePath, downloadName) {
  res.setHeader('Cache-Control', 'private, no-store');
  return res.download(absolutePath, downloadName, (err) => {
    if (err && !res.headersSent) {
      logError('payments', 'Receipt download stream failed', {
        downloadName,
        message: err && err.message
      });
      res.status(500).json({ message: 'Unable to download receipt file' });
    }
  });
}

async function handleReceiptDownload(req, res, receiptKind) {
  const { paymentId } = req.params || {};

  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    return res.status(400).json({ message: 'Invalid payment id', code: 'INVALID_PAYMENT_ID' });
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    logWarn('payments', 'Receipt download payment not found', { paymentId, receiptKind, userId: String(req.user._id) });
    return res.status(404).json({ message: 'Payment not found', code: 'PAYMENT_NOT_FOUND' });
  }

  const access = authorizePaymentAccess(payment, req.user);
  if (!access.ok) {
    logWarn('payments', 'Receipt download unauthorized', {
      paymentId,
      receiptKind,
      requesterId: String(req.user._id),
      requesterRole: req.user.role
    });
    return res.status(access.status).json({ message: access.message, code: 'NOT_AUTHORIZED' });
  }

  if (receiptKind === 'official') {
    if (payment.status !== 'approved') {
      return res.status(400).json({
        message: 'Official receipt is available only for approved payments',
        code: 'PAYMENT_NOT_APPROVED'
      });
    }

    const downloadTarget = await resolveOfficialReceiptTarget(payment, req.user);
    if (!downloadTarget || !downloadTarget.absolutePath) {
      logWarn('payments', 'Official receipt file missing', {
        paymentId,
        receiptNumber: payment.receiptNumber || null,
        receiptPdfPath: payment.receiptPdfPath || null
      });
      return res.status(404).json({
        message: 'Official receipt file was not found on the server',
        code: 'OFFICIAL_RECEIPT_MISSING'
      });
    }

    const downloadName = payment.receiptPdfName
      || (payment.receiptNumber ? `${payment.receiptNumber}.pdf` : path.basename(downloadTarget.absolutePath));

    logInfo('payments', 'Official receipt download', {
      paymentId,
      receiptNumber: payment.receiptNumber || null,
      requesterId: String(req.user._id)
    });

    return sendReceiptDownload(res, downloadTarget.absolutePath, downloadName);
  }

  const proofTarget = await resolveProofReceiptTarget(payment);
  if (!proofTarget || !proofTarget.absolutePath) {
    logWarn('payments', 'Uploaded proof file missing', {
      paymentId,
      receiptPath: payment.receiptPath || null
    });
    return res.status(404).json({
      message: 'Uploaded proof file was not found on the server',
      code: 'PROOF_RECEIPT_MISSING'
    });
  }

  const proofName = payment.receiptOriginalName || path.basename(proofTarget.absolutePath);
  logInfo('payments', 'Uploaded proof download', {
    paymentId,
    requesterId: String(req.user._id)
  });

  return sendReceiptDownload(res, proofTarget.absolutePath, proofName);
}

router.get(
  '/receipt/:paymentId/official',
  requireAuth,
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => handleReceiptDownload(req, res, 'official'))
);

router.get(
  '/receipt/:paymentId/proof',
  requireAuth,
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => handleReceiptDownload(req, res, 'proof'))
);

router.get(
  '/receipt/:paymentId',
  requireAuth,
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => handleReceiptDownload(req, res, 'official'))
);

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

      const approvedTotal = await getMemberApprovedTotal(member._id);
      const installmentContext = getActiveInstallmentContext(approvedTotal);
      const installmentValidation = validateInstallmentPayment(amount, installmentContext);

      if (!installmentValidation.ok) {
        return res.status(400).json({ message: installmentValidation.message });
      }

      const payment = new Payment({
        member: member._id,
        amount,
        installmentNumber: installmentValidation.installmentNumber,
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

    if (!req.file) {
      return res.status(400).json({ message: 'receipt file is required' });
    }

    const approvedTotal = await getMemberApprovedTotal(req.user._id);
    const installmentContext = getActiveInstallmentContext(approvedTotal);
    const requestedInstallmentNumber = Number(req.body.installmentNumber);
    const installmentValidation = validateInstallmentPayment(
      amount,
      installmentContext,
      Number.isFinite(requestedInstallmentNumber) ? requestedInstallmentNumber : null
    );

    if (!installmentValidation.ok) {
      return res.status(400).json({ message: installmentValidation.message });
    }

    const uploadDir = String(process.env.RECEIPT_UPLOAD_DIR || 'uploads/receipts').replace(/\\/g, '/');
    const publicBase = uploadDir.startsWith('uploads/') ? `/${uploadDir}` : '/uploads/receipts';
    const publicReceiptPath = `${publicBase}/${req.file.filename}`;

    const payment = await Payment.create({
      member: req.user._id,
      amount,
      installmentNumber: installmentValidation.installmentNumber,
      method: 'receipt',
      receiptPath: publicReceiptPath,
      receiptOriginalName: req.file.originalname,
      receiptUploadedAt: new Date(),
      status: 'pending',
      notes,
      submittedBy: req.user._id
    });

    logInfo('payments', 'Member payment submitted with uploaded proof', {
      paymentId: String(payment._id),
      memberId: String(req.user._id),
      receiptPath: publicReceiptPath
    });

    return res.status(201).json({ message: 'Payment submitted', payment });
  })
);

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
    }

    if (action === 'reject') {
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

module.exports = {
  paymentRoutes: router,
  resolveUploadAbsolutePath,
  generatedReceiptDir,
  resolveOfficialReceiptTarget,
  resolveProofReceiptTarget
};
