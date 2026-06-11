const { Payment } = require('../models/Payment');
const { logInfo, logWarn } = require('./logger');

async function syncPaymentIndexes() {
  const collection = Payment.collection;

  const legacyIndexes = ['receiptNumber_1'];
  await Promise.all(legacyIndexes.map(async (indexName) => {
    try {
      await collection.dropIndex(indexName);
      logInfo('payment-index', `Dropped legacy index ${indexName}`);
    } catch (err) {
      if (!err || err.codeName !== 'IndexNotFound') {
        logWarn('payment-index', `Could not drop index ${indexName}`, { message: err && err.message });
      }
    }
  }));

  const unsetResult = await Payment.updateMany(
    {
      $or: [
        { receiptNumber: null },
        { receiptNumber: '' }
      ],
      status: { $ne: 'approved' }
    },
    { $unset: { receiptNumber: '' } }
  );

  if (unsetResult.modifiedCount > 0) {
    logInfo('payment-index', 'Removed null receiptNumber from non-approved payments', {
      modifiedCount: unsetResult.modifiedCount
    });
  }

  await Payment.syncIndexes();
  logInfo('payment-index', 'Payment indexes synchronized');
}

module.exports = { syncPaymentIndexes };
