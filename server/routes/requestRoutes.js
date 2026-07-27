const express = require("express");
const router = express.Router();
const {
  createRequest,
  getMyRequests,
  getAllRequests,
  getRankedGuidesForRequest,
  assignGuide,
  guideResponse,
  getRequestTimeline,
  initiatePayment,
  adjustRequestPrice,
  getSuggestedGuides,
  cancelRequest,
} = require("../controllers/requestController");
const { protect, requireAdmin, authorize } = require("../middleware/authMiddleware");

// Traveler routes
router.post("/", protect, createRequest);
router.get("/my-requests", protect, getMyRequests);
router.post("/:id/initiate-payment", protect, initiatePayment);
router.patch("/:id/cancel", protect, cancelRequest);
router.get("/:id/timeline", protect, getRequestTimeline);

// Guide routes
router.post("/:id/guide-response", protect, authorize("guide"), guideResponse);

// Admin routes
router.get("/", protect, requireAdmin, getAllRequests);
router.get("/:id/ranked-guides", protect, requireAdmin, getRankedGuidesForRequest);
router.get("/:id/suggested-guides", protect, requireAdmin, getSuggestedGuides);
router.post("/:id/assign-guide", protect, requireAdmin, assignGuide);
router.patch("/:id/price", protect, requireAdmin, adjustRequestPrice);

module.exports = router;
