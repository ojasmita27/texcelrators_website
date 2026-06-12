const mongoose = require('mongoose');

/**
 * CERTIFICATE MODEL
 *
 * Stores structured metadata for member certificates.
 * Each certificate gets a unique auto-generated ID in the
 * format: TXC-CERT-YYYY-NNNNN (e.g. TXC-CERT-2026-00001)
 *
 * The existing User.certificates[] field (plain URL strings) is
 * left untouched for backwards compatibility.
 */

/* ─────────────────────────────────────────────
   Auto-incrementing sequence per calendar year
   ───────────────────────────────────────────── */
const CertSequenceSchema = new mongoose.Schema(
  {
    year:     { type: Number, required: true, unique: true },
    sequence: { type: Number, default: 0 }
  },
  { collection: 'cert_sequences' }
);

const CertSequence = mongoose.model('CertSequence', CertSequenceSchema);

async function allocateCertNumber(year) {
  const doc = await CertSequence.findOneAndUpdate(
    { year },
    { $inc: { sequence: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return `TXC-CERT-${year}-${String(doc.sequence).padStart(5, '0')}`;
}

/* ─────────────────────────────────────────────
   Certificate schema
   ───────────────────────────────────────────── */
const CertificateSchema = new mongoose.Schema(
  {
    // Human-readable unique ID, e.g. TXC-CERT-2026-00001
    certificateId: {
      type: String,
      unique: true,
      trim: true
    },

    // Owning member
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // Certificate identity
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    issuingOrganization: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200
    },
    issuedDate: {
      type: Date,
      default: null
    },

    // Category for filtering
    category: {
      type: String,
      enum: [
        'competition_win',
        'competition_participation',
        'workshop_completion',
        'training',
        'skill_certification',
        'appreciation',
        'other'
      ],
      default: 'other'
    },

    // Optional links
    linkedEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      default: null
    },
    linkedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null
    },

    // Uploaded file
    filePath:          { type: String, default: '' },  // /uploads/certificates/<filename>
    fileOriginalName:  { type: String, default: '' },
    fileType:          { type: String, default: '' },  // 'pdf' | 'image'
    uploadedAt:        { type: Date,   default: null },

    // Admin notes – long-form text, min 1000 char capacity
    adminNotes:  { type: String, default: '', maxlength: 5000 },

    // Audit
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

/* indexes */
CertificateSchema.index({ member: 1, issuedDate: -1 });
CertificateSchema.index({ certificateId: 1 }, { unique: true });
CertificateSchema.index({ category: 1 });

/* Assign certificateId before first save */
CertificateSchema.pre('validate', async function preSave(next) {
  if (!this.certificateId) {
    const year = new Date().getFullYear();
    this.certificateId = await allocateCertNumber(year);
  }
  next();
});

const Certificate = mongoose.model('Certificate', CertificateSchema);

module.exports = { Certificate, allocateCertNumber };
