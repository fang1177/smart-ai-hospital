const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { error } = require('../utils/responseHelper');

/**
 * protect — verifies JWT Bearer token and attaches req.user
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Not authorized — no token provided', 401);
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return error(res, 'User linked to token no longer exists', 401);
    next();
  } catch (err) {
    return error(res, 'Not authorized — invalid or expired token', 401);
  }
};

/**
 * authorize(...roles) — role guard middleware factory
 * Usage: router.get('/admin-only', protect, authorize('admin'), handler)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return error(res, `Access denied — requires role: ${roles.join(' or ')}`, 403);
  }
  next();
};

module.exports = { protect, authorize };
