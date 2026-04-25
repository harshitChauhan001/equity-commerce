const { fail } = require('../utils/response');

/**
 * Returns an express middleware that validates req.body against a Zod schema.
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      return fail(res, messages.join('; '), 400, 'VALIDATION_ERROR');
    }
    req.body = result.data; // use parsed/cleaned data
    next();
  };
}

module.exports = validate;
