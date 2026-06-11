#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');

const ROOT = path.join(__dirname, '..');
const BACKEND_ROUTE = 'GET /payments/receipt/:paymentId';
const FRONTEND_PATH = '/payments/receipt/';
const RECEIPT_DIR = path.join(ROOT, 'uploads', 'receipts', 'generated');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function countGeneratedReceipts() {
  if (!fs.existsSync(RECEIPT_DIR)) return 0;
  return fs.readdirSync(RECEIPT_DIR).filter((name) => /\.pdf$/i.test(name)).length;
}

function check(name, pass, detail) {
  return { name, pass, detail };
}

async function requestJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let parsed = {};
        try {
          parsed = JSON.parse(body);
        } catch {
          parsed = { raw: body };
        }
        resolve({ status: res.statusCode, body: parsed, headers: res.headers });
      });
    }).on('error', reject);
  });
}

async function main() {
  const results = [];

  const paymentRoutesSource = read(path.join(ROOT, 'routes', 'payment.routes.js'));
  const serverSource = read(path.join(ROOT, 'server.js'));
  const scriptSource = read(path.join(ROOT, 'script.js'));

  const routeExists = paymentRoutesSource.includes("'/receipt/:paymentId'")
    && paymentRoutesSource.includes('requireAuth');
  results.push(check('Route exists', routeExists, BACKEND_ROUTE));

  const apiBeforeStatic = serverSource.indexOf("app.use('/payments', paymentRoutes)")
    < serverSource.indexOf('express.static');
  results.push(check('Route registered before static middleware', apiBeforeStatic, "app.use('/payments', paymentRoutes)"));

  const routeRegistered = serverSource.includes("app.use('/payments', paymentRoutes)");
  results.push(check('Route registered in server.js', routeRegistered, '/payments -> paymentRoutes'));

  const frontendMatches = scriptSource.includes("const RECEIPT_DOWNLOAD_PATH = '/payments/receipt'")
    && scriptSource.includes('buildReceiptDownloadUrl');
  results.push(check('Frontend URL matches route', frontendMatches, `${FRONTEND_PATH}:paymentId`));

  const { paymentRoutes, resolveUploadAbsolutePath } = require('../routes/payment.routes');
  const app = express();
  app.use('/payments', paymentRoutes);
  app.use((req, res) => res.status(404).json({ message: 'Not found' }));

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const { port } = server.address();
  const fakePaymentId = new mongoose.Types.ObjectId().toString();

  try {
    const unauthenticated = await requestJson(`http://127.0.0.1:${port}/payments/receipt/${fakePaymentId}`);
    const endpointReachable = unauthenticated.status === 401
      && unauthenticated.body.message === 'Missing Authorization token';
    results.push(check(
      'Download endpoint reachable (auth enforced)',
      endpointReachable,
      `status=${unauthenticated.status}, message=${unauthenticated.body.message || 'n/a'}`
    ));

    const globalNotFound = unauthenticated.status === 404 && unauthenticated.body.message === 'Not found';
    results.push(check('No global 404 for receipt route', !globalNotFound, globalNotFound ? 'Route still returns global Not found' : 'Route handled by payment router'));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  const samplePublicPath = '/uploads/receipts/generated/TXC-2026-000001.pdf';
  const resolvedSample = resolveUploadAbsolutePath(samplePublicPath);
  const pathTraversalBlocked = resolveUploadAbsolutePath('/uploads/../secret.txt') === null;
  results.push(check('Payment lookup path resolver works', Boolean(resolvedSample), resolvedSample || 'n/a'));
  results.push(check('Path traversal blocked', pathTraversalBlocked, '/uploads/../secret.txt rejected'));

  const filesFound = countGeneratedReceipts();
  results.push(check(
    'PDF path directory available',
    fs.existsSync(path.join(ROOT, 'uploads', 'receipts')),
    RECEIPT_DIR
  ));

  const allPass = results.every((entry) => entry.pass);

  console.log('=== RECEIPT DOWNLOAD AUDIT ===');
  console.log(`Backend Route: ${BACKEND_ROUTE}`);
  console.log(`Frontend URL: \${API_BASE}${FRONTEND_PATH}:paymentId`);
  console.log(`Receipt Directory: ${RECEIPT_DIR}`);
  console.log(`Files Found: ${filesFound}`);
  console.log('');
  results.forEach((entry) => {
    console.log(`${entry.pass ? 'PASS' : 'FAIL'}: ${entry.name}${entry.detail ? ` — ${entry.detail}` : ''}`);
  });
  console.log('');
  console.log(`Result: ${allPass ? 'PASS' : 'FAIL'}`);

  if (!allPass) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
