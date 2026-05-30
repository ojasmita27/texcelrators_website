const { Router } = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { receiptUploader } = require('../utils/upload');
const { MemberTransaction } = require('../models/MemberTransaction');
const { User } = require('../models/User');
const { requireAuth, requireRole, blockIfMustChangePassword } = require('../middleware/auth');

const router = Router();
const upload = receiptUploader();

/**
 * POST /member-transactions/create
 * 
 * Create a new member-to-member transaction
 * - Member initiates request for reimbursement/transfer
 * - Admin can directly create approved transaction
 */
router.post(
  '/create',
  requireAuth,
  blockIfMustChangePassword,
  upload.single('receipt'),
  asyncHandler(async (req, res) => {
    const { receiverId, amount, reason, description, linkedProjectId, linkedEventId } = req.body;

    if (!receiverId || !amount || !reason) {
      return res.status(400).json({ message: 'receiverId, amount, and reason are required' });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({ message: 'amount must be positive' });
    }

    // Verify receiver exists
    const receiver = await User.findOne({ _id: receiverId, role: 'member' });
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver member not found' });
    }

    // Prevent self-transfer
    if (req.user._id.toString() === receiverId) {
      return res.status(400).json({ message: 'Cannot transfer to yourself' });
    }

    const transactionData = {
      sender: req.user._id,
      receiver: receiverId,
      amount: Number(amount),
      reason,
      description: description || '',
      status: req.user.role === 'admin' ? 'approved' : 'pending',
      initiatedBy: req.user._id,
      approvedBy: req.user.role === 'admin' ? req.user._id : null,
      approvedAt: req.user.role === 'admin' ? new Date() : null
    };

    // Add optional references
    if (linkedProjectId) transactionData.linkedProject = linkedProjectId;
    if (linkedEventId) transactionData.linkedEvent = linkedEventId;

    // Add receipt if provided
    if (req.file) {
      const uploadDir = String(process.env.RECEIPT_UPLOAD_DIR || 'uploads/receipts').replace(/\\/g, '/');
      const publicBase = uploadDir.startsWith('uploads/') ? `/${uploadDir}` : '/uploads/receipts';
      transactionData.receipt = {
        path: `${publicBase}/${req.file.filename}`,
        originalName: req.file.originalname,
        uploadedAt: new Date()
      };
    }

    const transaction = await MemberTransaction.create(transactionData);
    await transaction.populate(['sender', 'receiver', 'linkedProject', 'linkedEvent']);

    return res.status(201).json({
      message: 'Transaction created',
      transaction
    });
  })
);

/**
 * GET /member-transactions/list
 * 
 * List transactions (filtered by role)
 * - Members: see their transactions
 * - Admins: see all transactions
 */
router.get(
  '/list',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { status, limit = 100, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query = {};

    // Role-based filtering
    if (req.user.role === 'member') {
      query = {
        $or: [
          { sender: req.user._id },
          { receiver: req.user._id }
        ]
      };
    }
    // Admin sees all

    if (status) {
      query.status = status;
    }

    const transactions = await MemberTransaction.find(query)
      .populate(['sender', 'receiver', 'linkedProject', 'linkedEvent', 'approvedBy'])
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip);

    const total = await MemberTransaction.countDocuments(query);

    return res.json({
      transactions,
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
 * GET /member-transactions/:id
 * 
 * Get transaction details
 */
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const transaction = await MemberTransaction.findById(req.params.id)
      .populate(['sender', 'receiver', 'linkedProject', 'linkedEvent', 'approvedBy', 'lastModifiedBy', 'initiatedBy']);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Authorization: only participants or admin
    const isParticipant = [transaction.sender._id, transaction.receiver._id].some(
      id => id.toString() === req.user._id.toString()
    );

    if (req.user.role !== 'admin' && !isParticipant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json(transaction);
  })
);

/**
 * POST /member-transactions/:id/approve
 * 
 * Admin approves a pending transaction
 */
router.post(
  '/:id/approve',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { approvalAmount, notes } = req.body;

    const transaction = await MemberTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: `Cannot approve transaction with status: ${transaction.status}` });
    }

    transaction.status = 'approved';
    transaction.approvedBy = req.user._id;
    transaction.approvedAt = new Date();
    transaction.lastModifiedBy = req.user._id;

    if (approvalAmount) {
      transaction.amount = Number(approvalAmount);
    }
    if (notes) {
      transaction.notes = notes;
    }

    await transaction.save();
    await transaction.populate(['sender', 'receiver', 'linkedProject', 'linkedEvent', 'approvedBy']);

    return res.json({
      message: 'Transaction approved',
      transaction
    });
  })
);

