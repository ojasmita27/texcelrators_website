#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');

const ROOT = path.join(__dirname, '..');
const BACKEND_OFFICIAL_ROUTE = 'GET /payments/receipt/:paymentId/official';
const BACKEND_PROOF_ROUTE = 'GET /payments/receipt/:paymentId/proof';
const FRONTEND_OFFICIAL = '/payments/receipt/:paymentId/official';
const FRONTEND_PROOF = '/payments/receipt/:paymentId/proof';
const RECEIPT_DIR = path.join(ROOT, 'uploads', 'receipts', 'generated');

async function requestJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let parsed = {};
        try { parsed = JSON.parse(body); } catch { parsed = { raw: body }; }
        resolve({ status: res.statusCode, body: parsed });
      });
    }).on('error', reject);
  });
}

async function main() {
  const paymentRoutesSource = fs.readFileSync(path.join(ROOT, 'routes/payment.routes.js'), 'utf8');
  const serverSource = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
  const scriptSource = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');

  const { paymentRoutes } = require('../routes/payment.routes');
  const app = express();
  app.use('/payments', paymentRoutes);
  app.use((req, res) => res.status(404).json({ message: 'Not found' }));

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const { port } = server.address();
  const fakePaymentId = new mongoose.Types.ObjectId().toString();

  const official = await requestJson(`http://127.0.0.1:${port}/payments/receipt/${fakePaymentId}/official`);
  const proof = await requestJson(`http://127.0.0.1:${port}/payments/receipt/${fakePaymentId}/proof`);

  await new Promise((resolve) => server.close(resolve));

  const filesFound = fs.existsSync(RECEIPT_DIR)
    ? fs.readdirSync(RECEIPT_DIR).filter((name) => /\.pdf$/i.test(name)).length
    : 0;

  const pass = official.status === 401
    && proof.status === 401
    && official.body.message !== 'Not found'
    && paymentRoutesSource.includes('/receipt/:paymentId/official')
    && scriptSource.includes('/official')
    && serverSource.indexOf("app.use('/payments', paymentRoutes)") < serverSource.indexOf('express.static');

  console.log('=== RECEIPT DOWNLOAD AUDIT ===');
  console.log(`Backend Route (Official): ${BACKEND_OFFICIAL_ROUTE}`);
  console.log(`Backend Route (Proof): ${BACKEND_PROOF_ROUTE}`);
  console.log(`Frontend URL (Official): \${API_BASE}${FRONTEND_OFFICIAL}`);
  console.log(`Frontend URL (Proof): \${API_BASE}${FRONTEND_PROOF}`);
  console.log(`Receipt Directory: ${RECEIPT_DIR}`);
  console.log(`Files Found: ${filesFound}`);
  console.log(`Result: ${pass ? 'PASS' : 'FAIL'}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
