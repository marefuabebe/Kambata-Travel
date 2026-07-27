const User = require("../models/User");
const Tour = require("../models/Tour");
const logger = require("../utils/logger");

/**
 * Smart Recommendation Service
 */

// Update preferences from a simple view (lower weight signal)
const updateFromView = async (userId, tourId) => {
  try {
    const tour = await Tour.findById(tourId);
    if (!tour) return;

    await User.findByIdAndUpdate(userId, {
      $addToSet: { "preferences.interests": tour.category },
    });
  } catch (error) {
    logger.error("Error updating preferences from view:", error);
  }
};

// Update preferences from a booking (highest weight signal)
const updateFromBooking = async (userId, tourId) => {
  try {
    const tour = await Tour.findById(tourId);
    if (!tour) return;

    const user = await User.findById(userId);
    if (!user) return;

    // 1. Update Interests
    if (!user.preferences.interests.includes(tour.category)) {
      user.preferences.interests.push(tour.category);
    }

    // 2. Update Preferred Location
    user.preferences.preferredLocation = tour.destination;

    // 3. Update Budget Range (+/- 25% of current booking)
    const price = tour.price;
    user.preferences.budget.min = Math.floor(price * 0.75);
    user.preferences.budget.max = Math.ceil(price * 1.25);

    // 4. Update Duration preference
    user.preferences.maxDuration = Math.max(user.preferences.maxDuration || 0, tour.durationInHours || 0);

    await user.save();
    logger.info(`Preferences updated for user ${userId} based on booking ${tourId}`);
  } catch (error) {
    logger.error("Error updating preferences from booking:", error);
  }
};

const { getTemplate } = require("../utils/recommendationTemplates");

// Get personalized recommendations with advanced scoring
const getRecommendations = async (userId) => {
  try {
    const user = await User.findById(userId).populate("preferences.preferredLocation");
    
    // 1. PRE-FILTERING (Reduce dataset for performance)
    // Only published tours with good ratings
    const query = { 
      isPublished: true,
      "rating.average": { $gte: 3.5 }
    };

    // If traveler has no preferences yet, return top-rated & popular
    if (!user || (!user.preferences.interests.length && !user.preferences.preferredLocation)) {
      return await Tour.find(query)
        .sort({ bookingsCount: -1, "rating.average": -1 })
        .limit(10);
    }

    const { interests, budget, maxDuration, preferredLocation } = user.preferences;

    // Fetch candidate tours
    const tours = await Tour.find(query).populate("destination");

    // 2. SCORING LOGIC
    const scoredTours = tours.map((tour) => {
      let score = 0;
      const reasons = [];

      // 1. Category Match (Interest - Highest Priority)
      if (interests.includes(tour.category)) {
        score += 50;
        reasons.push(getTemplate("INTEREST", { category: tour.category }));
      }

      // 2. Rating Intensity (High Priority)
      if (tour.rating.average >= 4.5) {
        reasons.push(getTemplate("RATING"));
      }
      score += (tour.rating.average * 10);

      // 3. Popularity Density (High Priority)
      if (tour.bookingsCount > 10) {
        reasons.push(getTemplate("POPULARITY"));
      }
      score += (tour.bookingsCount * 2);
      score += (tour.viewsCount * 0.1);

      // 4. Geographic Match (Medium Priority)
      if (preferredLocation && tour.destination) {
        if (preferredLocation.location.woreda === tour.destination.location.woreda) {
          score += 30; // Direct regional match
          reasons.push(getTemplate("LOCATION", { woreda: tour.destination.location.woreda }));
        }
      }

      // 5. Budget Alignment (Medium Priority)
      if (budget.max > 0 && tour.price <= budget.max && tour.price >= budget.min) {
        reasons.push(getTemplate("BUDGET"));
      }

      // 6. Freshness Boost (Low Priority)
      const isNew = (Date.now() - new Date(tour.createdAt).getTime()) < (7 * 24 * 60 * 60 * 1000); // 7 days
      if (isNew) {
        score += 10;
        reasons.push(getTemplate("FRESHNESS"));
      }

      // Preference Penalties
      if (budget.max > 0 && tour.price > budget.max * 1.2) {
        score -= 20;
      }
      if (maxDuration > 0 && tour.durationInHours > maxDuration * 1.5) {
        score -= 10;
      }

      // Limit to Top 3 strongest factors
      const topReasons = reasons.slice(0, 3);

      return { tour, score, reasons: topReasons };
    });

    // 3. SEPARATE RECOMMENDED AND NEARLY RECOMMENDED
    const sorted = scoredTours.sort((a, b) => b.score - a.score);
    
    const recommended = sorted.slice(0, 10).map((item) => {
      let composedReason = getTemplate("DEFAULT");
      const topReasons = item.reasons;

      if (topReasons.length === 1) {
        composedReason = `This tour is recommended because it ${topReasons[0].toLowerCase()}`;
      } else if (topReasons.length === 2) {
        composedReason = `This tour is recommended because it ${topReasons[0].toLowerCase()} and ${topReasons[1].toLowerCase()}`;
      } else if (topReasons.length >= 3) {
        composedReason = `This tour is recommended because it ${topReasons[0].toLowerCase()}, ${topReasons[1].toLowerCase()}, and ${topReasons[2].toLowerCase()}`;
      }

      return {
        ...item.tour.toObject ? item.tour.toObject() : item.tour,
        recommendationReason: composedReason,
        reasons: topReasons
      };
    });

    const nearlyRecommended = sorted.slice(10, 15).map((item) => {
      const tour = item.tour;
      const negativeFactors = [];

      // 1. Identify Failed Factors (Priority Order)
      if (!interests.includes(tour.category)) {
        negativeFactors.push(getTemplate("INTEREST_MISMATCH", { category: tour.category }));
      }
      if (preferredLocation && tour.destination && preferredLocation.location.woreda !== tour.destination.location.woreda) {
        negativeFactors.push(getTemplate("LOCATION_MISMATCH", { woreda: tour.destination.location.woreda }));
      }
      if (budget.max > 0 && tour.price > budget.max) {
        negativeFactors.push(getTemplate("PRICE_HIGH"));
      }
      if (maxDuration > 0 && tour.durationInHours > maxDuration) {
        negativeFactors.push(getTemplate("DURATION_LONG"));
      }
      if (tour.rating.average < 4.0) {
        negativeFactors.push(getTemplate("LOW_RATING"));
      }
      if (tour.bookingsCount < 5) {
        negativeFactors.push(getTemplate("LOW_POPULARITY"));
      }

      // 2. Synthesize Top 1-2 Reasons
      const topNegatives = negativeFactors.slice(0, 2);
      let rejectionReason = "This tour is a strong match, but we prioritized others that better align with your current preferences.";

      if (topNegatives.length === 1) {
        rejectionReason = `This tour was nearly recommended, but ${topNegatives[0].toLowerCase()}`;
      } else if (topNegatives.length >= 2) {
        rejectionReason = `This tour was nearly recommended, but ${topNegatives[0].toLowerCase()} and ${topNegatives[1].toLowerCase()}`;
      }

      return {
        ...tour.toObject ? tour.toObject() : tour,
        rejectionReason,
        negativeFactors: topNegatives
      };
    });

    return { recommended, nearlyRecommended };

  } catch (error) {
    logger.error("Error fetching recommendations:", error.message);
    return { recommended: [], nearlyRecommended: [] };
  }
};

module.exports = {
  updateFromView,
  updateFromBooking,
  getRecommendations,
};
