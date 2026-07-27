const Guide = require("../models/Guide");
const Tour = require("../models/Tour");
const PackageSchedule = require("../models/PackageSchedule");

/**
 * Calculates a dynamic score for guides to assist Admins in assignment.
 * Scoring Criteria:
 * - Availability (40%): 40 pts if fully free, 0 if conflicted
 * - Rating (30%): (Average Rating / 5) * 30
 * - Workload Balance (20%): Less active tours this month = higher score
 * - Completion Rate (10%): Base 100%, penalize for cancellations (simplified for now to 10 pts)
 */
const getRankedGuides = async (preferredDateStr, durationInHours = 8, excludeRequestId = null) => {
  const preferredDate = new Date(preferredDateStr);
  const preferredEnd = new Date(preferredDate.getTime() + durationInHours * 60 * 60 * 1000);

  const { getReservedGuideIds } = require("./guideReservationService");
  const reservedGuideIds = await getReservedGuideIds(excludeRequestId);

  const guides = await Guide.find({ status: "approved", isVerified: true })
    .populate("user", "name email phone profilePicture")
    .lean();

  const startOfMonth = new Date(preferredDate.getFullYear(), preferredDate.getMonth(), 1);
  const endOfMonth = new Date(preferredDate.getFullYear(), preferredDate.getMonth() + 1, 0);

  // Pre-fetch all schedules to calculate workload and availability
  const allTours = await Tour.find({
    "schedules.startDate": { $gte: startOfMonth, $lte: endOfMonth }
  }).lean();

  const allPackages = await PackageSchedule.find({
    startDate: { $gte: startOfMonth, $lte: endOfMonth }
  }).lean();

  const rankedGuides = guides
    .filter((guide) => {
      const guideId = guide.user._id.toString();
      if (reservedGuideIds.has(guideId)) return false;
      return true;
    })
    .map((guide) => {
    let score = 0;
    const guideId = guide.user._id.toString();

    // 1. Calculate Workload for the month
    let toursThisMonth = 0;
    let hasConflict = false;

    // Check Tours
    allTours.forEach(tour => {
      tour.schedules.forEach(sch => {
        if (sch.guide.toString() === guideId) {
          toursThisMonth++;
          // Basic Conflict Check
          const schStart = new Date(sch.startDate);
          const schEnd = new Date(sch.endDate);
          if (preferredDate <= schEnd && preferredEnd >= schStart) {
            hasConflict = true;
          }
        }
      });
    });

    // Check Packages
    allPackages.forEach(pkg => {
      if (pkg.assignedGuide && pkg.assignedGuide.toString() === guideId) {
        toursThisMonth++;
        const pkgStart = new Date(pkg.startDate);
        const pkgEnd = new Date(pkg.endDate);
        if (preferredDate <= pkgEnd && preferredEnd >= pkgStart) {
          hasConflict = true;
        }
      }
    });

    // Score: Availability (40%)
    let availabilityScore = hasConflict ? 0 : 40;
    score += availabilityScore;

    // Score: Rating (30%)
    const avgRating = guide.stats?.averageRating || 0;
    let ratingScore = (avgRating / 5) * 30;
    score += ratingScore;

    // Score: Workload Balance (20%)
    // Max expected tours per month ~20. The fewer tours, the higher the score (max 20).
    const maxTours = 20;
    let workloadScore = Math.max(0, ((maxTours - toursThisMonth) / maxTours) * 20);
    score += workloadScore;

    // Score: Completion Rate (10%)
    // Simplified to full 10 points unless we have strict cancellation logs
    let completionScore = 10;
    score += completionScore;

    return {
      guideId: guide.user._id,
      name: guide.user.name,
      email: guide.user.email,
      phone: guide.user.phone,
      profilePicture: guide.user.profilePicture,
      rating: avgRating,
      completedTours: guide.stats?.completedTours || toursThisMonth,
      toursThisMonth,
      languages: guide.languages || [],
      availabilityScore: Math.round(availabilityScore),
      workloadScore: Math.round(workloadScore),
      totalScore: Math.round(score),
      hasConflict,
    };
  });

  // Sort by highest score first, exclude conflicted guides
  rankedGuides.sort((a, b) => b.totalScore - a.totalScore);

  return rankedGuides.filter((g) => !g.hasConflict);
};

module.exports = {
  getRankedGuides,
};
