const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

ExpenseSchema.index({ date: -1 });

const Expense = mongoose.model('Expense', ExpenseSchema);

module.exports = { Expense };
