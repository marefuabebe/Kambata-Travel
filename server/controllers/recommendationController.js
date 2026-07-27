const Tour = require("../models/Tour");
const Booking = require("../models/Booking");
const Wishlist = require("../models/Wishlist");
const Review = require("../models/Review");
const logger = require("../utils/logger");

/**
 * Smart Recommendation Engine
 *
 * Signals used (in priority order):
 *   1. Categories of tours the user has booked (strong signal)
 *   2. Destinations the user has visited (strong signal)
 *   3. Categories of tours the user has wishlisted (medium signal)
 *   4. Categories the user has rated highly (4+ stars) (medium signal)
 *   5. Global popularity (bookingsCount + viewsCount) — fallback/tiebreaker
 *
 * Scoring: Each matching attribute adds weight to a tour's score.
 * Already-booked tours are excluded from "For You". All results are published tours only.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Extract unique string values from an array of objects */
const extractField = (arr, field) =>
  [...new Set(arr.map((item) => item?.[field]).filter(Boolean))];

/** Safe ObjectId string comparison */
const toStr = (id) => {
  if (!id) return null;
  return id.toString?.() || String(id);
};

// ── Controller Functions ──────────────────────────────────────────────────────

/**
 * @desc  Personalized tour recommendations for the logged-in user
 * @route GET /api/recommendations
 * @access Private (Explorer/Traveler)
 */
const getPersonalizedRecommendations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(parseInt(req.query.limit) || 6, 12);

    // ── 1. Gather User Signals ──
    const [bookings, wishlistItems, highRatedReviews] = await Promise.all([
      Booking.find({
        user: userId,
        status: { $in: ["confirmed", "completed"] },
      })
        .populate("tour", "category destination difficulty")
        .lean(),

      Wishlist.find({ user: userId, itemType: "tour" })
        .populate("tour", "category destination difficulty")
        .lean(),

      Review.find({
        user: userId,
        reviewType: "tour",
        rating: { $gte: 4 },
      })
        .populate("tour", "category destination")
        .lean(),
    ]);

    // Compute boosted preference sets
    const bookedTourIds = new Set(
      bookings.map((b) => toStr(b.tour?._id)).filter(Boolean)
    );

    // Category weights: booked (+3), wishlisted (+2), highly-rated (+2)
    const categoryWeights = {};
    const destinationWeights = {};
    const difficultySet = new Set();

    const addWeight = (map, key, weight) => {
      if (!key) return;
      map[key] = (map[key] || 0) + weight;
    };

    bookings.forEach((b) => {
      if (b.tour) {
        addWeight(categoryWeights, b.tour.category, 3);
        addWeight(destinationWeights, toStr(b.tour.destination), 3);
        if (b.tour.difficulty) difficultySet.add(b.tour.difficulty);
      }
    });

    wishlistItems.forEach((w) => {
      if (w.tour) {
        addWeight(categoryWeights, w.tour.category, 2);
        addWeight(destinationWeights, toStr(w.tour.destination), 2);
      }
    });

    highRatedReviews.forEach((r) => {
      if (r.tour) {
        addWeight(categoryWeights, r.tour.category, 2);
      }
    });

    const preferredCategories = Object.keys(categoryWeights);
    const preferredDestinations = Object.keys(destinationWeights);
    const isNewUser = preferredCategories.length === 0;

    // ── 2. Fetch candidate tours ──
    let query = {
      isPublished: true,
      _id: { $nin: [...bookedTourIds] },
    };

    // For users with preferences, filter to relevant categories/destinations first
    if (!isNewUser && preferredCategories.length > 0) {
      query.$or = [
        { category: { $in: preferredCategories } },
        { destination: { $in: preferredDestinations } },
      ];
    }

    const candidates = await Tour.find(query)
      .select("title category destination difficulty price images rating bookingsCount viewsCount createdAt")
      .populate("destination", "name location")
      .lean();

    // ── 3. Score candidates ──
    const scored = candidates.map((tour) => {
      let score = 0;

      // Category weight
      score += categoryWeights[tour.category] || 0;

      // Destination weight
      score += destinationWeights[toStr(tour.destination?._id || tour.destination)] || 0;

      // Difficulty bonus (slightly prefer user's known difficulties)
      if (difficultySet.has(tour.difficulty)) score += 1;

      // Quality bonus (popularity)
      score += Math.min((tour.bookingsCount || 0) / 10, 3);
      score += Math.min((tour.viewsCount || 0) / 50, 1);

      // Rating bonus
      score += (tour.rating?.average || 0) * 0.5;

      // Recency bonus (newer tours get a small bump)
      const ageInDays = (Date.now() - new Date(tour.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (ageInDays < 30) score += 2;
      else if (ageInDays < 90) score += 1;

      return { ...tour, _score: score };
    });

    // Sort by score descending
    scored.sort((a, b) => b._score - a._score);

    const recommended = scored.slice(0, limit).map(({ _score, ...tour }) => ({
      ...tour,
      recommendedBecause: _buildReason(tour, categoryWeights, destinationWeights, isNewUser),
    }));

    // ── 4. Return with metadata ──
    res.json({
      success: true,
      data: {
        isPersonalized: !isNewUser,
        preferredCategories: Object.entries(categoryWeights)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([cat]) => cat),
        recommendations: recommended,
      },
    });
  } catch (error) {
    logger.error(`Recommendation error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc  Trending tours — sorted by popularity (for public/unauthenticated use too)
 * @route GET /api/recommendations/trending
 * @access Public
 */
const getTrendingTours = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 8, 20);
    const category = req.query.category;

    const query = { isPublished: true };
    if (category && category !== "All") query.category = category;

    const trending = await Tour.find(query)
      .select("title category destination difficulty price images rating bookingsCount viewsCount createdAt")
      .populate("destination", "name location")
      .sort({ bookingsCount: -1, "rating.average": -1, viewsCount: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: trending,
    });
  } catch (error) {
    logger.error(`Trending tours error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc  New arrivals — recently published tours
 * @route GET /api/recommendations/new-arrivals
 * @access Public
 */
const getNewArrivals = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 6, 12);

    const newArrivals = await Tour.find({ isPublished: true })
      .select("title category destination difficulty price images rating bookingsCount viewsCount createdAt")
      .populate("destination", "name location")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: newArrivals,
    });
  } catch (error) {
    logger.error(`New arrivals error: ${error.message}`);
    next(error);
  }
};

