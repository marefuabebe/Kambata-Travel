const express = require("express");
const router = express.Router();
const {
  createBooking,
  updateBookingStatus,
  claimWaitlistSpot,
  getBookingEstimate,
  getGuideBookings,
  getMyBookings,
  markAttendance,
  confirmCompletion,
  openDispute,
} = require("../controllers/bookingController");
const {
  createBookingRequest,
  getGuideRequests,
  getTravelerRequests,
  updateRequestStatus,
} = require("../controllers/bookingRequestController");

const {
  protect,
  authorize,
  requireVerifiedGuide,
  requireEmailVerified,
} = require("../middleware/authMiddleware");
const { bookingLimiter } = require("../middleware/securityMiddleware");

router.route("/")
  .post(protect, requireEmailVerified, bookingLimiter, createBooking);

router.route("/requests")
  .post(protect, requireEmailVerified, createBookingRequest);

router.get("/requests/my", protect, requireEmailVerified, getTravelerRequests);

router.route("/requests/guide")
  .get(protect, authorize("guide"), getGuideRequests);

router.route("/requests/:id")
  .patch(protect, updateRequestStatus);

router.route("/estimate")
  .get(protect, getBookingEstimate);

router.get("/guide/my-bookings", protect, authorize("guide"), getGuideBookings);
router.get("/my-bookings", protect, getMyBookings);

// Update Booking Status (Cancel, Confirm, Reject)
router.patch("/:id/status", protect, updateBookingStatus);

// Mark Attendance
router.patch("/:id/attendance", protect, authorize("admin", "guide"), markAttendance);

// Traveler Confirms Completion
router.post("/:id/confirm-completion", protect, requireEmailVerified, confirmCompletion);

// Traveler Opens Dispute
router.post("/:id/dispute", protect, requireEmailVerified, openDispute);

router.route("/:id/claim")
  .put(protect, claimWaitlistSpot);

module.exports = router;
