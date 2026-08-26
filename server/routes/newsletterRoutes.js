const express = require("express");
const router = express.Router();
const Newsletter = require("../models/Newsletter");
const rateLimit = require("express-rate-limit");

const newsletterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { success: false, message: "Too many subscription attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// @desc    Subscribe to newsletter
// @route   POST /api/newsletter
// @access  Public
router.post("/", newsletterLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Please provide an email" });
    }

    // Check if subbed already
    const existing = await Newsletter.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "You are already subscribed!" });
    }

    await Newsletter.create({ email });

    res.status(201).json({
      success: true,
      message: "Success! You've joined the Kambata Journal."
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

module.exports = router;
