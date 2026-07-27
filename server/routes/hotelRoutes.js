const express = require("express");
const router = express.Router();
const {
  createHotel,
  updateHotel,
  getHotels,
  getHotelById,
} = require("../controllers/hotelController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");

// Public routes (Admin can see hotels, travelers can't book them, but maybe frontend needs them for package details)
router.get("/", getHotels);
router.get("/:id", getHotelById);

// Admin routes
router.post("/", protect, requireAdmin, createHotel);
router.put("/:id", protect, requireAdmin, updateHotel);

module.exports = router;
