const Tour = require("../models/Tour");
const { notifyGuideOfAssignment } = require("../services/notificationService");
const logger = require("../utils/logger");

// @desc    Get all published tours
// @route   GET /api/tours
// @access  Public
const getTours = async (req, res, next) => {
  try {
    const { 
      difficulty, 
      destination, 
      category, 
      sort, 
      page = 1, 
      limit = 10,
      keyword,
      minPrice,
      maxPrice,
      minDuration,
      maxDuration
    } = req.query;
    
    // 1. Build Query
    let query = { isPublished: true };

    // Keyword Search
    if (keyword) {
      query.$text = { $search: keyword };
    }

    // Category & Difficulty
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    
    // Destination (Selected from predefined list)
    if (destination) query.destination = destination;

    // Price Range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Duration Range (Using normalized durationInHours)
    if (minDuration || maxDuration) {
      query.durationInHours = {};
      if (minDuration) query.durationInHours.$gte = Number(minDuration);
      if (maxDuration) query.durationInHours.$lte = Number(maxDuration);
    }

    // 2. Build Sort
    let sortQuery = { createdAt: -1 }; // Default: Newest
    if (keyword) {
      sortQuery = { score: { $meta: "textScore" } };
    } else if (sort === "popularity") {
      sortQuery = { "rating.average": -1, "rating.numReviews": -1 };
    } else if (sort === "trust") {
      // In a high-scale system, we should use aggregation or de-normalize trustScore.
      // For now, we will sort natively by popularity and then refine.
      sortQuery = { "rating.average": -1 }; 
    }

    // 3. Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 4. Execute Query with Selection and Lean
    let selectFields = "title price duration durationInHours images rating category destination createdBy createdAt bookingType";
    if (req.user && req.user.role === "admin") {
      selectFields += " schedules";
      query = {}; // Admins can see unpublished tours too
    }

    const tours = await Tour.find(query, keyword ? { score: { $meta: "textScore" } } : {})
      .select(selectFields)
      .populate("destination", "name woreda")
      .sort(sortQuery)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const { lang } = req.query;
    const localizedTours = require("../utils/localization").localize(tours, lang);

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const scheduleMeta = await Tour.find({ _id: { $in: tours.map((t) => t._id) } })
      .select("schedules")
      .lean();
    const metaMap = {};
    scheduleMeta.forEach((td) => {
      const live = (td.schedules || []).filter(
        (s) => new Date(s.startDate) >= now && s.remainingSlots > 0 && s.scheduleType !== "private" && s.status === "published" && s.guide
      );
      metaMap[td._id.toString()] = {
        hasLiveSchedule: live.length > 0,
        liveScheduleCount: live.length,
      };
    });

    const enrichedTours = localizedTours.map((t) => {
      const meta = metaMap[t._id?.toString()] || { hasLiveSchedule: false, liveScheduleCount: 0 };
      const { canInstantBookTour, canRequestDateTour } = require("../services/tourBookingRules");
      return {
        ...t,
        ...meta,
        canInstantBook: canInstantBookTour(t, meta.hasLiveSchedule),
        canRequestDate: canRequestDateTour(t, meta.hasLiveSchedule),
      };
    });

    const total = await Tour.countDocuments(query);

    res.json({
      success: true,
      count: enrichedTours.length,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
      data: enrichedTours,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single tour
// @route   GET /api/tours/:id
// @access  Public
const getTourById = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.id)
      .populate("destination", "name woreda coordinates")
      .populate("createdBy", "name email rating guideProfile")
      .populate("schedules.guide", "name profilePicture rating guideStatus schedulingDisabled")
      .lean();

    if (!tour || (!tour.isPublished && (!req.user || req.user.role === "user"))) {
      res.status(404);
      throw new Error("Tour not found");
    }

    const { filterBookableSchedules } = require("../services/tourBookingRules");
    tour.schedules = await filterBookableSchedules(tour.schedules || [], req.user);

    // MODERN MATCH: Find up to 3 related tours (same category or same destination)
    const relatedTours = await Tour.find({
      _id: { $ne: tour._id },
      isPublished: true,
      $or: [
        { category: { $in: tour.category } },
        { destination: tour.destination._id }
      ]
    })
    .select("title price duration images rating category")
    .limit(3)
    .lean();

    // TRACK VIEW (Async interest signal + popularity increment)
    if (req.user) {
      const { updateFromView } = require("../services/recommendationService");
      updateFromView(req.user._id, tour._id);
    }
    
    // Increment global viewsCount atomically
    await Tour.findByIdAndUpdate(req.params.id, { $inc: { viewsCount: 1 } });

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const liveSchedules = (tour.schedules || []).filter(
      (s) => new Date(s.startDate) >= now && (s.remainingSlots ?? 0) > 0 && s.guide && s.status === "published"
    );
    const { canInstantBookTour, canRequestDateTour } = require("../services/tourBookingRules");
    const hasLiveSchedule = liveSchedules.length > 0;

    res.json({
      success: true,
      data: {
        ...tour,
        hasLiveSchedule,
        liveScheduleCount: liveSchedules.length,
        canInstantBook: canInstantBookTour(tour, hasLiveSchedule),
        canRequestDate: canRequestDateTour(tour, hasLiveSchedule),
      },
      relatedTours
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      res.status(400);
      return next(new Error("Invalid tour ID format"));
    }
    next(error);
  }
};

// @desc    Get tour availability (lightweight)
// @route   GET /api/tours/:id/availability
// @access  Public
const getTourAvailability = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.id).select("schedules maxCapacity").lean();

    if (!tour) {
      res.status(404);
      throw new Error("Tour not found");
    }

    res.json({
      success: true,
      maxCapacity: tour.maxCapacity,
      schedules: tour.schedules.map(s => ({
        id: s._id,
        startDate: s.startDate,
        endDate: s.endDate,
        startTime: s.startTime,
        remainingSlots: s.remainingSlots
      }))
    });
  } catch (error) {
    next(error);
  }
};

