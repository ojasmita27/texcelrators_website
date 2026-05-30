const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // NEW: Link to project (optional - for project-wise expense tracking)
    linkedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null
    },

    // NEW: Link to event (optional - for event financials)
    linkedEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null
    },

    // NEW: Track if this is a component purchase
    isComponentPurchase: {
      type: Boolean,
      default: false
    },
    linkedReimbursement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reimbursement',
      default: null
    }
  },
  { timestamps: true }
);

ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ linkedProject: 1 });
ExpenseSchema.index({ linkedEvent: 1 });

const Expense = mongoose.model('Expense', ExpenseSchema);

module.exports = { Expense };
