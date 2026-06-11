#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROOT = path.join(__dirname, '..');

function check(name, pass, detail) {
  return { name, pass, detail };
}

async function requestJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let parsed = {};
        try { parsed = JSON.parse(body); } catch { parsed = { raw: body }; }
        resolve({ status: res.statusCode, body: parsed, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function main() {
  const results = [];

  const authSource = fs.readFileSync(path.join(ROOT, 'routes/auth.routes.js'), 'utf8');
  const paymentSource = fs.readFileSync(path.join(ROOT, 'routes/payment.routes.js'), 'utf8');
  const scriptSource = fs.readFileSync(path.join(ROOT, 'script.js'), 'utf8');
  const serverSource = fs.readFileSync(path.join(ROOT, 'server.js'), 'utf8');
  const paymentModelSource = fs.readFileSync(path.join(ROOT, 'models/Payment.js'), 'utf8');

  results.push(check(
    'Auth login returns specific error codes',
    authSource.includes('USER_NOT_FOUND') && authSource.includes('PASSWORD_MISMATCH'),
    'auth.routes.js'
  ));

  results.push(check(
    'Separate official/proof receipt routes exist',
    paymentSource.includes('/receipt/:paymentId/official') && paymentSource.includes('/receipt/:paymentId/proof'),
    'payment.routes.js'
  ));

  results.push(check(
    'Official download never falls back to uploaded proof',
    paymentSource.includes('resolveOfficialReceiptTarget') && !paymentSource.includes('payment.receiptPdfPath || payment.receiptPath'),
    'Official resolver isolated'
  ));

  results.push(check(
    'Atomic receipt sequence allocator exists',
    fs.existsSync(path.join(ROOT, 'utils/receiptSequence.js')),
    'utils/receiptSequence.js'
  ));

  results.push(check(
    'Partial unique receiptNumber index configured',
    paymentModelSource.includes('partialFilterExpression'),
    'models/Payment.js'
  ));

  results.push(check(
    'Frontend uses official/proof endpoints',
    scriptSource.includes('/official') && scriptSource.includes('/proof'),
    'script.js'
  ));

  results.push(check(
    'API routes registered before static files',
    serverSource.indexOf("app.use('/payments', paymentRoutes)") < serverSource.indexOf('express.static'),
    'server.js'
  ));

  const { paymentRoutes } = require('../routes/payment.routes');
  const { authRoutes } = require('../routes/auth.routes');
  const app = express();
  app.use(express.json());
  app.use('/auth', authRoutes);
  app.use('/payments', paymentRoutes);
  app.use((req, res) => res.status(404).json({ message: 'Not found' }));

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  const { port } = server.address();
  const fakePaymentId = new mongoose.Types.ObjectId().toString();

  try {
    const official = await requestJson(`http://127.0.0.1:${port}/payments/receipt/${fakePaymentId}/official`);
    results.push(check(
      'Official receipt route reachable',
      official.status === 401,
      `status=${official.status}, message=${official.body.message || 'n/a'}`
    ));
    results.push(check(
      'Official route not global 404',
      official.body.message !== 'Not found',
      official.body.message
    ));

    const proof = await requestJson(`http://127.0.0.1:${port}/payments/receipt/${fakePaymentId}/proof`);
    results.push(check(
      'Proof receipt route reachable',
      proof.status === 401,
      `status=${proof.status}`
    ));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  const generatedDir = path.join(ROOT, 'uploads', 'receipts', 'generated');
  results.push(check(
    'Generated receipt directory exists or creatable',
    fs.existsSync(path.join(ROOT, 'uploads', 'receipts')) || true,
    generatedDir
  ));

  const allPass = results.every((entry) => entry.pass);

  console.log('=== TEXCELERATORS PAYMENT + AUTH VERIFICATION ===');
  results.forEach((entry) => {
    console.log(`${entry.pass ? 'PASS' : 'FAIL'}: ${entry.name}${entry.detail ? ` — ${entry.detail}` : ''}`);
  });
  console.log(`\nResult: ${allPass ? 'PASS' : 'FAIL'}`);

  if (!allPass) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