const { getRecommendations } = require("../services/recommendationService");

// @desc    Get personalized tour recommendations
// @route   GET /api/tours/recommended
// @access  Private (User)
const getRecommendedTours = async (req, res, next) => {
  try {
    const { recommended, nearlyRecommended } = await getRecommendations(req.user._id);

    res.json({
      success: true,
      count: recommended.length,
      data: {
        recommended,
        nearlyRecommended
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top 5 trending tours by bookingsCount
// @route   GET /api/tours/trending
// @access  Public
const getTrendingTours = async (req, res, next) => {
  try {
    const trending = await Tour.find({ isPublished: true })
      .select("title price duration images rating bookingsCount category schedules createdBy")
      .sort({ bookingsCount: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      count: trending.length,
      data: trending,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get location-based recommendations
// @route   GET /api/tours/near-me
// @access  Private (User)
const getNearbyTours = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("preferences.preferredLocation");
    const query = { isPublished: true };

    if (user && user.preferences.preferredLocation) {
      // Broader woreda-based matching
      query["destination"] = { $ne: null }; // Ensure we can lookup
      
      const tours = await Tour.find(query)
        .populate("destination")
        .limit(20) // Fetch first to filter in JS for woreda match
        .lean();

      const woredaMatch = tours.filter(t => 
        t.destination && 
        t.destination.location && 
        t.destination.location.woreda === user.preferences.preferredLocation.location.woreda
      ).slice(0, 10);

      return res.json({
        success: true,
        count: woredaMatch.length,
        data: woredaMatch
      });
    }

    // Default: return top rated in region
    const topRated = await Tour.find(query)
      .sort({ "rating.average": -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      count: topRated.length,
      data: topRated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tours where the guide has added a schedule
// @route   GET /api/tours/guide/my-tours
// @access  Private (Guide)
const getGuideTours = async (req, res, next) => {
  try {
    const tours = await Tour.find({ "schedules.guide": req.user._id })
      .populate("destination", "name")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: tours.length,
      data: tours,
    });
  } catch (error) {
    next(error);
  }
};

// Removed getBlueprintTours as guides no longer assign themselves

// @desc    Guide submits an incident report for an assigned schedule
// @route   PATCH /api/tours/:tourId/schedules/:scheduleId/incident
// @access  Private (Guide)
const submitIncidentReport = async (req, res, next) => {
  try {
    const { report } = req.body;
    
    if (!report || report.trim().length === 0) {
      res.status(400);
      throw new Error("Incident report cannot be empty");
    }

    const tour = await Tour.findById(req.params.tourId);
    if (!tour) {
      res.status(404);
      throw new Error("Tour not found");
    }

    const schedule = tour.schedules.id(req.params.scheduleId);
    if (!schedule) {
      res.status(404);
      throw new Error("Schedule not found");
    }

    // Security Check: Only the ASSIGNED guide can submit an incident report
    if (schedule.guide.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You are not authorized to report incidents for a schedule you are not assigned to");
    }

    schedule.incidentReport = report;
    await tour.save();

    res.json({
      success: true,
      message: "Incident report submitted successfully",
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Guide updates the status of their assigned schedule
// @route   PATCH /api/tours/:tourId/schedules/:scheduleId/status
// @access  Private (Guide)
const updateTourStatusGuide = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!["in_progress", "completed"].includes(status)) {
      res.status(400);
      throw new Error("Invalid status. Guides can only update to 'in_progress' or 'completed'");
    }

    const tour = await Tour.findById(req.params.tourId);
    if (!tour) {
      res.status(404);
      throw new Error("Tour not found");
    }

    const schedule = tour.schedules.id(req.params.scheduleId);
    if (!schedule) {
      res.status(404);
      throw new Error("Schedule not found");
    }

    // Security Check: Only the ASSIGNED guide can update the status
    if (schedule.guide.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You are not authorized to update a schedule you are not assigned to");
    }

    schedule.status = status;
    await tour.save();

    // Optionally: If completed, auto-complete bookings
    if (status === "completed") {
      const Booking = require("../models/Booking");
      await Booking.updateMany(
        { scheduleId: schedule._id, status: { $in: ["confirmed", "pending"] } },
        { $set: { status: "completed" } }
      );
    }

    res.json({
      success: true,
      message: `Schedule status updated to ${status}`,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};



// @desc    Get all guides with their conflict status for a specific time slot
// @route   POST /api/tours/guides/availability
// @access  Private (Admin)
const getAllGuidesWithConflictStatus = async (req, res, next) => {
  try {
    const { startDate, endDate, startTime, endTime } = req.body;
    
    if (!startDate || !endDate) {
      res.status(400);
      throw new Error("startDate and endDate are required");
    }

    const startD = new Date(startDate);
    const endD = new Date(endDate);
    
    const parseTime = (timeStr) => {
      if (!timeStr) return 0;
      const [time, modifier] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (hours === 12) { hours = modifier === 'PM' ? 12 : 0; }
      else if (modifier === 'PM') { hours += 12; }
      return hours * 60 + minutes;
    };

    const requestedStartMins = parseTime(startTime);
    const requestedEndMins = parseTime(endTime);

    const Guide = require("../models/Guide");
    const PackageSchedule = require("../models/PackageSchedule");
    const GuideTimeOff = require("../models/GuideTimeOff");

    // Fetch all approved and verified guides
    const guides = await Guide.find({ status: "approved", isVerified: true })
      .populate("user", "name email profilePicture")
      .lean();

    // Fetch Tour schedules that overlap the requested window
    const toursWithSchedules = await Tour.find({
      "schedules": {
        $elemMatch: {
          status: { $in: ["published", "upcoming", "in_progress", "full"] },
          startDate: { $lte: endD },
          endDate: { $gte: startD }
        }
      }
    }).select("schedules title").lean();

    // Fetch Package schedules that overlap
    const packageSchedules = await PackageSchedule.find({
      status: { $in: ["published", "upcoming", "in_progress", "full"] },
      startDate: { $lte: endD },
      endDate: { $gte: startD }
    }).populate("packageId", "name title").lean();

    // Fetch approved Time Offs that overlap
    const timeOffs = await GuideTimeOff.find({
      status: "approved",
      startDate: { $lte: endD },
      endDate: { $gte: startD }
    }).lean();

    // Build a map: guideUserId → [conflict descriptions]
    const guideConflictMap = {};

    toursWithSchedules.forEach(tour => {
      tour.schedules.forEach(sch => {
        if (!["published", "upcoming", "in_progress", "full"].includes(sch.status)) return;
        const gId = sch.guide.toString();
        if (!guideConflictMap[gId]) guideConflictMap[gId] = [];

        const schStart = new Date(sch.startDate);
        const schEnd = new Date(sch.endDate);

        // Date overlap check
        if (startD <= schEnd && endD >= schStart) {
          // Time overlap check (if both have times)
          let timeConflict = true;
          if (startTime && endTime && sch.startTime && sch.endTime) {
            const schStartMins = parseTime(sch.startTime);
            const schEndMins = parseTime(sch.endTime);
            timeConflict = requestedStartMins < schEndMins && requestedEndMins > schStartMins;
          }
          if (timeConflict) {
            const from = schStart.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
            const to = schEnd.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
            guideConflictMap[gId].push(`Assigned to "${tour.title?.en || "Tour"}" (${from} – ${to})`);
          }
        }
      });
    });

    packageSchedules.forEach(sch => {
      if (!sch.assignedGuide) return;
      const gId = sch.assignedGuide.toString();
      if (!guideConflictMap[gId]) guideConflictMap[gId] = [];

      const schStart = new Date(sch.startDate);
      const schEnd = new Date(sch.endDate);

      if (startD <= schEnd && endD >= schStart) {
        let timeConflict = true;
        if (startTime && endTime && sch.startTime && sch.endTime) {
          const schStartMins = parseTime(sch.startTime);
          const schEndMins = parseTime(sch.endTime);
          timeConflict = requestedStartMins < schEndMins && requestedEndMins > schStartMins;
        }
        if (timeConflict) {
          const pkgName = sch.packageId?.name?.en || sch.packageId?.title?.en || "Package";
          const from = schStart.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
          const to = schEnd.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
          guideConflictMap[gId].push(`Assigned to Package "${pkgName}" (${from} – ${to})`);
        }
      }
    });

    timeOffs.forEach(t => {
      const gId = t.guide.toString();
      if (!guideConflictMap[gId]) guideConflictMap[gId] = [];
      const from = new Date(t.startDate).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
      const to = new Date(t.endDate).toLocaleDateString("en-US", { month: "short", day: "2-digit" });
      guideConflictMap[gId].push(`Approved Time Off (${from} – ${to}): ${t.reason || ""}`);
    });

    const result = guides.map(guide => {
      const gId = guide.user._id.toString();
      const conflicts = guideConflictMap[gId] || [];
      return {
        _id: guide.user._id,
        name: guide.user.name,
        profilePicture: guide.user.profilePicture,
        languages: guide.languages,
        hasConflict: conflicts.length > 0,
        conflictReason: conflicts.length > 0 ? conflicts[0] : null,
        allConflicts: conflicts,
      };
    });

    const hasAvailableGuides = result.some(g => !g.hasConflict);

    // If NO guides are available, generate smart alternatives
    let alternatives = [];
    if (!hasAvailableGuides && result.length > 0) {
      const { findAlternativeGuideSlots } = require("../services/scheduleService");
      alternatives = await findAlternativeGuideSlots(startDate, endDate, startTime, endTime);
    }

    res.json({
      success: true,
      count: result.length,
      hasAvailableGuides,
      alternatives,
      data: result
    });

  } catch (error) {
    next(error);
  }
};


// @desc    Admin creates a schedule and assigns a guide (with secondary conflict check)
// @route   POST /api/tours/:id/schedules
// @access  Private (Admin)
const createSchedule = async (req, res, next) => {
  try {
    const { guideId, startDate, endDate, startTime, endTime, capacity, meetingPoint, priceOverride, specialNotes } = req.body;
    
    if (!guideId || !startDate || !endDate || !startTime || !endTime || !meetingPoint) {
      res.status(400);
      throw new Error("Guide, startDate, endDate, startTime, endTime, and meetingPoint are required");
    }

    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      res.status(404);
      throw new Error("Tour not found");
    }

    const { checkGuideAvailability } = require("../services/scheduleService");
    await checkGuideAvailability(guideId, startDate, endDate, startTime, endTime);

    const startD = new Date(startDate);
    const endD = new Date(endDate);
    // If no conflict, create schedule
    const newSchedule = {
      guide: guideId,
      startDate: startD,
      endDate: endD,
      startTime,
      endTime,
      meetingPoint,
      priceOverride,
      specialNotes,
      remainingSlots: capacity || tour.maxCapacity,
      status: "upcoming",
      assignmentStatus: "pending"
    };

    tour.schedules.push(newSchedule);
    await tour.save();

    // Notify the assigned guide
    const title = tour.title?.en || tour.title;
    await notifyGuideOfAssignment(guideId, title || "New Tour", startD, startTime);

    res.status(201).json({
      success: true,
      message: "Schedule created and guide assigned successfully",
      data: tour.schedules[tour.schedules.length - 1]
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Admin cancels a schedule assignment
// @route   DELETE /api/admin/tours/:tourId/schedules/:scheduleId
// @access  Private (Admin)
const deleteScheduleAdmin = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.tourId);
    if (!tour) {
      res.status(404);
      throw new Error("Tour not found");
    }

    const schedule = tour.schedules.id(req.params.scheduleId);
    if (!schedule) {
      res.status(404);
      throw new Error("Schedule not found");
    }

    if (schedule.status === "cancelled") {
      res.status(400);
      throw new Error("Schedule is already cancelled");
    }

    // Mark schedule as cancelled instead of splicing it
    schedule.status = "cancelled";
    await tour.save();

    // Handle Bookings
    const Booking = require("../models/Booking");
    const { createNotification } = require("../services/notificationService");
    const { sendEmail } = require("../utils/mailService");
    const { buildPremiumEmail } = require("../utils/emailTemplateBuilder");
    
    const bookings = await Booking.find({ scheduleId: schedule._id }).populate("user");

    for (const booking of bookings) {
      booking.status = "cancelled";
      
      // If payment was made, mark as refund pending for finance review
      if (booking.paymentStatus === "paid") {
        booking.paymentStatus = "refund_pending";
      }
      
      await booking.save();

      // Notify User
      if (booking.user) {
        const title = tour.title?.en || tour.title;
        const msg = `We're sorry to inform you that your upcoming schedule for "${title}" has been cancelled. Your booking has been marked for review, and any eligible refunds will be processed by our admin team shortly.`;
        
        await createNotification({
          userId: booking.user._id,
          title: "Schedule Cancelled",
          message: msg,
          type: "booking",
          link: `/my-bookings`
        });

        if (booking.user.email) {
          try {
            const frontendUrl = process.env.FRONTEND_URL || "https://kambata.travel";
            const emailHtml = buildPremiumEmail({
              type: "default",
              title: "Schedule Cancelled",
              icon: "⚠️",
              accentColor: "#EF4444",
              greeting: `Hello ${booking.user.name},`,
              bodyLines: [
                `We're sorry to inform you that your upcoming schedule for "${title}" has been cancelled.`,
                "Your booking has been marked for review, and any eligible refunds will be processed by our admin team shortly."
              ],
              infoCards: [
                { title: "Tour", value: title, iconEmoji: "📍" },
                { title: "Status", value: "Cancelled", iconEmoji: "❌" }
              ],
              statusBadge: { text: "CANCELLED", color: "#EF4444" },
              cta: {
                text: "View My Bookings",
                link: `${frontendUrl}/my-bookings`,
                color: "#EF4444"
              }
            });

            await sendEmail({
              to: booking.user.email,
              subject: `Update on your booking for ${title} - Kambata Travel`,
              html: emailHtml
            });
          } catch (err) {
            logger.error(`Failed to send cancellation email to ${booking.user.email}:`, err);
          }
        }
      }
    }

    // Optionally notify guide if assigned
    if (schedule.guide) {
      try {
        const title = tour.title?.en || tour.title;
        await createNotification({
          userId: schedule.guide,
          title: "Schedule Cancelled",
          message: `Your assigned schedule for "${title}" on ${new Date(schedule.startDate).toLocaleDateString()} has been cancelled by the admin.`,
          type: "system",
          link: `/guide-dashboard`
        });
      } catch (err) {
        logger.error("Failed to notify guide about schedule cancellation:", err);
      }
    }

    res.json({ success: true, message: "Schedule cancelled successfully. Affected bookings have been marked as refund pending." });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin reassigns a guide for a schedule
// @route   PATCH /api/admin/tours/:tourId/schedules/:scheduleId
// @access  Private (Admin)
const reassignGuideAdmin = async (req, res, next) => {
  try {
    const { guideId } = req.body;
    if (!guideId) {
      res.status(400);
      throw new Error("Guide ID is required for reassignment");
    }

    const tour = await Tour.findById(req.params.tourId);
    if (!tour) {
      res.status(404);
      throw new Error("Tour not found");
    }

    const schedule = tour.schedules.id(req.params.scheduleId);
    if (!schedule) {
      res.status(404);
      throw new Error("Schedule not found");
    }

    schedule.guide = guideId;
    schedule.assignmentStatus = "pending";
    await tour.save();

    const title = tour.title?.en || tour.title;
    await notifyGuideOfAssignment(guideId, title || "New Tour", schedule.startDate, schedule.startTime);

    res.json({ success: true, message: "Guide reassigned successfully", data: schedule });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTours,
  getTrendingTours,
  getTourById,
  getGuideTours,
  submitIncidentReport,
  updateTourStatusGuide,
  getAllGuidesWithConflictStatus,
  createSchedule,
  deleteScheduleAdmin,
  reassignGuideAdmin,
};
