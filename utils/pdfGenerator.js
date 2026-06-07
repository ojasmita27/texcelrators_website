const fs = require('fs');
const path = require('path');

function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function normalizeText(value) {
  return String(value == null ? '' : value)
    .replace(/\s+/g, ' ')
    .trim();
}

function escapePdfText(value) {
  return normalizeText(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatAmount(amount) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return '0.00';
  }

  return numericAmount.toFixed(2);
}

function buildReceiptNumber(year, sequence) {
  return `TXC-${year}-${String(sequence).padStart(6, '0')}`;
}

function wrapText(text, maxChars) {
  const words = normalizeText(text).split(' ').filter(Boolean);
  const lines = [];
  let current = '';

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  });

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [''];
}

function buildContentLines(data) {
  const lines = [];
  const addLine = (text, options = {}) => {
    lines.push({
      text,
      font: options.font || 'F1',
      size: options.size || 12,
      leading: options.leading || Math.round((options.size || 12) * 1.35),
      x: options.x == null ? 56 : options.x
    });
  };

  const addWrappedLine = (text, options = {}) => {
    const maxChars = options.maxChars || 70;
    wrapText(text, maxChars).forEach((part, index) => {
      addLine(part, {
        font: options.font,
        size: options.size,
        leading: options.leading,
        x: index === 0 ? options.x : (options.continuationX == null ? (options.x == null ? 56 : options.x) : options.continuationX)
      });
    });
  };

  addLine('Texcelerators Robotics Club', { font: 'F2', size: 20, leading: 26, x: 56 });
  addLine('Official Payment Receipt', { font: 'F1', size: 13, leading: 18, x: 56 });
  addLine('', { size: 8, leading: 10 });
  addLine('------------------------------------------------------------', { font: 'F1', size: 11, leading: 14 });
  addLine('', { size: 8, leading: 10 });

  addWrappedLine(`Receipt Number: ${data.receiptNumber}`, { font: 'F2', size: 12, maxChars: 60 });
  addWrappedLine(`Member Name: ${data.memberName}`, { maxChars: 60 });
  if (data.memberEmail) {
    addWrappedLine(`Member Email: ${data.memberEmail}`, { maxChars: 60 });
  }
  if (data.membershipId) {
    addWrappedLine(`Membership ID: ${data.membershipId}`, { maxChars: 60 });
  }
  addWrappedLine(`Amount Paid: INR ${formatAmount(data.amount)}`, { maxChars: 60 });
  addWrappedLine(`Payment Method: ${normalizeText(data.paymentMethod)}`, { maxChars: 60 });
  addWrappedLine(`Submission Date & Time: ${formatDateTime(data.submissionDate)}`, { maxChars: 60 });
  addWrappedLine(`Status: ${normalizeText(data.status || 'Approved')}`, { maxChars: 60 });
  addWrappedLine(`Approved By: ${data.approvedByName || 'N/A'}`, { maxChars: 60 });
  addWrappedLine(`Approval Date & Time: ${formatDateTime(data.approvalDateTime)}`, { maxChars: 60 });
  addWrappedLine(`Receipt Generated At: ${formatDateTime(data.receiptGeneratedAt)}`, { maxChars: 60 });

  if (data.paymentNotes) {
    addLine('', { size: 8, leading: 10 });
    addLine('Notes', { font: 'F2', size: 12, leading: 16 });
    addWrappedLine(data.paymentNotes, { maxChars: 72 });
  }

  addLine('', { size: 8, leading: 10 });
  addLine('------------------------------------------------------------', { font: 'F1', size: 11, leading: 14 });
  addWrappedLine('Computer Generated Official Receipt', { maxChars: 72 });

  return lines;
}

function buildPdfBuffer(contentLines) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const topMargin = 60;
  const bottomMargin = 56;
  const usableHeight = pageHeight - topMargin - bottomMargin;
  let y = pageHeight - topMargin;

  const streamParts = [];
  streamParts.push('0.05 0.36 0.53 rg');
  streamParts.push(`56 ${pageHeight - 42} 483 2 re f`);

  contentLines.forEach((line) => {
    y -= line.leading;
    if (y < bottomMargin) {
      y = bottomMargin;
    }
    streamParts.push(`BT /${line.font} ${line.size} Tf 1 0 0 1 ${line.x} ${y} Tm (${escapePdfText(line.text)}) Tj ET`);
  });

  const contentStream = streamParts.join('\n');

  const objects = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = '<< /Type /Pages /Kids [5 0 R] /Count 1 >>';
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
  objects[5] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents 6 0 R >>`;
  objects[6] = `<< /Length ${Buffer.byteLength(contentStream, 'latin1')} >>\nstream\n${contentStream}\nendstream`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  for (let i = 1; i <= 6; i += 1) {
    offsets[i] = Buffer.byteLength(pdf, 'latin1');
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += 'xref\n0 7\n0000000000 65535 f \n';

  for (let i = 1; i <= 6; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += 'trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n';
  pdf += `${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'latin1');
}

async function generateReceiptPdf({
  outputDir,
  receiptNumber,
  memberName,
  memberEmail,
  membershipId,
  amount,
  paymentMethod,
  submissionDate,
  status,
  approvedByName,
  approvalDateTime,
  receiptGeneratedAt,
  paymentNotes
}) {
  ensureDirectory(outputDir);

  const fileName = `${receiptNumber}.pdf`;
  const absolutePath = path.join(outputDir, fileName);
  const publicPath = `/uploads/receipts/generated/${fileName}`;

  const contentLines = buildContentLines({
    receiptNumber,
    memberName,
    memberEmail,
    membershipId,
    amount,
    paymentMethod,
    submissionDate,
    status,
    approvedByName,
    approvalDateTime,
    receiptGeneratedAt,
    paymentNotes
  });

  const pdfBuffer = buildPdfBuffer(contentLines);
  fs.writeFileSync(absolutePath, pdfBuffer);

  return {
    fileName,
    absolutePath,
    publicPath
  };
}

module.exports = {
  buildReceiptNumber,
  generateReceiptPdf,
  formatDateTime,
  formatAmount
};