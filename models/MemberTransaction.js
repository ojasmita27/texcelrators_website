const mongoose = require('mongoose');

/**
 * MEMBER-TO-MEMBER TRANSACTION MODEL
 * 
 * Tracks peer-to-peer transfers, reimbursement requests, and project contributions
 * between club members. Supports approval workflows.
 */
const MemberTransactionSchema = new mongoose.Schema(
  {
    // Core Transaction Data
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      enum: [
        'project_contribution',
        'material_purchase',
        'workshop_expense',
        'component_reimbursement',
        'event_participation',
        'tool_purchase',
        'other'
      ],
      required: true
    },
    description: {
      type: String,
      default: ''
    },

    // Linking to Project/Event (Optional)
    linkedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null
    },
    linkedEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null
    },

    // Proof & Documentation
    receipt: {
      path: { type: String, default: null },
      originalName: { type: String, default: null },
      uploadedAt: { type: Date, default: null }
    },

    // Approval Workflow
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'settled', 'reimbursed'],
      default: 'pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: ''
    },

    // Settlement Tracking
    settledAt: {
      type: Date,
      default: null
    },
    reimbursedAt: {
      type: Date,
      default: null
    },

    // Audit Trail
    notes: {
      type: String,
      default: ''
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

// Indexes for performance
MemberTransactionSchema.index({ sender: 1, createdAt: -1 });
MemberTransactionSchema.index({ receiver: 1, createdAt: -1 });
MemberTransactionSchema.index({ status: 1, createdAt: -1 });
MemberTransactionSchema.index({ linkedProject: 1 });
MemberTransactionSchema.index({ linkedEvent: 1 });

const MemberTransaction = mongoose.model('MemberTransaction', MemberTransactionSchema);

module.exports = { MemberTransaction };
