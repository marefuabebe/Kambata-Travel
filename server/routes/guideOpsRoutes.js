const express = require("express");
const router = express.Router();
const {
  getDashboard,
  getAssignments,
  getAssignmentDetail,
  updateAssignmentStatus,
  getTravelers,
  bulkAttendance,
  createIncident,
  listIncidents,
  getTourHistory,
  sendScheduleAnnouncement,
  respondToAssignment,
  scanDigitalPass,
  getCalendar,
  blockTimeOff,
  getRequests,
} = require("../controllers/guideOpsController");
const { protect, authorize, requireVerifiedGuide } = require("../middleware/authMiddleware");

router.use(protect, authorize("guide"));

// Unverified (Pending) guides can access these
router.get("/dashboard", getDashboard);
router.get("/calendar", getCalendar);
router.post("/calendar/block", blockTimeOff);

// Verified Guides ONLY for commercial operations
router.use(requireVerifiedGuide);

router.get("/requests", getRequests);
router.get("/assignments", getAssignments);
router.post("/assignments/respond", respondToAssignment);
router.get("/assignments/:tourId/:scheduleId", getAssignmentDetail);
router.patch("/assignments/:tourId/:scheduleId/status", updateAssignmentStatus);
router.get("/travelers", getTravelers);
router.post("/attendance/scan", scanDigitalPass);
router.patch("/attendance/bulk", bulkAttendance);
router.post("/incidents", createIncident);
router.get("/incidents", listIncidents);
router.get("/history", getTourHistory);
router.post("/announcements", sendScheduleAnnouncement);

module.exports = router;
