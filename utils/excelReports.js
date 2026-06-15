const XLSX = require('xlsx');
const { User } = require('../models/User');
const { Payment } = require('../models/Payment');
const { Expense } = require('../models/Expense');
const { Reimbursement } = require('../models/Reimbursement');
const { Project } = require('../models/Project');
const { Event } = require('../models/Event');
const { FundEntry } = require('../models/FundEntry');

/* Human-readable labels for FundEntry sourceType values */
const SOURCE_TYPE_LABELS = {
  opening_balance:        'Opening Balance',
  principal_contribution: 'Principal Contribution',
  sponsorship:            'Sponsorship',
  donation:               'Donation',
  other_income:           'Other Income'
};

function formatDate(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function formatReimbursementStatus(status) {
  const normalized = String(status || 'submitted').toLowerCase();
  if (normalized === 'reimbursed') return 'Paid';
  if (normalized === 'under_review') return 'Submitted';
  if (normalized === 'submitted') return 'Submitted';
  if (normalized === 'approved') return 'Approved';
  if (normalized === 'rejected') return 'Rejected';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function membershipId(user) {
  const id = user && (user._id || user.id) ? String(user._id || user.id) : '';
  if (!id) return '';
  return `TXC-${id.slice(-8).toUpperCase()}`;
}

function userName(user) {
  return user && user.name ? user.name : '';
}

async function fetchMembersRows() {
  const users = await User.find().sort({ createdAt: -1 }).lean();
  return users.map((user) => ({
    Name: user.name || '',
    Email: user.email || '',
    Role: user.role || '',
    'Membership ID': membershipId(user),
    'Join Date': formatDate(user.createdAt),
    Status: user.status || (user.active ? 'active' : 'inactive')
  }));
}

async function fetchPaymentsRows() {
  const payments = await Payment.find()
    .populate('member', 'name email')
    .populate('verifiedBy', 'name email')
    .sort({ submittedAt: -1 })
    .lean();

  return payments.map((payment) => ({
    'Member Name': userName(payment.member),
    Amount: Number(payment.amount) || 0,
    Date: formatDate(payment.submittedAt || payment.createdAt),
    Status: payment.status || '',
    'Receipt Number': payment.receiptNumber || '',
    'Approved By': userName(payment.verifiedBy)
  }));
}

async function fetchReimbursementsRows() {
  const reimbursements = await Reimbursement.find()
    .populate('member', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  return reimbursements.map((claim) => ({
    Member: userName(claim.member),
    Amount: Number(claim.totalAmount) || 0,
    Status: formatReimbursementStatus(claim.status),
    'Admin Notes': claim.adminNotes || '',
    'Submission Date': formatDate(claim.submittedAt || claim.createdAt)
  }));
}

async function fetchExpenseClaimsRows() {
  const reimbursements = await Reimbursement.find()
    .populate('member', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  return reimbursements.map((claim) => ({
    Member: userName(claim.member),
    Amount: Number(claim.totalAmount) || 0,
    Category: claim.category || '',
    Date: formatDate(claim.purchaseDate || claim.createdAt),
    Status: formatReimbursementStatus(claim.status)
  }));
}

async function fetchClubExpensesRows() {
  const expenses = await Expense.find()
    .populate('addedBy', 'name email')
    .sort({ date: -1 })
    .lean();

  return expenses.map((expense) => ({
    'Expense Title': expense.title || '',
    Amount: Number(expense.amount) || 0,
    Category: expense.category || '',
    Date: formatDate(expense.date || expense.createdAt),
    'Added By': userName(expense.addedBy)
  }));
}

async function fetchProjectsRows() {
  const projects = await Project.find()
    .populate('teamLead', 'name email')
    .populate('teamMembers', 'name email')
    .sort({ startDate: -1 })
    .lean();

  return projects.map((project) => ({
    'Project Name': project.name || '',
    'Team Lead': userName(project.teamLead),
    'Assigned Members': Array.isArray(project.teamMembers)
      ? project.teamMembers.map((member) => userName(member)).filter(Boolean).join(', ')
      : '',
    Budget: Number(project.budgetAllocated) || 0,
    Status: project.status || ''
  }));
}

async function fetchEventsRows() {
  const events = await Event.find()
    .populate('participants', 'name email')
    .sort({ startDate: -1 })
    .lean();

  return events.map((event) => ({
    'Event Name': event.name || '',
    Date: formatDate(event.startDate),
    Visibility: event.visibility || '',
    Status: event.status || '',
    Participants: Array.isArray(event.participants)
      ? event.participants.length
      : 0
  }));
}

/* ─────────────────────────────────────────────────────────────────────────
   Fund Entries — one row per FundEntry document.
   ───────────────────────────────────────────────────────────────────────── */
async function fetchFundEntriesRows() {
  const entries = await FundEntry
    .find()
    .populate('addedBy',      'name email')
    .populate('lastEditedBy', 'name email')
    .sort({ date: -1 })
    .lean();

  return entries.map((entry) => ({
    'Source Type':   SOURCE_TYPE_LABELS[entry.sourceType] || entry.sourceType || '',
    Description:     entry.description || '',
    Amount:          Number(entry.amount) || 0,
    Date:            formatDate(entry.date || entry.createdAt),
    'Added By':      userName(entry.addedBy),
    'Last Edited By': userName(entry.lastEditedBy) || '—'
  }));
}

/* ─────────────────────────────────────────────────────────────────────────
   Finance Summary — per-source-type breakdown + net balance.
   The "Net Available Funds" here uses the SAME formula as dashboard.routes.js
   so the two values are always identical.
   ───────────────────────────────────────────────────────────────────────── */
async function fetchFinanceSummaryRows() {
  const [
    memberCount,
    paymentAgg,
    expenseAgg,
    fundAgg,
    reimbursementAgg,
    projectCount,
    eventCount
  ] = await Promise.all([
    User.countDocuments({ role: 'member' }),

    /* Approved member fee payments */
    Payment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]),

    /* All expenses (includes auto-linked reimbursement expenses) */
    Expense.aggregate([
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]),

    /* Fund entries broken down by sourceType */
    FundEntry.aggregate([
      { $group: { _id: '$sourceType', total: { $sum: '$amount' } } }
    ]),

    /* Reimbursements — for "Total Reimbursements Paid" line */
    Reimbursement.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }
    ]),

    Project.countDocuments(),
    Event.countDocuments()
  ]);

  /* Map fund-entry aggregation to a keyed object */
  const fundByType = {};
  fundAgg.forEach((row) => {
    if (row._id) fundByType[row._id] = Number(row.total) || 0;
  });

  const openingBalance       = fundByType.opening_balance        || 0;
  const principalContribs    = fundByType.principal_contribution || 0;
  const sponsorships         = fundByType.sponsorship            || 0;
  const donations            = fundByType.donation               || 0;
  const otherIncome          = fundByType.other_income           || 0;
  const fundEntriesTotal     = openingBalance + principalContribs + sponsorships + donations + otherIncome;

  const approvedPaymentsRow  = paymentAgg.find((r) => r._id === 'approved');
  const memberFeeIncome      = Number(approvedPaymentsRow?.total) || 0;
  const totalIncome          = fundEntriesTotal + memberFeeIncome;

  const totalExpenses        = Number(expenseAgg[0]?.total) || 0;

  /* Reimbursements "Paid" = status reimbursed (actual cash-out to member) */
  const reimbursedRow        = reimbursementAgg.find((r) => r._id === 'reimbursed');
  const totalReimbursedPaid  = Number(reimbursedRow?.total) || 0;

  /* Net = same formula as dashboard.routes.js:
     fundEntriesTotal + approvedPayments - allExpenses
     (reimbursements are already embedded in allExpenses via auto-linked Expense docs) */
  const netAvailableFunds    = fundEntriesTotal + memberFeeIncome - totalExpenses;

  const pendingReimbCount    = reimbursementAgg
    .filter((r) => ['submitted', 'under_review', 'approved'].includes(String(r._id)))
    .reduce((s, r) => s + (r.count || 0), 0);

  return [
    /* ── Finance Summary ── */
    { Metric: '─── INCOME ───',                     Value: '' },
    { Metric: 'Opening Balance',                     Value: openingBalance },
    { Metric: 'Member Fee Income',                   Value: memberFeeIncome },
    { Metric: 'Principal Contributions',             Value: principalContribs },
    { Metric: 'Sponsorships',                        Value: sponsorships },
    { Metric: 'Donations',                           Value: donations },
    { Metric: 'Other Income',                        Value: otherIncome },
    { Metric: 'Total Income',                        Value: totalIncome },
    { Metric: '',                                    Value: '' },
    { Metric: '─── EXPENSES ───',                   Value: '' },
    { Metric: 'Total Expenses',                      Value: totalExpenses },
    { Metric: 'Total Reimbursements Paid (in above)',Value: totalReimbursedPaid },
    { Metric: '',                                    Value: '' },
    { Metric: '─── NET BALANCE ───',                Value: '' },
    { Metric: 'Net Available Funds',                 Value: netAvailableFunds },
    { Metric: '',                                    Value: '' },
    /* ── Club Statistics ── */
    { Metric: '─── CLUB STATISTICS ───',            Value: '' },
    { Metric: 'Total Members',                       Value: memberCount },
    { Metric: 'Approved Payments Count',             Value: approvedPaymentsRow?.count || 0 },
    { Metric: 'Pending Reimbursements',              Value: pendingReimbCount },
    { Metric: 'Total Projects',                      Value: projectCount },
    { Metric: 'Total Events',                        Value: eventCount },
    { Metric: 'Report Generated At',                 Value: new Date().toISOString() }
  ];
}

