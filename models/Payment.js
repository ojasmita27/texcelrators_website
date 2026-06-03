const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ['receipt', 'manual'], required: true },

    // Receipt upload (for member submissions)
    receiptPath: { type: String, default: null },
    receiptOriginalName: { type: String, default: null },

    // Generated official receipt PDF
    receiptNumber: { type: String, default: null, unique: true, sparse: true },
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

    // Razorpay placeholders for future integration
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null }
  },
  { timestamps: true }
);

PaymentSchema.index({ member: 1, submittedAt: -1 });
PaymentSchema.index({ status: 1, submittedAt: -1 });

PaymentSchema.index({ receiptNumber: 1 }, { unique: true, sparse: true });
const Payment = mongoose.model('Payment', PaymentSchema);

module.exports = { Payment };
