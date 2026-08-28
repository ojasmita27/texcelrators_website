require('dotenv').config();
const { signAccessToken } = require('../utils/jwt');
const { connectMongo } = require('../config/db');
const { User } = require('../models/User');

(async () => {
  try {
    await connectMongo(process.env.MONGODB_URI);
    const admin = await User.findOne({ role: 'admin' }).lean();
    if (!admin) return console.error('No admin found');
    const token = signAccessToken({ sub: String(admin._id), role: 'admin', email: admin.email });
    console.log(token);
    process.exit(0);
  } catch (err) {
    console.error('ERR', err && err.message);
    process.exit(1);
  }
})();