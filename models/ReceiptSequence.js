const mongoose = require('mongoose');

const ReceiptSequenceSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true, unique: true },
    seq: { type: Number, required: true, default: 0, min: 0 }
  },
  { timestamps: true }
);

const ReceiptSequence = mongoose.model('ReceiptSequence', ReceiptSequenceSchema);

module.exports = { ReceiptSequence };
