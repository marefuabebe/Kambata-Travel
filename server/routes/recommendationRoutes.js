const express = require("express");
const router = express.Router();
const {
  getPersonalizedRecommendations,
  getTrendingTours,
  getNewArrivals,
  getSimilarTours,
} = require("../controllers/recommendationController");
const { protect } = require("../middleware/authMiddleware");

// Public endpoints
router.get("/trending", getTrendingTours);
router.get("/new-arrivals", getNewArrivals);
router.get("/similar/:tourId", getSimilarTours);

// Personalized recommendations (requires auth)
router.get("/", protect, getPersonalizedRecommendations);

module.exports = router;
