const express = require("express");
const router = express.Router();
const { getTourAvailability, getGuideWorkload } = require("../controllers/calendarController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Public route for travelers to see availability
router.get("/tour/:id", getTourAvailability);

// Protected route for guides to manage workload
router.get("/guide/workload", protect, authorize("guide"), getGuideWorkload);

module.exports = router;
