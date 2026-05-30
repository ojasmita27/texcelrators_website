const mongoose = require('mongoose');

/**
 * EVENT MODEL
 * 
 * Tracks workshops, competitions, hackathons, and events.
 * Manages:
 * - Event financials (sponsorships, registrations, expenses)
 * - Participant tracking
 * - Profit/loss calculation
 * 
 * Examples: "Robocon 2025", "AI Workshop Series", "BITS GOA Competition"
 */
const EventSchema = new mongoose.Schema(
  {
    // Event Identity
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: '📅'
    },

    // Event Type
    eventType: {
      type: String,
      enum: [
        'competition',
        'workshop',
        'hackathon',
        'seminar',
        'meetup',
        'demo_day',
        'training',
        'external_event',
        'internal_event',
        'other'
      ],
      required: true
    },

    // Location & Dates
    location: {
      type: String,
      default: ''
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    registrationDeadline: {
      type: Date,
      default: null
    },

    // Organization
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    organizingTeam: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    // FINANCIAL TRACKING

    // Income
    income: {
      sponsorships: {
        type: Number,
        default: 0
      },
      registrations: {
        type: Number,
        default: 0
      },
      ticketSales: {
        type: Number,
        default: 0
      },
      merchandise: {
        type: Number,
        default: 0
      },
      other: {
        type: Number,
        default: 0
      }
    },

    // Expenses
    expenses: {
      venue: { type: Number, default: 0 },
      equipment: { type: Number, default: 0 },
      materials: { type: Number, default: 0 },
      catering: { type: Number, default: 0 },
      prizes: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      marketing: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },

    // Computed Totals
    totalIncome: {
      type: Number,
      default: 0
    },
    totalExpense: {
      type: Number,
      default: 0
    },
    profitLoss: {
      type: Number,
      default: 0
    },

    // Participants
    expectedParticipants: {
      type: Number,
      default: 0
    },
    actualParticipants: {
      type: Number,
      default: 0
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

    // Status & Visibility
    status: {
      type: String,
      enum: ['planning', 'registered', 'live', 'completed', 'cancelled'],
      default: 'planning'
    },
    visibility: {
      type: String,
      enum: ['public', 'members_only', 'admin_only'],
      default: 'public'
    },

    // Registration
    registrationOpen: {
      type: Boolean,
      default: false
    },
    registrationFee: {
      type: Number,
      default: 0
    },

    // Additional Info
    sponsor: {
      name: String,
      contact: String,
      amount: Number
    },
    goals: [String],
    outcomes: {
      type: String,
      default: ''
    },
    highlights: [String],

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
    attachments: [
      {
        name: String,
        url: String
      }
    ]
  },
  { timestamps: true }
);

// Indexes
EventSchema.index({ eventType: 1 });
EventSchema.index({ startDate: -1 });
EventSchema.index({ status: 1 });
EventSchema.index({ organizer: 1 });

const Event = mongoose.model('Event', EventSchema);

module.exports = { Event };
