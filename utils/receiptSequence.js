const { Payment } = require('../models/Payment');
const { ReceiptSequence } = require('../models/ReceiptSequence');
const { buildReceiptNumber } = require('./pdfGenerator');
const { logInfo, logWarn } = require('./logger');

async function readMaxSequenceFromPayments(year) {
  const prefix = `TXC-${year}-`;
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const latest = await Payment.findOne({
    receiptNumber: { $regex: `^${escapedPrefix}\\d+$` }
  })
    .sort({ receiptNumber: -1 })
    .select('receiptNumber')
    .lean();

  if (!latest || !latest.receiptNumber) return 0;

  const suffix = String(latest.receiptNumber).slice(prefix.length);
  const sequence = Number.parseInt(suffix, 10);
  return Number.isFinite(sequence) ? sequence : 0;
}

async function bootstrapYearCounter(year) {
  const maxExisting = await readMaxSequenceFromPayments(year);
  await ReceiptSequence.findOneAndUpdate(
    { year },
    { $max: { seq: maxExisting } },
    { upsert: true, setDefaultsOnInsert: true }
  );

  if (maxExisting > 0) {
    logInfo('receipt-sequence', 'Bootstrapped receipt counter from existing payments', { year, maxExisting });
  }
}

async function allocateReceiptNumber(year = new Date().getFullYear()) {
  await bootstrapYearCounter(year);

  const updated = await ReceiptSequence.findOneAndUpdate(
    { year },
    { $inc: { seq: 1 } },
    { new: true }
  );

  if (!updated) {
    throw new Error(`Unable to allocate receipt sequence for year ${year}`);
  }

  const receiptNumber = buildReceiptNumber(year, updated.seq);
  logInfo('receipt-sequence', 'Allocated receipt number', { year, seq: updated.seq, receiptNumber });
  return receiptNumber;
}

async function syncReceiptCountersFromPayments() {
  const years = await Payment.distinct('receiptNumber');
  const yearSet = new Set();

  years.forEach((value) => {
    const match = String(value || '').match(/^TXC-(\d{4})-/);
    if (match) yearSet.add(Number.parseInt(match[1], 10));
  });

  yearSet.add(new Date().getFullYear());

  await Promise.all(Array.from(yearSet).map((year) => bootstrapYearCounter(year)));
  logInfo('receipt-sequence', 'Receipt counters synchronized', { years: Array.from(yearSet) });
}

module.exports = {
  allocateReceiptNumber,
  bootstrapYearCounter,
  readMaxSequenceFromPayments,
  syncReceiptCountersFromPayments
};
