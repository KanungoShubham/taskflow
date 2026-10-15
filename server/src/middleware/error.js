const { ZodError } = require('zod');
const ApiError = require('../utils/ApiError');
const { formatZodError } = require('./validate');

/** 404 for any /api route that did not match. */
function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

/**
 * Central error handler. Maps known error types to clean JSON responses:
 * ApiError -> its status, ZodError -> 400, invalid ObjectId -> 404,
 * duplicate key -> 409, JWT errors -> 401, anything else -> 500.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message, ...(err.errors && { errors: err.errors }) });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ message: 'Validation failed', errors: formatZodError(err) });
  }
  if (err.name === 'CastError') {
    return res.status(404).json({ message: 'Resource not found' });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ message: `${field} already exists`, errors: { [field]: `${field} already exists` } });
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body' });
  }
  if (process.env.NODE_ENV !== 'test') console.error(err);
  return res.status(500).json({ message: 'Something went wrong. Please try again.' });
}

module.exports = { notFound, errorHandler };