/**
 * @desc  Similar tours to a given tour (content-based filtering)
 * @route GET /api/recommendations/similar/:tourId
 * @access Public
 */
const getSimilarTours = async (req, res, next) => {
  try {
    const { tourId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 4, 8);

    const baseTour = await Tour.findById(tourId).select("category destination difficulty price").lean();
    if (!baseTour) {
      res.status(404);
      throw new Error("Tour not found");
    }

    const similar = await Tour.find({
      isPublished: true,
      _id: { $ne: tourId },
      $or: [
        { category: baseTour.category },
        { destination: baseTour.destination },
        { difficulty: baseTour.difficulty },
      ],
    })
      .select("title category destination difficulty price images rating bookingsCount viewsCount")
      .populate("destination", "name location")
      .sort({ "rating.average": -1, bookingsCount: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: similar,
    });
  } catch (error) {
    logger.error(`Similar tours error: ${error.message}`);
    next(error);
  }
};

// ── Private Helpers ───────────────────────────────────────────────────────────

function _buildReason(tour, categoryWeights, destinationWeights, isNewUser) {
  if (isNewUser) {
    if ((tour.bookingsCount || 0) > 5) return "Popular with travelers";
    if ((tour.rating?.average || 0) >= 4.5) return "Highly rated";
    return "Trending in Kambata";
  }

  const catWeight = categoryWeights[tour.category] || 0;
  const destWeight = destinationWeights[String(tour.destination?._id || tour.destination)] || 0;

  if (catWeight >= 3 && destWeight >= 3) return "Matches your destinations & interests";
  if (catWeight >= 3) return `Based on your love for ${tour.category} tours`;
  if (destWeight >= 3) return "You've explored this destination before";
  if (catWeight >= 2) return `Similar to tours you've saved`;
  return "You might enjoy this";
}

module.exports = {
  getPersonalizedRecommendations,
  getTrendingTours,
  getNewArrivals,
  getSimilarTours,
};
