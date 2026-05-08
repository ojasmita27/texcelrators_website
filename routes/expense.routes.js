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

module.exports = { expenseRoutes: router };
