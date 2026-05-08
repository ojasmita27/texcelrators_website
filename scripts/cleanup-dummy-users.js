#!/usr/bin/env node
/* eslint-disable no-console */

// List candidate dummy users (for developer to inspect), and optionally remove them with --yes
// Heuristics used:
// - email contains "example" or "test" or starts with "temp" OR
// - mustChangePassword true and createdBy is null (possible seeded user) OR
// - role === 'member' and createdAt is older than 5 years

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env'), override: true });

const { User } = require('../models/User');
const { connectMongo } = require('../config/db');

async function main() {
  const args = process.argv.slice(2);
  const yes = args.includes('--yes');

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI is not set in .env');
    process.exit(1);
  }

  await connectMongo(mongoUri);

  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 5);

  const candidates = await User.find({
    $or: [
      { email: /example|test|temp/i },
      { mustChangePassword: true, createdBy: null },
      { role: 'member', createdAt: { $lt: cutoff } }
    ]
  }).lean();

  if (candidates.length === 0) {
    console.log('No candidate dummy users found.');
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log('Found candidate users:');
  candidates.forEach((u) => {
    console.log(`- ${u._id} | ${u.email} | role=${u.role} | active=${u.active} | mustChange=${u.mustChangePassword} | createdBy=${u.createdBy}`);
  });

  if (!yes) {
    console.log('\nTo delete these users, re-run with --yes (irreversible).');
    await mongoose.disconnect();
    process.exit(0);
  }

  const ids = candidates.map((u) => u._id);
  const res = await User.deleteMany({ _id: { $in: ids } });
  console.log(`Deleted ${res.deletedCount} users.`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err && err.message ? err.message : err);
  process.exit(1);
});
