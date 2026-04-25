const logger = require('../utils/logger');
const { fail } = require('../utils/response');

function errorHandler(err, req, res, _next) {
  logger.error({ err }, err.message);

  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = status === 500 ? 'Internal server error' : err.message;

  return fail(res, message, status, code);
}

module.exports = errorHandler;
