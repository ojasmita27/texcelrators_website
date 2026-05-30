const mongoose = require('mongoose');

/**
 * PROJECT MODEL
 * 
 * Represents robotics projects/robots with budget tracking.
 * Tracks:
 * - Project info (name, description, team members)
 * - Budget (total allocated budget)
 * - Expenses linked to this project
 * - Timeline and status
 * 
 * Examples: "Robocon 2025", "Drone AI Project", "Humanoid V3"
 */
const ProjectSchema = new mongoose.Schema(
  {
    // Project Identity
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    codeName: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: '🤖'
    },

    // Project Type/Category
    category: {
      type: String,
      enum: [
        'robot',
        'competition',
        'research',
        'drone',
        'humanoid',
        'racer',
        'ai_project',
        'workshop_research',
        'other'
      ],
      required: true
    },

    // Team
    teamLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    // Budget Allocation
    budgetAllocated: {
      type: Number,
      required: true,
      min: 0
    },
    budgetStartDate: {
      type: Date,
      default: Date.now
    },
    budgetEndDate: {
      type: Date,
      default: null
    },

    // Timeline
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'in_progress', 'completed', 'archived'],
      default: 'planning'
    },

    // Tracking Fields (Computed)
    totalExpense: {
      type: Number,
      default: 0
    },
    totalReimbursements: {
      type: Number,
      default: 0
    },
    totalContributions: {
      type: Number,
      default: 0
    },
    budgetRemainingPercentage: {
      type: Number,
      default: 100
    },

    // Project Goals/Details
    objectives: [String],
    milestones: [
      {
        title: String,
        dueDate: Date,
        status: { type: String, enum: ['pending', 'completed'], default: 'pending' }
      }
    ],

    // Visibility & Access
    visibility: {
      type: String,
      enum: ['public', 'team_only', 'admin_only'],
      default: 'team_only'
    },

    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    tags: [String],
    notes: String
  },
  { timestamps: true }
);

// Indexes
ProjectSchema.index({ category: 1 });
ProjectSchema.index({ teamLead: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ startDate: -1 });
ProjectSchema.index({ teamMembers: 1 });

const Project = mongoose.model('Project', ProjectSchema);

module.exports = { Project };
