const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' '); // Expect: Bearer <token>

    if (!token) {
      return res.status(401).json({ message: 'Missing Authorization token' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'Server misconfigured (JWT_SECRET missing)' });
    }

    const payload = jwt.verify(token, secret);
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token user' });
    }

    const status = user.status || (user.active ? 'active' : 'inactive');
    if (status !== 'active') {
      return res.status(403).json({ message: 'User is not active' });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user) {
      return res.status(500).json({ message: 'Auth middleware not applied' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return next();
  };
}

function blockIfMustChangePassword(req, res, next) {
  if (req.user && req.user.mustChangePassword) {
    return res.status(403).json({
      message: 'Password change required',
      code: 'PASSWORD_CHANGE_REQUIRED'
    });
  }
  return next();
}

module.exports = { requireAuth, requireRole, blockIfMustChangePassword };