/* ─────────────────────────────────────────────────────────────────────────
   Legacy fetchSummaryRows — kept for backwards compatibility (not used in
   the full report anymore; fetchFinanceSummaryRows replaces it there).
   ───────────────────────────────────────────────────────────────────────── */
async function fetchSummaryRows() {
  const [memberCount, paymentAgg, reimbursementAgg, expenseAgg, projectCount, eventCount] = await Promise.all([
    User.countDocuments({ role: 'member' }),
    Payment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } }
    ]),
    Reimbursement.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }
    ]),
    Expense.aggregate([{ $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$amount' } } }]),
    Project.countDocuments(),
    Event.countDocuments()
  ]);

  const approvedPayments = paymentAgg.find((row) => row._id === 'approved');
  const pendingReimbursements = reimbursementAgg.filter((row) =>
    ['submitted', 'under_review', 'approved'].includes(String(row._id))
  );

  const pendingReimbursementCount = pendingReimbursements.reduce((sum, row) => sum + (row.count || 0), 0);
  const clubExpenseTotal = expenseAgg[0]?.total || 0;

  return [
    { Metric: 'Total Members', Value: memberCount },
    { Metric: 'Approved Payments Total', Value: approvedPayments?.total || 0 },
    { Metric: 'Approved Payments Count', Value: approvedPayments?.count || 0 },
    { Metric: 'Pending Reimbursements', Value: pendingReimbursementCount },
    { Metric: 'Club Expenses Total', Value: clubExpenseTotal },
    { Metric: 'Total Projects', Value: projectCount },
    { Metric: 'Total Events', Value: eventCount },
    { Metric: 'Report Generated At', Value: new Date().toISOString() }
  ];
}

