const fs = require('fs');
const path = require('path');
const multer = require('multer');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function receiptUploader() {
  const uploadDir = process.env.RECEIPT_UPLOAD_DIR || 'uploads/receipts';
  const absoluteDir = path.join(process.cwd(), uploadDir);
  ensureDir(absoluteDir);

  const storage = multer.diskStorage({
    destination: function destination(req, file, cb) {
      cb(null, absoluteDir);
    },
    filename: function filename(req, file, cb) {
      const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const unique = `${Date.now()}_${Math.round(Math.random() * 1e9)}_${safeOriginal}`;
      cb(null, unique);
    }
  });

  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      // Accept common image/PDF receipts
      const ok = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf'
      ].includes(file.mimetype);
      if (!ok) {
        return cb(new Error('Unsupported receipt file type. Use JPG/PNG/WEBP/PDF.'));
      }
      cb(null, true);
    }
  });
}

module.exports = { receiptUploader };
