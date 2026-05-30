const { Router } = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { Event } = require('../models/Event');
const { Expense } = require('../models/Expense');
const { User } = require('../models/User');
const { requireAuth, requireRole, blockIfMustChangePassword } = require('../middleware/auth');

const router = Router();

/**
 * POST /events/create
 * 
 * Create a new event (workshop, competition, etc.)
 */
router.post(
  '/create',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const {
      name,
      description,
      eventType,
      location,
      startDate,
      endDate,
      organizerId,
      expectedParticipants,
      registrationFee,
      visibility,
      tags
    } = req.body;

    if (!name || !eventType || !startDate || !endDate) {
      return res.status(400).json({
        message: 'name, eventType, startDate, and endDate are required'
      });
    }

    const eventData = {
      name,
      description: description || '',
      eventType,
      location: location || '',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      expectedParticipants: expectedParticipants ? Number(expectedParticipants) : 0,
      registrationFee: registrationFee ? Number(registrationFee) : 0,
      visibility: visibility || 'public',
      createdBy: req.user._id,
      tags: tags || []
    };

    if (organizerId) {
      const organizer = await User.findOne({ _id: organizerId, role: 'member' });
      if (organizer) eventData.organizer = organizerId;
    }

    const event = await Event.create(eventData);
    await event.populate(['organizer', 'createdBy']);

    return res.status(201).json({
      message: 'Event created',
      event
    });
  })
);

/**
 * GET /events/list
 * 
 * List events
 */
router.get(
  '/list',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { eventType, status, limit = 50, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query = {};

    // Members: see public events or events they're part of
    if (req.user.role === 'member') {
      query = {
        $or: [
          { visibility: 'public' },
          { participants: req.user._id },
          { organizingTeam: req.user._id }
        ]
      };
    }

    if (eventType) query.eventType = eventType;
    if (status) query.status = status;

    const events = await Event.find(query)
      .populate(['organizer', 'createdBy'])
      .sort({ startDate: -1 })
      .limit(Number(limit))
      .skip(skip);

    const total = await Event.countDocuments(query);

    return res.json({
      events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  })
);

/**
 * GET /events/:id
 * 
 * Get event details with financial summary
 */
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id)
      .populate(['organizer', 'createdBy', 'participants', 'organizingTeam']);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Authorization
    const isParticipant = event.participants.some(p => p._id.toString() === req.user._id.toString());
    const isOrganizerTeam = event.organizingTeam.some(p => p._id.toString() === req.user._id.toString());
    const isAdmin = req.user.role === 'admin';

    if (event.visibility !== 'public' && !isParticipant && !isOrganizerTeam && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json(event);
  })
);

/**
 * POST /events/:id/update-financials
 * 
 * Update event financial information
 */
router.post(
  '/:id/update-financials',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { income, expenses } = req.body;

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (income) {
      Object.assign(event.income, income);
    }

    if (expenses) {
      Object.assign(event.expenses, expenses);
    }

    // Recalculate totals
    event.totalIncome = Object.values(event.income).reduce((sum, val) => sum + (val || 0), 0);
    event.totalExpense = Object.values(event.expenses).reduce((sum, val) => sum + (val || 0), 0);
    event.profitLoss = event.totalIncome - event.totalExpense;

    await event.save();

    return res.json({
      message: 'Event financials updated',
      event
    });
  })
);

/**
 * POST /events/:id/register
 * 
 * Member registers for event
 */
router.post(
  '/:id/register',
  requireAuth,
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.registrationOpen) {
      return res.status(400).json({ message: 'Registrations are closed for this event' });
    }

    // Check if already registered
    if (event.participants.some(p => p.toString() === req.user._id.toString())) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    event.participants.push(req.user._id);
    event.actualParticipants = (event.actualParticipants || 0) + 1;

    await event.save();
    await event.populate(['organizer', 'participants']);

    return res.json({
      message: 'Registered for event',
      event
    });
  })
);

/**
 * POST /events/:id/add-participant
 * 
 * Admin adds a participant
 */
router.post(
  '/:id/add-participant',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { memberId } = req.body;

    if (!memberId) {
      return res.status(400).json({ message: 'memberId is required' });
    }

    const member = await User.findOne({ _id: memberId, role: 'member' });
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.participants.includes(memberId)) {
      event.participants.push(memberId);
      event.actualParticipants = (event.actualParticipants || 0) + 1;
      await event.save();
    }

    await event.populate(['organizer', 'participants']);

    return res.json({
      message: 'Participant added',
      event
    });
  })
);

/**
 * GET /events/:id/expenses
 * 
 * Get all expenses linked to an event
 */
router.get(
  '/:id/expenses',
  requireAuth,
  asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const expenses = await Expense.find({ linkedEvent: event._id })
      .populate(['addedBy'])
      .sort({ date: -1 });

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    return res.json({
      event: {
        id: event._id,
        name: event.name
      },
      expenses,
      summary: {
        totalExpense: totalAmount,
        count: expenses.length
      }
    });
  })
);

/**
 * POST /events/:id/add-expense
 * 
 * Add expense to event
 */
router.post(
  '/:id/add-expense',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { title, amount, category, notes, expenseDate } = req.body;

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!title || !amount) {
      return res.status(400).json({ message: 'title and amount are required' });
    }

    const expense = await Expense.create({
      title,
      amount: Number(amount),
      category: category || '',
      date: expenseDate ? new Date(expenseDate) : new Date(),
      notes: notes || '',
      linkedEvent: event._id,
      addedBy: req.user._id
    });

    await expense.populate(['addedBy']);

    return res.status(201).json({
      message: 'Expense added to event',
      expense
    });
  })
);

/**
 * PUT /events/:id
 * 
 * Update event details
 */
router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { description, status, location, endDate, registrationOpen, registrationFee, outcomes } = req.body;

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (description !== undefined) event.description = description;
    if (status !== undefined) event.status = status;
    if (location !== undefined) event.location = location;
    if (endDate !== undefined) event.endDate = new Date(endDate);
    if (registrationOpen !== undefined) event.registrationOpen = Boolean(registrationOpen);
    if (registrationFee !== undefined) event.registrationFee = Number(registrationFee);
    if (outcomes !== undefined) event.outcomes = outcomes;

    event.lastModifiedBy = req.user._id;
    await event.save();
    await event.populate(['organizer', 'createdBy']);

    return res.json({
      message: 'Event updated',
      event
    });
  })
);

/**
 * GET /events/analytics/summary
 * 
 * Get event analytics
 */
router.get(
  '/analytics/summary',
  requireAuth,
  asyncHandler(async (req, res) => {
    let query = { status: { $ne: 'cancelled' } };

    if (req.user.role === 'member') {
      query.$or = [
        { visibility: 'public' },
        { participants: req.user._id }
      ];
    }

    const stats = await Event.aggregate([
      { $match: query },
      {
        $facet: {
          byType: [
            { $group: { _id: '$eventType', count: { $sum: 1 }, income: { $sum: '$totalIncome' } } }
          ],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          financials: [
            {
              $group: {
                _id: null,
                totalIncome: { $sum: '$totalIncome' },
                totalExpense: { $sum: '$totalExpense' },
                totalProfit: { $sum: '$profitLoss' },
                eventCount: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    return res.json({
      summary: {
        byType: stats[0].byType,
        byStatus: stats[0].byStatus,
        financials: stats[0].financials[0] || {
          totalIncome: 0,
          totalExpense: 0,
          totalProfit: 0,
          eventCount: 0
        }
      }
    });
  })
);

const eventRoutes = router;
module.exports = { eventRoutes };
