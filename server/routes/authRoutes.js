const express = require("express");
const router = express.Router();
const { authLimiter } = require("../middleware/securityMiddleware");
const {
  registerUser,
  loginUser,
  refreshAccessToken,
  forgotPassword,
  verifyOTP,
  resetPassword,
  verifyEmail,
  resendVerificationOTP,
  googleAuth,
  googleCompleteRegistration,
} = require("../controllers/authController");
const { authRateLimiter, resendOtpRateLimiter } = require("../middleware/rateLimiter");
const { checkIPBlock } = require("../middleware/blockMiddleware");

// Apply IP rate limiting and block check to all auth routes
router.use(authRateLimiter);
router.use(checkIPBlock);

router.post("/register", authLimiter, registerUser);
router.post("/login", authLimiter, loginUser);
router.post("/google", authLimiter, googleAuth);
router.post("/google/complete", authLimiter, googleCompleteRegistration);
router.post("/refresh", refreshAccessToken);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendOtpRateLimiter, resendVerificationOTP);

module.exports = router;
