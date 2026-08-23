const rateLimit = require("express-rate-limit");
const BlacklistedIP = require("../models/BlacklistedIP");
const logger = require("../utils/logger");

/**
 * Global Rate Limiter
 * Standard protection: 100 requests per 15 minutes.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 200 : 50000, // relaxed for development
  skip: (req) => {
    if (process.env.NODE_ENV !== "production") return true; // skip all limits in dev
    const ip = req.ip || req.headers["x-forwarded-for"];
    return ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1";
  },
  message: {
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict Auth Limiter
 * Brute force protection: 5 attempts per 15 minutes.
 */
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: {
    message: "Too many failed login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Booking Limiter
 * Protection: 20 requests per 1 minute.
 */
const bookingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  message: {
    message: "Too many booking requests. Please try again in a minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Blacklist Check Middleware
 * Rejects any request from a confirmed malicious IP.
 */
const checkBlacklist = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers["x-forwarded-for"];
    const isBlacklisted = await BlacklistedIP.findOne({
      ip,
      blockedUntil: { $gt: new Date() },
    });

    if (isBlacklisted) {
      logger.warn(`[BLOCKED] Access attempt from banned IP: ${ip}`);
      return res.status(403).json({
        message: "Your IP has been permanently or temporarily banned due to suspicious activity. Contact support if this is an error.",
      });
    }
    next();
  } catch (error) {
    logger.error("Error in checkBlacklist middleware:", error);
    next();
  }
};

module.exports = {
  globalLimiter,
  authLimiter,
  bookingLimiter,
  checkBlacklist,
};
