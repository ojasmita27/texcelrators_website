const fs = require('fs/promises');
const path = require('path');

const UPLOAD_DIRS = [
  path.join(process.cwd(), 'uploads'),
  path.join(process.cwd(), 'uploads', 'receipts'),
  path.join(process.cwd(), 'uploads', 'receipts', 'generated'),
  path.join(process.cwd(), 'uploads', 'receipts', 'proofs')
];

async function ensureUploadDirs() {
  await Promise.all(UPLOAD_DIRS.map((dir) => fs.mkdir(dir, { recursive: true })));
  return UPLOAD_DIRS;
}

module.exports = { ensureUploadDirs, UPLOAD_DIRS };
