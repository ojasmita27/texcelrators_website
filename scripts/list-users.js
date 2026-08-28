const { connectMongo } = require('../config/db');
const mongoose = require('mongoose');
const { User } = require('../models/User');

(async () => {
  try {
    await connectMongo(process.env.MONGODB_URI);
    const users = await User.find().lean();
    console.log('USERS_COUNT=' + users.length);
    users.forEach(u => console.log(JSON.stringify({ id: String(u._id), name: u.name, email: u.email, role: u.role, status: u.status }))); 
    process.exit(0);
  } catch (err) {
    console.error('ERR', err && err.message);
    process.exit(1);
  }
})();