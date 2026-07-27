const express = require("express");
const router = express.Router();
const {
  createTicket,
  getMyTickets,
  getAllTickets,
  respondToTicket,
} = require("../controllers/supportController");
const { protect, requireAdmin, authorize } = require("../middleware/authMiddleware");

// Traveler routes
router.post("/", protect, createTicket);
router.get("/my-tickets", protect, getMyTickets);

module.exports = router;
