const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    installmentNumber: { type: Number, min: 1, max: 3, default: null },
    method: { type: String, enum: ['receipt', 'manual'], required: true },

    // Type A — uploaded member proof (never overwritten)
    receiptPath: { type: String, default: null },
    receiptOriginalName: { type: String, default: null },
    receiptUploadedAt: { type: Date, default: null },

    // Type B — official generated receipt (set only after approval)
    receiptNumber: { type: String },
    receiptPdfPath: { type: String, default: null },
    receiptPdfName: { type: String, default: null },
    receiptGeneratedAt: { type: Date, default: null },
    receiptGeneratedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },

    notes: { type: String, default: '' },
    rejectedReason: { type: String, default: '' },

    submittedAt: { type: Date, default: Date.now },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null }
  },
  { timestamps: true }
);

PaymentSchema.index({ member: 1, submittedAt: -1 });
PaymentSchema.index({ status: 1, submittedAt: -1 });
PaymentSchema.index(
  { receiptNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      receiptNumber: { $exists: true, $type: 'string', $gt: '' }
    },
    name: 'receiptNumber_unique_partial'
  }
);

const Payment = mongoose.model('Payment', PaymentSchema);

module.exports = { Payment };
