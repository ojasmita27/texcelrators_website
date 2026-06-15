const mongoose = require('mongoose');

/**
 * FUND ENTRY MODEL
 *
 * Tracks non-member-fee income that contributes to club funds:
 *   Opening Balance, Principal Contribution, Sponsorship, Donation, Other Income.
 *
 * Safeguards:
 *   - Opening Balance is enforced as unique at the application layer (one doc of
 *     sourceType === 'opening_balance' may exist at any time).
 *   - All audit fields (addedBy, createdAt, updatedAt) are immutable after creation
 *     except via the dedicated PUT /funds/:id route which re-validates.
 *   - This model does NOT touch payments, expenses, or reimbursements.
 *
 * Balance formula (dashboard.routes.js):
 *   balance = SUM(fundentries.amount)
 *           + SUM(payments.amount WHERE status='approved')
 *           - SUM(expenses.amount)
 */
const FundEntrySchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Amount must be greater than 0']
    },

    sourceType: {
      type: String,
      enum: [
        'opening_balance',
        'principal_contribution',
        'sponsorship',
        'donation',
        'other_income'
      ],
      required: true
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },

    date: {
      type: Date,
      default: Date.now
    },

    // Audit — who created this entry
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Audit — last editor (null until first edit)
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true   // createdAt + updatedAt managed automatically by Mongoose
  }
);

/* ── Indexes ── */
FundEntrySchema.index({ sourceType: 1 });
FundEntrySchema.index({ date: -1 });
FundEntrySchema.index({ addedBy: 1 });

const FundEntry = mongoose.model('FundEntry', FundEntrySchema);

module.exports = { FundEntry };
