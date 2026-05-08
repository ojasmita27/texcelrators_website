const { Router } = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { User } = require('../models/User');
const { Payment } = require('../models/Payment');
const { Expense } = require('../models/Expense');
const { requireAuth, blockIfMustChangePassword } = require('../middleware/auth');

const router = Router();

function parseIntSetting(value, fallback) {
  const n = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

// Required route: /dashboard/data
router.get(
  '/data',
  requireAuth,
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const memberTotalFee = parseIntSetting(process.env.MEMBER_TOTAL_FEE, 13500);
    const expenses = await Expense.find().sort({ date: -1 }).limit(200);

    if (req.user.role === 'admin') {
      const members = await User.find({ role: 'member' }).sort({ createdAt: -1 }).limit(500);

      const recentPayments = await Payment.find()
        .populate('member', 'name email role active')
        .sort({ submittedAt: -1 })
        .limit(300);

      const pendingPayments = recentPayments.filter((p) => p.status === 'pending');

      const totalApprovedPayments = await Payment.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const totalExpenses = await Expense.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const paymentsTotal = totalApprovedPayments[0]?.total || 0;
      const expensesTotal = totalExpenses[0]?.total || 0;

      return res.json({
        user: req.user.toSafeJSON(),
        settings: {
          memberTotalFee
        },
        members: members.map((m) => m.toSafeJSON()),
        payments: recentPayments,
        pendingPayments,
        expenses,
        summary: {
          paymentsApprovedTotal: paymentsTotal,
          expensesTotal,
          balance: paymentsTotal - expensesTotal
        }
      });
    }

    // Member view: own payments + all expenses (read-only)
    const myPayments = await Payment.find({ member: req.user._id })
      .sort({ submittedAt: -1 })
      .limit(200);

    const approvedSum = await Payment.aggregate([
      { $match: { member: req.user._id, status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return res.json({
      user: req.user.toSafeJSON(),
      settings: {
        memberTotalFee
      },
      payments: myPayments,
      expenses,
      summary: {
        myApprovedPaymentsTotal: approvedSum[0]?.total || 0
      }
    });
  })
);

module.exports = { dashboardRoutes: router };
