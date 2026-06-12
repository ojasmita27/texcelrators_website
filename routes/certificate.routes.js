const { Router }       = require('express');
const path             = require('path');
const fs               = require('fs/promises');
const mongoose         = require('mongoose');
const { asyncHandler } = require('../utils/asyncHandler');
const { requireAuth, requireRole, blockIfMustChangePassword } = require('../middleware/auth');
const { certificatesUploader } = require('../utils/upload');
const { Certificate }  = require('../models/Certificate');
const { User }         = require('../models/User');
const { logInfo, logWarn, logError } = require('../utils/logger');

const router = Router();
const upload = certificatesUploader();

/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */
function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function resolveCertAbsPath(publicPath) {
  if (!publicPath || typeof publicPath !== 'string') return null;
  const trimmed = publicPath.trim().replace(/\\/g, '/');
  if (!trimmed.startsWith('/uploads/certificates/')) return null;
  const rel = trimmed.slice('/uploads/certificates/'.length);
  if (!rel || rel.includes('..')) return null;
  const abs = path.normalize(path.join(process.cwd(), 'uploads', 'certificates', rel));
  const root = path.normalize(path.join(process.cwd(), 'uploads', 'certificates'));
  return abs.startsWith(root) ? abs : null;
}

async function unlinkCertFile(publicPath) {
  const abs = resolveCertAbsPath(publicPath);
  if (!abs) return;
  try { await fs.unlink(abs); } catch (_) { /* ignore ENOENT */ }
}

function buildFileType(mimetype) {
  if (!mimetype) return 'file';
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype.startsWith('image/')) return 'image';
  return 'file';
}

const POPULATE_OPTS = [
  { path: 'member',     select: 'name email' },
  { path: 'uploadedBy', select: 'name email role' }
];

/* ═══════════════════════════════════════════
   GET /certificates
   Admin + Member — list ALL certificates
   Admin sees everything; members also see all (per requirements)
   Query: ?memberId=&category=&search=
   ═══════════════════════════════════════════ */
router.get(
  '/',
  requireAuth,
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { memberId, category, search } = req.query;
    const query = {};

    if (memberId && isValidObjectId(memberId)) query.member = memberId;
    if (category && category !== 'all') query.category = category;
    if (search && String(search).trim()) {
      const regex = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { title: regex },
        { issuingOrganization: regex },
        { certificateId: regex }
      ];
    }

    const certificates = await Certificate
      .find(query)
      .populate(POPULATE_OPTS)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return res.json({ certificates });
  })
);

/* ═══════════════════════════════════════════
   POST /certificates/upload
   Admin + Member — upload a certificate
   Admin must supply memberId; member uploads for themselves
   ═══════════════════════════════════════════ */
