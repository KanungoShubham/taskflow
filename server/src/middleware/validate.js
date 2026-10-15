const { ZodError } = require('zod');

/** Converts a ZodError into a { field: message } map (first message per field). */
function formatZodError(err) {
  const errors = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || 'root';
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

/**
 * Validates the request against zod schemas.
 * - body:   parsed value replaces req.body
 * - query:  parsed value is stored on req.validQuery (req.query is read-only in some setups)
 * - params: parsed value is stored on req.validParams
 * On failure responds 400 { message: 'Validation failed', errors }.
 */
function validate({ body, query, params } = {}) {
  return (req, res, next) => {
    try {
      if (body) req.body = body.parse(req.body ?? {});
      if (query) req.validQuery = query.parse(req.query ?? {});
      if (params) req.validParams = params.parse(req.params ?? {});
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({ message: 'Validation failed', errors: formatZodError(err) });
      }
      next(err);
    }
  };
}

module.exports = { validate, formatZodError };
