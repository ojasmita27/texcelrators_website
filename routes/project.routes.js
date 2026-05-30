const { Router } = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { Project } = require('../models/Project');
const { Expense } = require('../models/Expense');
const { User } = require('../models/User');
const { requireAuth, requireRole, blockIfMustChangePassword } = require('../middleware/auth');

const router = Router();

/**
 * POST /projects/create
 * 
 * Create a new robotics project
 */
router.post(
  '/create',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const {
      name,
      codeName,
      description,
      category,
      budgetAllocated,
      teamLeadId,
      teamMemberIds,
      startDate,
      endDate,
      objectives,
      visibility,
      tags
    } = req.body;

    if (!name || !category || !budgetAllocated || !startDate) {
      return res.status(400).json({
        message: 'name, category, budgetAllocated, and startDate are required'
      });
    }

    // Check for duplicate name
    const existing = await Project.findOne({ name });
    if (existing) {
      return res.status(409).json({ message: 'Project name already exists' });
    }

    const projectData = {
      name,
      codeName: codeName || name.toLowerCase().replace(/\s+/g, '-'),
      description: description || '',
      category,
      budgetAllocated: Number(budgetAllocated),
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      createdBy: req.user._id,
      visibility: visibility || 'team_only',
      tags: tags || []
    };

    if (teamLeadId) {
      const lead = await User.findOne({ _id: teamLeadId, role: 'member' });
      if (lead) projectData.teamLead = teamLeadId;
    }

    if (teamMemberIds && Array.isArray(teamMemberIds)) {
      projectData.teamMembers = teamMemberIds;
    }

    if (objectives && Array.isArray(objectives)) {
      projectData.objectives = objectives;
    }

    const project = await Project.create(projectData);
    await project.populate(['teamLead', 'teamMembers', 'createdBy']);

    return res.status(201).json({
      message: 'Project created',
      project
    });
  })
);

/**
 * GET /projects/list
 * 
 * List projects
 * - Members: see projects they're part of
 * - Admins: see all projects
 */
router.get(
  '/list',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { status, category, limit = 50, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query = {};

    // Role-based filtering
    if (req.user.role === 'member') {
      query = {
        $or: [
          { teamMembers: req.user._id },
          { teamLead: req.user._id },
          { visibility: 'public' }
        ]
      };
    }

    if (status) query.status = status;
    if (category) query.category = category;

    const projects = await Project.find(query)
      .populate(['teamLead', 'teamMembers', 'createdBy'])
      .sort({ startDate: -1 })
      .limit(Number(limit))
      .skip(skip);

    const total = await Project.countDocuments(query);

    return res.json({
      projects,
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
 * GET /projects/:id
 * 
 * Get project details with expense summary
 */
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id)
      .populate(['teamLead', 'teamMembers', 'createdBy', 'lastModifiedBy']);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Authorization
    const isTeamMember = project.teamMembers.some(m => m._id.toString() === req.user._id.toString());
    const isTeamLead = project.teamLead && project.teamLead._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (project.visibility !== 'public' && !isTeamMember && !isTeamLead && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Calculate expense summary
    const expenseSummary = await Expense.aggregate([
      {
        $match: {
          linkedProject: require('mongoose').Types.ObjectId(project._id)
        }
      },
      {
        $group: {
          _id: null,
          totalExpense: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const summary = expenseSummary[0] || { totalExpense: 0, count: 0 };
    project.totalExpense = summary.totalExpense;
    project.budgetRemainingPercentage = ((project.budgetAllocated - summary.totalExpense) / project.budgetAllocated) * 100;

    return res.json(project);
  })
);

/**
 * GET /projects/:id/expenses
 * 
 * Get all expenses linked to a project
 */
router.get(
  '/:id/expenses',
  requireAuth,
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const expenses = await Expense.find({ linkedProject: project._id })
      .populate(['addedBy'])
      .sort({ date: -1 });

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

    return res.json({
      project: {
        id: project._id,
        name: project.name,
        budgetAllocated: project.budgetAllocated
      },
      expenses,
      summary: {
        totalExpense: totalAmount,
        budgetRemaining: project.budgetAllocated - totalAmount,
        percentageUsed: (totalAmount / project.budgetAllocated) * 100,
        count: expenses.length
      }
    });
  })
);

/**
 * POST /projects/:id/add-expense
 * 
 * Link an existing or new expense to a project
 */
router.post(
  '/:id/add-expense',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { title, amount, category, notes, expenseDate } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
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
      linkedProject: project._id,
      addedBy: req.user._id
    });

    await expense.populate(['addedBy']);

    return res.status(201).json({
      message: 'Expense added to project',
      expense
    });
  })
);

/**
 * PUT /projects/:id
 * 
 * Update project details
 */
router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { description, status, budgetAllocated, teamLeadId, endDate, notes, tags } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (description) project.description = description;
    if (status) project.status = status;
    if (budgetAllocated) project.budgetAllocated = Number(budgetAllocated);
    if (endDate) project.endDate = new Date(endDate);
    if (notes) project.notes = notes;
    if (tags) project.tags = tags;

    if (teamLeadId) {
      const lead = await User.findOne({ _id: teamLeadId, role: 'member' });
      if (lead) project.teamLead = teamLeadId;
    }

    project.lastModifiedBy = req.user._id;
    await project.save();
    await project.populate(['teamLead', 'teamMembers', 'createdBy', 'lastModifiedBy']);

    return res.json({
      message: 'Project updated',
      project
    });
  })
);

/**
 * GET /projects/analytics/summary
 * 
 * Get project analytics and summary
 */
router.get(
  '/analytics/summary',
  requireAuth,
  asyncHandler(async (req, res) => {
    let query = {};

    if (req.user.role === 'member') {
      query = {
        $or: [
          { teamMembers: req.user._id },
          { teamLead: req.user._id }
        ]
      };
    }

    const projects = await Project.find(query);

    // Calculate aggregates
    const stats = await Project.aggregate([
      { $match: query },
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          byCategory: [
            { $group: { _id: '$category', count: { $sum: 1 }, totalBudget: { $sum: '$budgetAllocated' } } }
          ],
          budgetSummary: [
            {
              $group: {
                _id: null,
                totalBudgetAllocated: { $sum: '$budgetAllocated' },
                totalProjects: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    // Get total expenses
    const expenseSummary = await Expense.aggregate([
      {
        $match: {
          linkedProject: { $in: projects.map(p => p._id) }
        }
      },
      {
        $group: {
          _id: null,
          totalExpense: { $sum: '$amount' }
        }
      }
    ]);

    return res.json({
      summary: {
        byStatus: stats[0].byStatus,
        byCategory: stats[0].byCategory,
        budgetSummary: stats[0].budgetSummary[0] || { totalBudgetAllocated: 0, totalProjects: 0 },
        totalExpense: expenseSummary[0]?.totalExpense || 0
      }
    });
  })
);

const projectRoutes = router;
module.exports = { projectRoutes };
