const express = require("express");
const router = express.Router();
const {
  createAlert,
  getMyAlerts,
  getAllAlerts,
  updateAlertStatus,
  getAlertStats,
} = require("../controllers/sosController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All routes require authentication
router.use(protect);

// Traveler & Guide routes
router.post("/", authorize("user", "guide"), createAlert);
router.get("/mine", authorize("user", "guide"), getMyAlerts);

// Admin-only routes
router.get("/admin", authorize("admin"), getAllAlerts);
router.get("/admin/stats", authorize("admin"), getAlertStats);
router.patch("/admin/:id", authorize("admin"), updateAlertStatus);

module.exports = router;
