const express = require("express");
const router = express.Router();
const {
  getDashboard,
  getAllBookings,
  getBookingInvoice,
  getDigitalPass,
} = require("../controllers/travelerController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize("user"));

router.get("/dashboard", getDashboard);
router.get("/bookings", getAllBookings);
router.get("/bookings/:type/:id/invoice", getBookingInvoice);
router.get("/bookings/:type/:id/pass", getDigitalPass);

module.exports = router;
