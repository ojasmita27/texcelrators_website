#!/usr/bin/env node
/* eslint-disable no-console */

const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env'), override: true });

const { connectMongo } = require('../config/db');
const { User } = require('../models/User');

function deriveStatus(user) {
  if (user.status === 'active' || user.status === 'inactive' || user.status === 'removed') {
    return user.status;
  }

  return user.active ? 'active' : 'inactive';
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--yes');

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in .env');
  }

  await connectMongo(process.env.MONGODB_URI);

  const users = await User.find({}).lean();
  const updates = [];

  for (const user of users) {
    const nextStatus = deriveStatus(user);
    const nextActive = nextStatus === 'active';
    const currentStatus = user.status || null;
    const currentActive = typeof user.active === 'boolean' ? user.active : null;

    if (currentStatus === nextStatus && currentActive === nextActive) {
      continue;
    }

    updates.push({
      id: String(user._id),
      email: user.email,
      from: { status: currentStatus, active: currentActive },
      to: { status: nextStatus, active: nextActive }
    });
  }

  if (updates.length === 0) {
    console.log('User status migration: no changes needed.');
    await mongoose.disconnect();
    return;
  }

  console.log(`User status migration candidates: ${updates.length}`);
  updates.forEach((item) => {
    console.log(`- ${item.email}: ${JSON.stringify(item.from)} -> ${JSON.stringify(item.to)}`);
  });

  if (dryRun) {
    console.log('\nDry run only. Re-run with --yes to apply these updates.');
    await mongoose.disconnect();
    return;
  }

  let updatedCount = 0;
  for (const item of updates) {
    await User.updateOne(
      { _id: item.id },
      { $set: { status: item.to.status, active: item.to.active } }
    );
    updatedCount += 1;
  }

  console.log(`Applied status migration to ${updatedCount} users.`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Migration failed:', err && err.message ? err.message : err);
  try {
    await mongoose.disconnect();
  } catch (_) {
    // ignore
  }
  process.exit(1);
});