router.post(
  '/upload',
  requireAuth,
  blockIfMustChangePassword,
  upload.single('certificate'),
  asyncHandler(async (req, res) => {
    const {
      memberId,
      title,
      issuingOrganization,
      issuedDate,
      category,
      adminNotes,
      isPublic
    } = req.body || {};

    /* ── Resolve the target member ── */
    let targetMember;
    if (req.user.role === 'admin') {
      if (!memberId || !isValidObjectId(memberId)) {
        if (req.file) await unlinkCertFile(`/uploads/certificates/${req.file.filename}`);
        return res.status(400).json({ message: 'memberId is required when uploading as admin' });
      }
      targetMember = await User.findOne({ _id: memberId, role: 'member' });
      if (!targetMember) {
        if (req.file) await unlinkCertFile(`/uploads/certificates/${req.file.filename}`);
        return res.status(404).json({ message: 'Member not found' });
      }
    } else {
      // member uploads for themselves
      targetMember = req.user;
    }

    if (!title || !String(title).trim()) {
      if (req.file) await unlinkCertFile(`/uploads/certificates/${req.file.filename}`);
      return res.status(400).json({ message: 'title is required' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Certificate file is required' });
    }

    const filePath = `/uploads/certificates/${req.file.filename}`;

    const cert = await Certificate.create({
      member:              targetMember._id,
      title:               String(title).trim(),
      issuingOrganization: String(issuingOrganization || '').trim(),
      issuedDate:          issuedDate ? new Date(issuedDate) : null,
      category:            category || 'other',
      adminNotes:          String(adminNotes || '').slice(0, 5000),
      isPublic:            isPublic !== 'false',
      filePath,
      fileOriginalName:    req.file.originalname,
      fileType:            buildFileType(req.file.mimetype),
      uploadedAt:          new Date(),
      uploadedBy:          req.user._id,
      createdBy:           req.user._id
    });

    await cert.populate(POPULATE_OPTS);

    logInfo('certificates', 'Certificate uploaded', {
      certId:     cert.certificateId,
      memberId:   String(targetMember._id),
      uploadedBy: String(req.user._id),
      role:       req.user.role
    });

    return res.status(201).json({ message: 'Certificate uploaded successfully', certificate: cert });
  })
);

/* ═══════════════════════════════════════════
   PATCH /certificates/:id
   Admin only — edit metadata + notes
   ═══════════════════════════════════════════ */
router.patch(
  '/:id',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid certificate id' });

    const cert = await Certificate.findById(id);
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });

    const allowed = ['title', 'issuingOrganization', 'issuedDate', 'category', 'adminNotes', 'isPublic'];

    allowed.forEach((field) => {
      if (!Object.prototype.hasOwnProperty.call(req.body, field)) return;
      if (field === 'issuedDate') {
        cert.issuedDate = req.body.issuedDate ? new Date(req.body.issuedDate) : null;
      } else if (field === 'adminNotes') {
        cert.adminNotes = String(req.body.adminNotes || '').slice(0, 5000);
      } else if (field === 'isPublic') {
        cert.isPublic = req.body.isPublic !== false && req.body.isPublic !== 'false';
      } else {
        cert[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
      }
    });

    await cert.save();
    await cert.populate(POPULATE_OPTS);

    logInfo('certificates', 'Certificate updated', { certId: cert.certificateId, adminId: String(req.user._id) });
    return res.json({ message: 'Certificate updated', certificate: cert });
  })
);

/* ═══════════════════════════════════════════
   DELETE /certificates/:id
   Admin only — delete certificate + file
   ═══════════════════════════════════════════ */
router.delete(
  '/:id',
  requireAuth,
  requireRole('admin'),
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid certificate id' });

    const cert = await Certificate.findById(id);
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });

    if (cert.filePath) await unlinkCertFile(cert.filePath);
    await cert.deleteOne();

    logInfo('certificates', 'Certificate deleted', { certId: cert.certificateId, deletedBy: String(req.user._id) });
    return res.json({ message: 'Certificate deleted' });
  })
);

/* ═══════════════════════════════════════════
   GET /certificates/:id/download
   Admin + Member — download file
   Members can download any certificate (all are visible to all)
   ═══════════════════════════════════════════ */
router.get(
  '/:id/download',
  requireAuth,
  blockIfMustChangePassword,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid certificate id' });

    const cert = await Certificate.findById(id).populate('member', 'name email');
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });

    const absPath = resolveCertAbsPath(cert.filePath);
    if (!absPath) {
      logWarn('certificates', 'Certificate file path invalid', { certId: cert.certificateId });
      return res.status(404).json({ message: 'Certificate file path is invalid' });
    }

    try {
      await fs.access(absPath);
    } catch (_) {
      logWarn('certificates', 'Certificate file missing on disk', { certId: cert.certificateId, filePath: cert.filePath });
      return res.status(404).json({ message: 'Certificate file not found on server' });
    }

    const downloadName = cert.fileOriginalName || `${cert.certificateId}.pdf`;
    res.setHeader('Cache-Control', 'private, no-store');

    logInfo('certificates', 'Certificate downloaded', { certId: cert.certificateId, downloadedBy: String(req.user._id) });
    return res.download(absPath, downloadName, (err) => {
      if (err && !res.headersSent) {
        logError('certificates', 'Download stream error', { certId: cert.certificateId, message: err.message });
        res.status(500).json({ message: 'Download failed' });
      }
    });
  })
);

module.exports = { certificateRoutes: router };
