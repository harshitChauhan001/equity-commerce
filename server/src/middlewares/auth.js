const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const { fail } = require('../utils/response');

/**
 * JWT authentication middleware.
 * Extracts token from Authorization: Bearer <token>
 * Attaches req.user = { id, name, email, role }
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return fail(res, 'Authentication required', 401, 'UNAUTHORIZED');
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return fail(res, 'User not found', 401, 'UNAUTHORIZED');
    }

    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return fail(res, 'Token expired', 401, 'TOKEN_EXPIRED');
    }
    return fail(res, 'Invalid token', 401, 'UNAUTHORIZED');
  }
}

/**
 * Role-based authorization middleware.
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return fail(res, 'Insufficient permissions', 403, 'FORBIDDEN');
    }
    next();
  };
}

module.exports = { authenticate, authorize };
