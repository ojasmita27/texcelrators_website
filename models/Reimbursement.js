const mongoose = require('mongoose');

/**
 * REIMBURSEMENT MODEL
 * 
 * Tracks member purchases of robotics components/materials with reimbursement workflow:
 * 1. Member purchases item
 * 2. Uploads receipt
 * 3. Admin verifies & approves amount
 * 4. Club reimburses member
 * 
 * Builds accountability and prevents duplicate claims.
 */
const ReimbursementSchema = new mongoose.Schema(
  {
    // Claimant
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Item & Purchase Details
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: [
        'component',
        'material',
        'tool',
        'sensor',
        'motor',
        'structural',
        'electronics',
        'other'
      ],
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    // Vendor & Purchase Info
    vendor: {
      name: { type: String, default: '' },
      contact: { type: String, default: '' }
    },
    purchaseDate: {
      type: Date,
      required: true
    },
    invoiceNumber: {
      type: String,
      default: ''
    },

    // Linking to Project
    linkedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null
    },

    // Receipt Upload
    receipt: {
      path: { type: String, default: null },
      originalName: { type: String, default: null },
      uploadedAt: { type: Date, default: null }
    },

    // Approval Workflow
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'approved', 'rejected', 'reimbursed'],
      default: 'submitted'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    approvedAmount: {
      type: Number,
      default: null
    },
    rejectionReason: {
      type: String,
      default: ''
    },

    // Reimbursement Tracking
    reimbursedAmount: {
      type: Number,
      default: 0
    },
    reimbursedAt: {
      type: Date,
      default: null
    },
    reimbursedVia: {
      type: String,
      enum: ['bank_transfer', 'cash', 'club_fund', 'payback'],
      default: null
    },
    reimbursementNotes: {
      type: String,
      default: ''
    },

    // Admin Notes
    adminNotes: {
      type: String,
      default: ''
    },
    tags: [String]
  },
  { timestamps: true }
);

// Indexes
ReimbursementSchema.index({ member: 1, createdAt: -1 });
ReimbursementSchema.index({ status: 1, createdAt: -1 });
ReimbursementSchema.index({ linkedProject: 1 });
ReimbursementSchema.index({ purchaseDate: -1 });

const Reimbursement = mongoose.model('Reimbursement', ReimbursementSchema);

module.exports = { Reimbursement };
