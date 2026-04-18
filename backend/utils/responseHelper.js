/**
 * Standardized API Response Helpers
 * All controllers use these to ensure consistent response shape:
 *   { success: Boolean, message: String, data: Any }
 */

const success = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const error = (res, message = 'An error occurred', statusCode = 400) => {
  return res.status(statusCode).json({ success: false, message, data: null });
};

module.exports = { success, error };
