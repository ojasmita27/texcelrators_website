const { FundEntry } = require('../models/FundEntry');
const { Payment } = require('../models/Payment');
const { Expense } = require('../models/Expense');

/**
 * Shared finance calculation utility
 * Ensures consistent balance calculations across all modules:
 * - Dashboard Overview
 * - Fund Management
 * - Finance Analytics
 *
 * Balance formula:
 * balance = fundEntriesTotal + approvedPayments - expenses
 */

/**
 * Calculate synchronized financial summary
 * @returns {Promise<Object>} Object containing fundEntriesTotal, paymentsTotal, expensesTotal, balance
 */
async function calculateFinancialSummary() {
  // Calculate fund entries total
  let fundEntriesTotal = 0;
  try {
    if (FundEntry) {
      const fundAgg = await FundEntry.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      fundEntriesTotal = fundAgg[0]?.total || 0;
    }
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

  return {
    fundEntriesTotal,
    paymentsTotal,
    expensesTotal,
    balance
  };
}

/**
 * Calculate approved payments total for a specific member
 * @param {string} memberId - Member ID
 * @returns {Promise<number>} Total approved payments for the member
 */
async function calculateMemberApprovedTotal(memberId) {
  const approvedSum = await Payment.aggregate([
    { $match: { member: memberId, status: 'approved' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  return approvedSum[0]?.total || 0;
}

module.exports = {
  calculateFinancialSummary,
  calculateMemberApprovedTotal
};
