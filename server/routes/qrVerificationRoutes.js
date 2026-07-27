const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const { getTravelPass, verifyQrBooking, manualVerifyQrBooking, getCheckInAuditLogs, syncOfflineScans } = require("../controllers/qrVerificationController");

// Retrieve pass (Traveler Dashboard)
router.get("/pass/:bookingId", protect, authorize("user", "admin"), getTravelPass);

// Verify pass (Guide Scanner)
router.post("/verify", protect, authorize("guide", "admin"), verifyQrBooking);

// Manually Verify pass (Guide Dashboard Backup)
router.post("/manual-verify", protect, authorize("guide", "admin"), manualVerifyQrBooking);

// Admin Audit Logs
router.get("/audit", protect, authorize("admin"), getCheckInAuditLogs);

// Sync Offline Scans (Guide Scanner)
router.post("/sync-offline", protect, authorize("guide", "admin"), syncOfflineScans);

module.exports = router;
