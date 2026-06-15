const { Router } = require('express');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth, requireRole, blockIfMustChangePassword } = require('../middleware/auth');
const { generateReportBuffer, REPORT_FILENAMES } = require('../utils/excelReports');

const router = Router();

const VALID_TYPES = new Set([
  'members',
  'payments',
  'reimbursements',
  'expense-claims',
  'club-expenses',
  'projects',
  'events',
  'fund-entries',
  'full'
]);

router.get(
  '/export/:type',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { type } = req.params;

    if (!VALID_TYPES.has(type)) {
      return res.status(400).json({ message: 'Invalid report type' });
    }

    const buffer = await generateReportBuffer(type);
    const filename = REPORT_FILENAMES[type] || `texcelerators-${type}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  })
);

const reportRoutes = router;
module.exports = { reportRoutes };
