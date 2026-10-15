/**
 * Error with an HTTP status and optional per-field messages.
 * Thrown from controllers/services and turned into a JSON response by errorHandler.
 */
class ApiError extends Error {
  /**
   * @param {number} status  HTTP status code
   * @param {string} message Human readable message
   * @param {Record<string,string>} [errors] Field -> message map (for forms)
   */
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

module.exports = ApiError;
