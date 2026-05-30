const mongoose = require('mongoose');

const CollaborationSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    college: {
      type: String,
      required: true,
      trim: true
    },
    roleInterested: {
      type: String,
      required: true,
      enum: [
        'Technical Team',
        'Designing Team',
        'Fabrication Team',
        'Media Team',
        'Management Team',
        'Sponsorship / Partnership',
        'Volunteer',
        'Event Collaboration',
        'Other'
      ]
    },
    skills: {
      type: String,
      required: true,
      trim: true
    },
    collaborationReason: {
      type: String,
      required: true,
      trim: true
    },
    portfolioLink: {
      type: String,
      default: null,
      trim: true
    },
    status: {
      type: String,
      enum: ['new', 'reviewed', 'contacted', 'rejected'],
      default: 'new'
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Index for query performance
CollaborationSchema.index({ email: 1, submittedAt: -1 });
CollaborationSchema.index({ status: 1 });

module.exports = mongoose.model('Collaboration', CollaborationSchema);