/**
 * POST /member-transactions/:id/reject
 * 
 * Admin rejects a pending transaction
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

    const transaction = await MemberTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: `Cannot reject transaction with status: ${transaction.status}` });
    }

    transaction.status = 'rejected';
    transaction.rejectionReason = reason;
    transaction.approvedBy = req.user._id;
    transaction.approvedAt = new Date();
    transaction.lastModifiedBy = req.user._id;

    await transaction.save();
    await transaction.populate(['sender', 'receiver', 'linkedProject', 'linkedEvent']);

    return res.json({
      message: 'Transaction rejected',
      transaction
    });
  })
);

/**
 * POST /member-transactions/:id/settle
 * 
 * Mark transaction as settled (money paid/received)
 */
router.post(
  '/:id/settle',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { notes } = req.body;

    const transaction = await MemberTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'approved') {
      return res.status(400).json({ message: `Cannot settle transaction with status: ${transaction.status}` });
    }

    transaction.status = 'settled';
    transaction.settledAt = new Date();
    transaction.lastModifiedBy = req.user._id;

    if (notes) transaction.notes = notes;

    await transaction.save();
    await transaction.populate(['sender', 'receiver', 'linkedProject', 'linkedEvent']);

    return res.json({
      message: 'Transaction settled',
      transaction
    });
  })
);

/**
 * POST /member-transactions/:id/reimburse
 * 
 * Mark transaction as reimbursed (final settlement)
 */
router.post(
  '/:id/reimburse',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { notes } = req.body;

    const transaction = await MemberTransaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    transaction.status = 'reimbursed';
    transaction.reimbursedAt = new Date();
    transaction.lastModifiedBy = req.user._id;

    if (notes) transaction.notes = notes;

    await transaction.save();
    await transaction.populate(['sender', 'receiver', 'linkedProject', 'linkedEvent']);

    return res.json({
      message: 'Transaction marked as reimbursed',
      transaction
    });
  })
);

/**
 * GET /member-transactions/analytics/member-stats
 * 
 * Get contribution analytics for a member
 */
router.get(
  '/analytics/member-stats/:memberId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { memberId } = req.params;

    // Authorization
    const isAdmin = req.user.role === 'admin';
    const isSelf = req.user._id.toString() === memberId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const stats = await MemberTransaction.aggregate([
      {
        $facet: {
          sent: [
            {
              $match: {
                sender: require('mongoose').Types.ObjectId(memberId),
                status: { $in: ['approved', 'settled', 'reimbursed'] }
              }
            },
            {
              $group: {
                _id: null,
                totalSent: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ],
          received: [
            {
              $match: {
                receiver: require('mongoose').Types.ObjectId(memberId),
                status: { $in: ['approved', 'settled', 'reimbursed'] }
              }
            },
            {
              $group: {
                _id: null,
                totalReceived: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ],
          byReason: [
            {
              $match: {
                $or: [
                  { sender: require('mongoose').Types.ObjectId(memberId) },
                  { receiver: require('mongoose').Types.ObjectId(memberId) }
                ],
                status: { $in: ['approved', 'settled', 'reimbursed'] }
              }
            },
            {
              $group: {
                _id: '$reason',
                amount: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    return res.json({
      stats: {
        sent: stats[0].sent[0] || { totalSent: 0, count: 0 },
        received: stats[0].received[0] || { totalReceived: 0, count: 0 },
        byReason: stats[0].byReason || []
      }
    });
  })
);

const memberTransactionRoutes = router;
module.exports = { memberTransactionRoutes };
