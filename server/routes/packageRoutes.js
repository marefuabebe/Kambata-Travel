const express = require("express");
const router = express.Router();
const {
  getPackageCatalog,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
  getPackageSchedules,
  createPackageSchedule,
  updatePackageSchedule,
  deletePackageSchedule,
  bookTravelPackage,
  getAllPackageSchedulesAdmin,
  cancelPackageScheduleAdmin,
  updatePackageScheduleStatusAdmin,
} = require("../controllers/packageController");
const { protect, requireAdmin, optionalAuth } = require("../middleware/authMiddleware");

// Public Package Catalog
router.get("/", getPackageCatalog);
router.get("/:id", getPackageById);
router.get("/:id/schedules", optionalAuth, getPackageSchedules);

// Traveler Booking
router.post("/:id/schedules/:scheduleId/book", protect, bookTravelPackage);

// Admin Package Management
router.post("/", protect, requireAdmin, createPackage);
router.put("/:id", protect, requireAdmin, updatePackage);
router.delete("/:id", protect, requireAdmin, deletePackage);

// Admin Schedule Management
router.get("/:id/schedules/all", protect, requireAdmin, getAllPackageSchedulesAdmin);
router.post("/:id/schedules", protect, requireAdmin, createPackageSchedule);
router.put("/:id/schedules/:scheduleId", protect, requireAdmin, updatePackageSchedule);
router.patch("/:id/schedules/:scheduleId/status", protect, requireAdmin, updatePackageScheduleStatusAdmin);
router.patch("/:packageId/schedules/:scheduleId/cancel-admin", protect, requireAdmin, cancelPackageScheduleAdmin);
router.delete("/:id/schedules/:scheduleId", protect, requireAdmin, deletePackageSchedule);

module.exports = router;
