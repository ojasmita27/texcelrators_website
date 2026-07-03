const { Router }       = require('express');
const mongoose         = require('mongoose');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth, requireRole, blockIfMustChangePassword } = require('../middleware/auth');
const { FundEntry }    = require('../models/FundEntry');
const { Payment }      = require('../models/Payment');
const { Expense }      = require('../models/Expense');
const { logInfo, logWarn } = require('../utils/logger');

const router = Router();

/* ─────────────────────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────────────────────── */

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

const VALID_SOURCE_TYPES = [
  'opening_balance',
  'principal_contribution',
  'sponsorship',
  'donation',
  'other_income'
];

const SOURCE_TYPE_LABELS = {
  opening_balance:        'Opening Balance',
  principal_contribution: 'Principal Contribution',
  sponsorship:            'Sponsorship',
  donation:               'Donation',
  other_income:           'Other Income'
};

/* ═══════════════════════════════════════════════════════
   POST /funds/add
   Admin-only — create a new fund entry.
   Safeguard: only one opening_balance entry allowed.
   ═══════════════════════════════════════════════════════ */
router.post(
  '/add',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { amount, sourceType, description, date } = req.body || {};

    /* ── Field validation ── */
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'amount must be a positive number' });
    }

    if (!sourceType || !VALID_SOURCE_TYPES.includes(sourceType)) {
      return res.status(400).json({
        message: `sourceType must be one of: ${VALID_SOURCE_TYPES.join(', ')}`
      });
    }

    const trimmedDescription = String(description || '').trim();
    if (!trimmedDescription) {
      return res.status(400).json({ message: 'description is required' });
    }

    /* ── Opening Balance uniqueness safeguard ── */
    if (sourceType === 'opening_balance') {
      const existing = await FundEntry.findOne({ sourceType: 'opening_balance' });
      if (existing) {
        return res.status(409).json({
          message: 'An Opening Balance entry already exists. Edit the existing entry instead.',
          existingId: String(existing._id)
        });
      }
    }

    const entry = await FundEntry.create({
      amount:      parsedAmount,
      sourceType,
      description: trimmedDescription,
      date:        date ? new Date(date) : new Date(),
      addedBy:     req.user._id
    });

    await entry.populate('addedBy', 'name email role');

    logInfo('funds', 'Fund entry created', {
      entryId:    String(entry._id),
      sourceType: entry.sourceType,
      amount:     entry.amount,
      addedBy:    String(req.user._id)
    });

    return res.status(201).json({ message: 'Fund entry added', entry });
  })
);

/* ═══════════════════════════════════════════════════════
   GET /funds
   Admin-only — list all fund entries, newest first.
   ═══════════════════════════════════════════════════════ */
router.get(
  '/',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const entries = await FundEntry
      .find()
      .populate('addedBy',     'name email role')
      .populate('lastEditedBy','name email role')
      .sort({ date: -1, createdAt: -1 })
      .lean();

    /* Compute running total for the response */
    const total = entries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    return res.json({ entries, total });
  })
);

/* ═══════════════════════════════════════════════════════
   GET /funds/balance
   Admin-only — returns synchronized balance calculation.
   Uses the same formula as Dashboard Overview for consistency.
   balance = fundEntriesTotal + approvedPayments - expenses
   ═══════════════════════════════════════════════════════ */
router.get(
  '/balance',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    // Calculate fund entries total
    let fundEntriesTotal = 0;
    try {
      const fundAgg = await FundEntry.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      fundEntriesTotal = fundAgg[0]?.total || 0;
    } catch (_) {
      fundEntriesTotal = 0;
    }

    // Calculate approved payments total
    const paymentAgg = await Payment.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const paymentsTotal = paymentAgg[0]?.total || 0;

    // Calculate expenses total
    const expenseAgg = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const expensesTotal = expenseAgg[0]?.total || 0;

    const balance = fundEntriesTotal + paymentsTotal - expensesTotal;

    return res.json({
      fundEntriesTotal,
      paymentsTotal,
      expensesTotal,
      balance
    });
  })
);

/* ═══════════════════════════════════════════════════════
   PUT /funds/:id
   Admin-only — edit an existing fund entry.
   Preserves full audit trail (addedBy, createdAt stay intact;
   lastEditedBy and updatedAt are written).
   Safeguard: if changing type TO opening_balance, check uniqueness.
   ═══════════════════════════════════════════════════════ */
router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: 'Invalid fund entry id' });
    }

    const entry = await FundEntry.findById(id);
    if (!entry) {
      return res.status(404).json({ message: 'Fund entry not found' });
    }

    const { amount, sourceType, description, date } = req.body || {};

    /* ── Amount ── */
    if (amount !== undefined) {
      const parsed = Number(amount);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return res.status(400).json({ message: 'amount must be a positive number' });
      }
      entry.amount = parsed;
    }

    /* ── sourceType ── */
    if (sourceType !== undefined) {
      if (!VALID_SOURCE_TYPES.includes(sourceType)) {
        return res.status(400).json({
          message: `sourceType must be one of: ${VALID_SOURCE_TYPES.join(', ')}`
        });
      }
      /* Opening Balance uniqueness: only block if changing to OB and it's not already OB */
      if (sourceType === 'opening_balance' && entry.sourceType !== 'opening_balance') {
        const existing = await FundEntry.findOne({
          sourceType: 'opening_balance',
          _id: { $ne: entry._id }
        });
        if (existing) {
          return res.status(409).json({
            message: 'An Opening Balance entry already exists. Only one is allowed.',
            existingId: String(existing._id)
          });
        }
      }
      entry.sourceType = sourceType;
    }

    /* ── Description ── */
    if (description !== undefined) {
      const trimmed = String(description).trim();
      if (!trimmed) {
        return res.status(400).json({ message: 'description cannot be empty' });
      }
      entry.description = trimmed;
    }

    /* ── Date ── */
    if (date !== undefined) {
      entry.date = date ? new Date(date) : entry.date;
    }

    /* ── Audit: record who last edited ── */
    entry.lastEditedBy = req.user._id;

    await entry.save();
    await entry.populate([
      { path: 'addedBy',      select: 'name email role' },
      { path: 'lastEditedBy', select: 'name email role' }
    ]);

    logInfo('funds', 'Fund entry updated', {
      entryId:    String(entry._id),
      sourceType: entry.sourceType,
      amount:     entry.amount,
      editedBy:   String(req.user._id)
    });

    return res.json({ message: 'Fund entry updated', entry });
  })
);

/* ═══════════════════════════════════════════════════════
   DELETE /funds/:id
   Admin-only — permanently remove a fund entry.
   ═══════════════════════════════════════════════════════ */
router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isValidId(id)) {
      return res.status(400).json({ message: 'Invalid fund entry id' });
    }

    const entry = await FundEntry.findById(id);
    if (!entry) {
      return res.status(404).json({ message: 'Fund entry not found' });
    }

    logInfo('funds', 'Fund entry deleted', {
      entryId:    String(entry._id),
      sourceType: entry.sourceType,
      amount:     entry.amount,
      deletedBy:  String(req.user._id)
    });

    await entry.deleteOne();
    return res.json({ message: 'Fund entry deleted' });
  })
);

module.exports = { fundRoutes: router, SOURCE_TYPE_LABELS };
