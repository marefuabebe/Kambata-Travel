const Inquiry = require("../models/Inquiry");
const logger = require("../utils/logger");

// @desc    Submit a new contact inquiry
// @route   POST /api/contact
// @access  Public
const submitInquiry = async (req, res, next) => {
  try {
    const { name, email, subject, message, interest } = req.body;

    const inquiry = await Inquiry.create({
      name,
      email,
      subject,
      message,
      interest
    });

    res.status(201).json({
      success: true,
      message: "Your inquiry has been received. Our curator will contact you soon."
    });
  } catch (error) {
    logger.error(`Inquiry submission error: ${error.message}`);
    next(error);
  }
};

module.exports = {
  submitInquiry
};
