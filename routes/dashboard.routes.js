const { Router } = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { User } = require('../models/User');
const { Payment } = require('../models/Payment');
const { Expense } = require('../models/Expense');

// NEW: Import enterprise financial models
const mongoose = require('mongoose');
let MemberTransaction, Reimbursement, Project, Event, Collaboration;

try {
  MemberTransaction = require('../models/MemberTransaction').MemberTransaction;
  Reimbursement = require('../models/Reimbursement').Reimbursement;
  Project = require('../models/Project').Project;
  Event = require('../models/Event').Event;
  Collaboration = require('../models/Collaboration');
} catch (err) {
  // Models might not be loaded yet in some scenarios
  console.log('Note: Enterprise models not fully available');
}

const { requireAuth, blockIfMustChangePassword } = require('../middleware/auth');

const router = Router();

const paymentSelect = [
  'member',
  'amount',
  'installmentNumber',
  'method',
  'receiptPath',
  'receiptOriginalName',
  'receiptNumber',
  'receiptPdfPath',
  'receiptPdfName',
  'receiptGeneratedAt',
  'receiptGeneratedBy',
  'status',
  'notes',
  'rejectedReason',
  'submittedAt',
  'submittedBy',
  'verifiedAt',
  'verifiedBy',
  'createdAt',
  'updatedAt'
].join(' ');

function parseIntSetting(value, fallback) {
  const n = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

async function loadEnterpriseData(user, isAdmin) {
  const enterpriseData = {
    memberTransactions: [],
    reimbursements: [],
    projects: [],
    events: [],
    contributionStats: {}
  };

  try {
    if (MemberTransaction) {
      const transactionQuery = isAdmin
        ? {}
        : { $or: [{ sender: user._id }, { receiver: user._id }] };

      enterpriseData.memberTransactions = await MemberTransaction.find(transactionQuery)
        .populate(['sender', 'receiver', 'linkedProject', 'linkedEvent'])
        .sort({ createdAt: -1 })
        .limit(100);
    }

    if (Reimbursement) {
      const reimbursementQuery = isAdmin ? {} : { member: user._id };

      enterpriseData.reimbursements = await Reimbursement.find(reimbursementQuery)
        .populate(['member', 'linkedProject', 'reviewedBy'])
        .sort({ createdAt: -1 })
        .limit(100);
    }

    if (Project) {
      const projectQuery = isAdmin
        ? {}
        : {
            $or: [{ teamMembers: user._id }, { teamLead: user._id }],
            visibility: { $ne: 'admin_only' }
          };

      enterpriseData.projects = await Project.find(projectQuery)
        .populate(['teamLead', 'teamMembers', 'createdBy'])
        .sort({ startDate: -1 })
        .limit(50);
    }

    if (Event) {
      const eventQuery = isAdmin
        ? {}
        : {
            visibility: { $in: ['public', 'members_only'] },
            status: { $ne: 'cancelled' }
          };

      enterpriseData.events = await Event.find(eventQuery)
        .populate(['organizer', 'createdBy'])
        .sort({ startDate: -1 })
        .limit(50);
    }

    if (isAdmin && MemberTransaction) {
      const contributorStats = await MemberTransaction.aggregate([
        {
          $match: { status: { $in: ['approved', 'settled', 'reimbursed'] } }
        },
        {
          $facet: {
            topSenders: [
              {
                $group: {
                  _id: '$sender',
                  totalContributed: { $sum: '$amount' },
                  transactionCount: { $sum: 1 }
                }
              },
              { $sort: { totalContributed: -1 } },
              { $limit: 10 },
              {
                $lookup: {
                  from: 'users',
                  localField: '_id',
                  foreignField: '_id',
                  as: 'user'
                }
              }
            ],
            topReceivers: [
              {
                $group: {
                  _id: '$receiver',
                  totalReceived: { $sum: '$amount' },
                  transactionCount: { $sum: 1 }
                }
              },
              { $sort: { totalReceived: -1 } },
              { $limit: 10 },
              {
                $lookup: {
                  from: 'users',
                  localField: '_id',
                  foreignField: '_id',
                  as: 'user'
                }
              }
            ]
          }
        }
      ]);

      if (contributorStats.length > 0) {
        enterpriseData.contributionStats = {
          topContributors: contributorStats[0].topSenders || [],
          topRequests: contributorStats[0].topReceivers || []
        };
      }
    }
  } catch (err) {
    console.log('Note: Some enterprise features may not be available yet');
  }

  return enterpriseData;
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
        .select(paymentSelect)
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

      const enterpriseData = await loadEnterpriseData(req.user, true);
      const collaborations = Collaboration
        ? await Collaboration.find().sort({ submittedAt: -1 }).limit(500).lean()
        : [];

      return res.json({
        user: req.user.toSafeJSON(),
        settings: {
          memberTotalFee
        },
        members: members.map((m) => m.toSafeJSON()),
        payments: recentPayments,
        pendingPayments,
        expenses,
        collaborations,
        summary: {
          paymentsApprovedTotal: paymentsTotal,
          expensesTotal,
          balance: paymentsTotal - expensesTotal
        },
        enterprise: enterpriseData
      });
    }

    // Member view: own payments + all expenses (read-only)
    const members = await User.find({ role: 'member' }).sort({ createdAt: -1 }).limit(500);
    const myPayments = await Payment.find({ member: req.user._id })
      .select(paymentSelect)
      .sort({ submittedAt: -1 })
      .limit(200);

    const approvedSum = await Payment.aggregate([
      { $match: { member: req.user._id, status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalApprovedPayments = await Payment.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalExpenses = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const paymentsTotal = totalApprovedPayments[0]?.total || 0;
    const expensesTotal = totalExpenses[0]?.total || 0;
    const enterpriseData = await loadEnterpriseData(req.user, false);

    return res.json({
      user: req.user.toSafeJSON(),
      settings: {
        memberTotalFee
      },
      members: members.map((m) => m.toSafeJSON()),
      payments: myPayments,
      expenses,
      summary: {
        myApprovedPaymentsTotal: approvedSum[0]?.total || 0,
        paymentsApprovedTotal: paymentsTotal,
        expensesTotal,
        balance: paymentsTotal - expensesTotal
      },
      enterprise: enterpriseData
    });
  })
);

module.exports = { dashboardRoutes: router };
