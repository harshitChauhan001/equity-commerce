const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config');
const { ok, fail } = require('../utils/response');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

/**
 * POST /api/auth/signup
 */
async function signup(req, res, next) {
  try {
    const { name, email, password, bankCode } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return fail(res, 'Email already registered', 409, 'EMAIL_EXISTS');
    }

    const user = await User.create({ name, email, password, ...(bankCode && { bankCode }) });
    const token = generateToken(user);

    return ok(res, { user: user.toJSON(), token }, 'Account created', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return fail(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return fail(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const token = generateToken(user);

    return ok(res, { user: user.toJSON(), token }, 'Login successful');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 */
async function me(req, res) {
  return ok(res, req.user);
}

module.exports = { signup, login, me };
