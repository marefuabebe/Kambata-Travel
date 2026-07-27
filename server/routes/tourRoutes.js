const express = require("express");
const router = express.Router();
const {
  getTours,
  getTrendingTours,
  getTourById,
  updateTourStatusGuide,
  submitIncidentReport,
  getAllGuidesWithConflictStatus,
  createSchedule,
  getGuideTours,
} = require("../controllers/tourController");
const { protect, authorize, requireVerifiedGuide } = require("../middleware/authMiddleware");

router.route("/").get(getTours);

// Trending tours (must be before /:id)
router.route("/trending").get(getTrendingTours);

// Guides fetching their own tours
router.get("/guide/my-tours", requireVerifiedGuide, getGuideTours);

// Admin fetches guides with conflict status
router.post("/guides/availability", protect, authorize("admin", "superadmin"), getAllGuidesWithConflictStatus);

// Admin creates schedule
router.post("/:id/schedules", protect, authorize("admin", "superadmin"), createSchedule);

// Guides update the status of their assigned schedule
router.patch("/:tourId/schedules/:scheduleId/status", requireVerifiedGuide, updateTourStatusGuide);

// Guides submit incident report
router.patch("/:tourId/schedules/:scheduleId/incident", requireVerifiedGuide, submitIncidentReport);

router.route("/:id").get(getTourById);

module.exports = router;
