const { Router } = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { Expense } = require('../models/Expense');
const { requireAuth, requireRole, blockIfMustChangePassword } = require('../middleware/auth');

const router = Router();

// Required route: /add-expense (admin only)
router.post(
  '/add',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { title, amount, category, date, notes } = req.body || {};

    const parsedAmount = Number(amount);
    if (!title || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'title and positive amount are required' });
    }

    const expense = await Expense.create({
      title,
      amount: parsedAmount,
      category: category || '',
      date: date ? new Date(date) : new Date(),
      notes: notes || '',
      addedBy: req.user._id
    });

    return res.status(201).json({ message: 'Expense added', expense });
  })
);

router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await expense.deleteOne();
    return res.json({ message: 'Expense deleted' });
  })
);

// PUT /expenses/:id  — admin edits an expense (title, amount, category, notes, date)
// Preserves all existing field linkages (linkedReimbursement etc.)
router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const { title, amount, category, date, notes } = req.body || {};

    if (title !== undefined) {
      const trimmed = String(title).trim();
      if (!trimmed) return res.status(400).json({ message: 'title cannot be empty' });
      expense.title = trimmed;
    }

    if (amount !== undefined) {
      const parsed = Number(amount);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return res.status(400).json({ message: 'amount must be a positive number' });
      }
      expense.amount = parsed;
    }

    if (category !== undefined) expense.category = String(category || '').trim();
    if (notes   !== undefined) expense.notes    = String(notes   || '').trim();
    if (date    !== undefined) expense.date     = date ? new Date(date) : expense.date;

    // linkedReimbursement, isComponentPurchase, linkedProject, addedBy are intentionally NOT touched
    await expense.save();
    return res.json({ message: 'Expense updated', expense });
  })
);

module.exports = { expenseRoutes: router };
