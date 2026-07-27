const rateLimit = require("express-rate-limit");

/**
 * Global rate limiter for sensitive authentication endpoints
 * Max 10 requests per 1 minute
 */
const authRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: {
    message: "Too many requests from this IP, please try again after a minute",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const profileRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: {
    message: "Too many profile updates, please try again after a minute",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const resendOtpRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1, // 1 request per minute
  message: {
    message: "Please wait a minute before requesting a new OTP.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authRateLimiter, profileRateLimiter, resendOtpRateLimiter };
