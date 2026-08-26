const express = require("express");
const router = express.Router();
const { submitInquiry } = require("../controllers/contactController");
const rateLimit = require("express-rate-limit");

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: "Too many inquiries. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/", contactLimiter, submitInquiry);

module.exports = router;
