const express = require("express");
const router = express.Router();
const {
  getOverviewAnalytics,
  getRevenueAnalytics,
  getBookingAnalytics,
  getPerformanceAnalytics,
  getQRAnalytics,
  getRequestFunnelAnalytics,
} = require("../controllers/analyticsController");
const { protect, authorize } = require("../middleware/authMiddleware");

// All analytics routes are admin-only
router.use(protect, authorize("admin"));

router.get("/overview", getOverviewAnalytics);
router.get("/revenue", getRevenueAnalytics);
router.get("/bookings", getBookingAnalytics);
router.get("/performance", getPerformanceAnalytics);
router.get("/qr-attendance", getQRAnalytics);
router.get("/request-funnel", getRequestFunnelAnalytics);

module.exports = router;
