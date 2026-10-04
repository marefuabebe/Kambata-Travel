const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let userMessage = err.message || "An unexpected error occurred";

  // Log the error with context
  logger.error(err.message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    stack: err.stack,
  });

  // Sanitize internal library errors into clean, proper messages
  if (userMessage.includes("Illegal arguments")) {
    statusCode = 400;
    userMessage = "Invalid authentication parameters provided. Please check your credentials and try again.";
  }

  res.status(statusCode);
  res.json({
    message: userMessage,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };
