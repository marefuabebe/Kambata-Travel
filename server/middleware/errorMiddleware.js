const logger = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Log the error with context
  logger.error(err.message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    stack: err.stack,
  });

  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };
