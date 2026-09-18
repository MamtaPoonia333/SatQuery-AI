// Catches anything passed to next(err) and any uncaught throw inside
// async route handlers wrapped with asyncHandler.

/**
 * @description Catches any request that doesn't match a defined route and
 * responds with a clean 404 JSON payload instead of Express's default HTML
 * error page. Must be registered after all real routes are mounted.
 * @access Public
 */
export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

/**
 * @description Centralised error handler for the whole app. Normalises known
 * error types (Mongo duplicate key, Mongoose validation errors) into
 * friendly messages, and falls back to the error's own statusCode/message
 * for everything else. Must be the last middleware registered.
 * @access Public
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err.message);

  // Mongoose duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists",
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors)
        .map((e) => e.message)
        .join(", "),
    });
  }

  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
  });
};

/**
 * @description Wraps an async route handler so any rejected promise (thrown
 * error) is forwarded to next(err) and handled by errorHandler, instead of
 * crashing the process or leaving the request hanging.
 * @param {Function} fn - An async (req, res, next) route handler.
 * @access Public
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