function rowsToSheet(rows, sheetName) {
  const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Message: 'No records found' }]);
  return { sheetName, worksheet };
}

function workbookToBuffer(workbook) {
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

async function buildWorkbook(type) {
  const workbook = XLSX.utils.book_new();

  if (type === 'members') {
    const { worksheet } = rowsToSheet(await fetchMembersRows(), 'Members');
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');
    return workbook;
  }

  if (type === 'payments') {
    const { worksheet } = rowsToSheet(await fetchPaymentsRows(), 'Payments');
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');
    return workbook;
  }

  if (type === 'reimbursements') {
    const { worksheet } = rowsToSheet(await fetchReimbursementsRows(), 'Reimbursements');
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reimbursements');
    return workbook;
  }

  if (type === 'expense-claims') {
    const { worksheet } = rowsToSheet(await fetchExpenseClaimsRows(), 'Expense Claims');
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expense Claims');
    return workbook;
  }

  if (type === 'club-expenses') {
    const { worksheet } = rowsToSheet(await fetchClubExpensesRows(), 'Club Expenses');
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Club Expenses');
    return workbook;
  }

  if (type === 'projects') {
    const { worksheet } = rowsToSheet(await fetchProjectsRows(), 'Projects');
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Projects');
    return workbook;
  }

  if (type === 'events') {
    const { worksheet } = rowsToSheet(await fetchEventsRows(), 'Events');
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Events');
    return workbook;
  }

  if (type === 'fund-entries') {
    const { worksheet } = rowsToSheet(await fetchFundEntriesRows(), 'Fund Entries');
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fund Entries');
    return workbook;
  }

  if (type === 'full') {
    /* Fetch all data sets in parallel for performance */
    const [
      membersRows,
      paymentsRows,
      reimbursementsRows,
      expensesRows,
      projectsRows,
      eventsRows,
      fundEntriesRows,
      financeSummaryRows
    ] = await Promise.all([
      fetchMembersRows(),
      fetchPaymentsRows(),
      fetchReimbursementsRows(),
      fetchClubExpensesRows(),
      fetchProjectsRows(),
      fetchEventsRows(),
      fetchFundEntriesRows(),
      fetchFinanceSummaryRows()
    ]);

    const sheets = [
      rowsToSheet(financeSummaryRows, 'Finance Summary'),
      rowsToSheet(paymentsRows,        'Payments'),
      rowsToSheet(expensesRows,        'Expenses'),
      rowsToSheet(reimbursementsRows,  'Reimbursements'),
      rowsToSheet(fundEntriesRows,     'Fund Entries'),
      rowsToSheet(membersRows,         'Members'),
      rowsToSheet(projectsRows,        'Projects'),
      rowsToSheet(eventsRows,          'Events')
    ];

    sheets.forEach(({ sheetName, worksheet }) => {
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    return workbook;
  }

  throw new Error('Unknown report type');
}

async function generateReportBuffer(type) {
  const workbook = await buildWorkbook(type);
  return workbookToBuffer(workbook);
}

const REPORT_FILENAMES = {
  members: 'texcelerators-members.xlsx',
  payments: 'texcelerators-payments.xlsx',
  reimbursements: 'texcelerators-reimbursements.xlsx',
  'expense-claims': 'texcelerators-expense-claims.xlsx',
  'club-expenses': 'texcelerators-club-expenses.xlsx',
  projects: 'texcelerators-projects.xlsx',
  events: 'texcelerators-events.xlsx',
  'fund-entries': 'texcelerators-fund-entries.xlsx',
  full: 'texcelerators-full-club-report.xlsx'
};

module.exports = {
  generateReportBuffer,
  REPORT_FILENAMES
};
