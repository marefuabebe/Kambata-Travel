const Booking = require("../models/Booking");
const PackageBooking = require("../models/PackageBooking");
const User = require("../models/User");
const Tour = require("../models/Tour");
const Package = require("../models/Package");
const Request = require("../models/TourRequest");
const Review = require("../models/Review");
const Incident = require("../models/IncidentReport");

// Helper to get date ranges based on timeframe
const getDateRange = (timeframe) => {
  const now = new Date();
  let startDate = new Date();
  let previousStartDate = new Date();
  let previousEndDate = new Date();

  switch (timeframe) {
    case "7D":
      startDate.setDate(now.getDate() - 7);
      previousStartDate.setDate(now.getDate() - 14);
      previousEndDate.setDate(now.getDate() - 7);
      break;
    case "30D":
      startDate.setDate(now.getDate() - 30);
      previousStartDate.setDate(now.getDate() - 60);
      previousEndDate.setDate(now.getDate() - 30);
      break;
    case "90D":
      startDate.setDate(now.getDate() - 90);
      previousStartDate.setDate(now.getDate() - 180);
      previousEndDate.setDate(now.getDate() - 90);
      break;
    case "YTD":
      startDate = new Date(now.getFullYear(), 0, 1);
      previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
      previousEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
      break;
    case "ALL":
    default:
      startDate = new Date(2000, 0, 1);
      previousStartDate = new Date(1900, 0, 1);
      previousEndDate = new Date(1999, 11, 31);
      break;
  }
  return { startDate, endDate: now, previousStartDate, previousEndDate };
};

// @desc    Get comprehensive overview metrics
// @route   GET /api/analytics/overview
// @access  Private/Admin
const getOverviewAnalytics = async (req, res, next) => {
  try {
    const { timeframe = "30D" } = req.query;
    const { startDate, endDate, previousStartDate, previousEndDate } = getDateRange(timeframe);

    const getMetricsForPeriod = async (start, end) => {
      // 1. Revenue (Paid only)
      const tourRevenue = await Booking.aggregate([
        { $match: { paymentStatus: "paid", createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
      ]);
      const pkgRevenue = await PackageBooking.aggregate([
        { $match: { paymentStatus: "paid", createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } }
      ]);
      const revenue = (tourRevenue[0]?.total || 0) + (pkgRevenue[0]?.total || 0);

      // 2. Bookings & Travelers (Confirmed/Completed)
      const validStatuses = ["confirmed", "completed"];
      const tourBookings = await Booking.aggregate([
        { $match: { status: { $in: validStatuses }, createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, count: { $sum: 1 }, travelers: { $sum: "$numPeople" } } }
      ]);
      const pkgBookings = await PackageBooking.aggregate([
        { $match: { bookingStatus: { $in: validStatuses }, createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, count: { $sum: 1 }, travelers: { $sum: "$travelersCount" } } }
      ]);
      const bookingsCount = (tourBookings[0]?.count || 0) + (pkgBookings[0]?.count || 0);
      const travelersCount = (tourBookings[0]?.travelers || 0) + (pkgBookings[0]?.travelers || 0);

      // 3. Average Rating
      const reviews = await Review.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end }, isHidden: { $ne: true } } },
        { $group: { _id: null, avg: { $avg: "$rating" } } }
      ]);
      const avgRating = reviews[0]?.avg || 0;

      // 4. Request Conversion
      const totalRequests = await Request.countDocuments({ createdAt: { $gte: start, $lte: end } });
      const convertedRequests = await Request.countDocuments({ status: "completed", createdAt: { $gte: start, $lte: end } }); // "completed" means booked/paid in this context (assuming mapped correctly)
      const conversionRate = totalRequests ? (convertedRequests / totalRequests) * 100 : 0;

      // 5. Attendance Success Rate (Present / Total expected)
      const attendances = await Booking.aggregate([
        { $match: { status: "completed", updatedAt: { $gte: start, $lte: end } } },
        { $group: { _id: "$attendanceStatus", count: { $sum: 1 } } }
      ]);
      const attendanceMap = attendances.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {});
      const present = attendanceMap["present"] || 0;
      const late = attendanceMap["late"] || 0;
      const absent = attendanceMap["absent"] || 0;
      const totalAttended = present + late + absent;
      const attendanceRate = totalAttended ? ((present + late) / totalAttended) * 100 : 0;

      // 6. Active Guides
      const activeGuides = await User.countDocuments({ role: "guide", guideStatus: "approved", createdAt: { $lte: end } }); // Rough approx of total active

      // 7. Completed Trips
      const completedTours = await Booking.countDocuments({ status: "completed", updatedAt: { $gte: start, $lte: end } });
      const completedPkgs = await PackageBooking.countDocuments({ bookingStatus: "completed", updatedAt: { $gte: start, $lte: end } });

      return {
        revenue,
        bookingsCount,
        travelersCount,
        avgRating,
        conversionRate,
        attendanceRate,
        activeGuides,
        completedTrips: completedTours + completedPkgs
      };
    };

    const currentMetrics = await getMetricsForPeriod(startDate, endDate);
    const previousMetrics = await getMetricsForPeriod(previousStartDate, previousEndDate);

    const calcChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    res.json({
      success: true,
      data: {
        current: currentMetrics,
        previous: previousMetrics,
        changes: {
          revenue: calcChange(currentMetrics.revenue, previousMetrics.revenue),
          bookingsCount: calcChange(currentMetrics.bookingsCount, previousMetrics.bookingsCount),
          travelersCount: calcChange(currentMetrics.travelersCount, previousMetrics.travelersCount),
          avgRating: currentMetrics.avgRating - previousMetrics.avgRating, // Absolute change for rating
          conversionRate: currentMetrics.conversionRate - previousMetrics.conversionRate,
          attendanceRate: currentMetrics.attendanceRate - previousMetrics.attendanceRate,
          activeGuides: calcChange(currentMetrics.activeGuides, previousMetrics.activeGuides),
          completedTrips: calcChange(currentMetrics.completedTrips, previousMetrics.completedTrips)
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get Revenue timeseries
// @route   GET /api/analytics/revenue
// @access  Private/Admin
const getRevenueAnalytics = async (req, res, next) => {
  try {
    const { timeframe = "30D" } = req.query;
    const { startDate, endDate } = getDateRange(timeframe);

    const formatString = timeframe === "YTD" || timeframe === "ALL" ? "%Y-%m" : "%Y-%m-%d";

    const tourRev = await Booking.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: {
          _id: { $dateToString: { format: formatString, date: "$createdAt" } },
          amount: { $sum: "$totalPrice" }
      }},
      { $sort: { _id: 1 } }
    ]);

    const pkgRev = await PackageBooking.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: {
          _id: { $dateToString: { format: formatString, date: "$createdAt" } },
          amount: { $sum: "$totalPrice" }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Merge arrays by date
    const merged = {};
    tourRev.forEach(r => {
      if (!merged[r._id]) merged[r._id] = { date: r._id, tours: 0, packages: 0, total: 0 };
      merged[r._id].tours += r.amount;
      merged[r._id].total += r.amount;
    });
    pkgRev.forEach(r => {
      if (!merged[r._id]) merged[r._id] = { date: r._id, tours: 0, packages: 0, total: 0 };
      merged[r._id].packages += r.amount;
      merged[r._id].total += r.amount;
    });

    const timeseries = Object.values(merged).sort((a, b) => a.date.localeCompare(b.date));

    res.json({ success: true, data: timeseries });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Bookings status breakdown & Request funnel
// @route   GET /api/analytics/bookings
// @access  Private/Admin
const getBookingAnalytics = async (req, res, next) => {
  try {
    const { timeframe = "30D" } = req.query;
    const { startDate, endDate } = getDateRange(timeframe);

    // Status Breakdown
    const tourStatus = await Booking.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    const pkgStatus = await PackageBooking.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$bookingStatus", count: { $sum: 1 } } }
    ]);
    
    const combinedStatus = {};
    tourStatus.forEach(s => combinedStatus[s._id] = (combinedStatus[s._id] || 0) + s.count);
    pkgStatus.forEach(s => combinedStatus[s._id] = (combinedStatus[s._id] || 0) + s.count);

    // Request Funnel
    const totalRequests = await Request.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
    const approvedRequests = await Request.countDocuments({ status: { $in: ["approved", "completed"] }, createdAt: { $gte: startDate, $lte: endDate } });
    const completedRequests = await Request.countDocuments({ status: "completed", createdAt: { $gte: startDate, $lte: endDate } });

    res.json({
      success: true,
      data: {
        statusDistribution: combinedStatus,
        funnel: {
          submitted: totalRequests,
          approved: approvedRequests,
          converted: completedRequests,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Guide Performance and Top Tours
// @route   GET /api/analytics/performance
// @access  Private/Admin
const getPerformanceAnalytics = async (req, res, next) => {
  try {
    const { timeframe = "30D" } = req.query;
    const { startDate, endDate } = getDateRange(timeframe);

    // 1. Guide Performance Metrics
    // We will aggregate guides, their average ratings from reviews, completed tours from bookings, and incidents
    const guides = await User.find({ role: "guide" }).select("name profilePicture");
    
    const guideMetrics = await Promise.all(guides.map(async (guide) => {
      // Completed trips
      const completed = await Booking.countDocuments({ guide: guide._id, status: "completed", updatedAt: { $gte: startDate, $lte: endDate } });
      
      // Attendance Success
      const attendances = await Booking.aggregate([
        { $match: { guide: guide._id, status: "completed", updatedAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: "$attendanceStatus", count: { $sum: 1 } } }
      ]);
      const attMap = attendances.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {});
      const present = attMap["present"] || 0;
      const late = attMap["late"] || 0;
      const absent = attMap["absent"] || 0;
      const totalAttended = present + late + absent;
      const attendanceRate = totalAttended ? ((present + late) / totalAttended) * 100 : 0;

      // Rating
      const revs = await Review.aggregate([
        { $match: { guide: guide._id, reviewType: "guide", isHidden: { $ne: true }, createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, avg: { $avg: "$rating" } } }
      ]);
      const avgRating = revs[0]?.avg || 0;

      // Incidents
      const incidentCount = await Incident.countDocuments({ guide: guide._id, createdAt: { $gte: startDate, $lte: endDate } });

      return {
        _id: guide._id,
        name: guide.name,
        profilePicture: guide.profilePicture,
        completedTrips: completed,
        attendanceRate: attendanceRate.toFixed(1),
        avgRating: avgRating.toFixed(1),
        incidentCount
      };
    }));

    // 2. Top Tours
    const topTours = await Booking.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: "$tour", revenue: { $sum: "$totalPrice" }, bookings: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);
    
    const populatedTours = await Tour.populate(topTours, { path: "_id", select: "title rating" });

    res.json({
      success: true,
      data: {
        guides: guideMetrics.sort((a, b) => b.completedTrips - a.completedTrips),
        topTours: populatedTours
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get QR & Attendance Analytics
// @route   GET /api/analytics/qr-attendance
// @access  Private/Admin
const getQRAnalytics = async (req, res, next) => {
  try {
    const { timeframe = "30D" } = req.query;
    const { startDate, endDate } = getDateRange(timeframe);

    // 1. Overall Bookings to analyze (only Paid and Confirmed/Completed within date range)
    const matchCriteria = { 
      paymentStatus: "paid", 
      status: { $in: ["confirmed", "completed"] },
      createdAt: { $gte: startDate, $lte: endDate }
    };

    const pkgMatchCriteria = {
      paymentStatus: "paid",
      bookingStatus: { $in: ["confirmed", "completed"] },
      createdAt: { $gte: startDate, $lte: endDate }
    };

    const tours = await Booking.find(matchCriteria).populate("scheduleId").lean();
    const packages = await PackageBooking.find(pkgMatchCriteria).populate("packageScheduleId").lean();

    const allBookings = [...tours, ...packages];
    
    if (allBookings.length === 0) {
      return res.json({
        success: true,
        data: {
          totalAnalyzed: 0,
          qrCheckInRate: "0.0",
          noShowRate: "0.0",
          lateArrivalRate: "0.0",
          packageVsTour: { tourAttendanceRate: "0.0", packageAttendanceRate: "0.0" },
          guideEfficiency: []
        }
      });
    }

    let verifiedCount = 0;
    let noShowCount = 0;
    let lateCount = 0;
    let tourVerified = 0;
    let pkgVerified = 0;
    const guideStats = {};

    const now = new Date();

    allBookings.forEach(b => {
      const isPackage = !!b.packageId;
      const schedule = isPackage ? b.packageScheduleId : b.scheduleId;
      if (!schedule) return;

      const tourStartDate = isPackage ? new Date(schedule.date) : new Date(schedule.startDate);
      // Let's say late is if they verified > 1 hour after start
      const isLate = b.verifiedAt && new Date(b.verifiedAt) > new Date(tourStartDate.getTime() + 60 * 60 * 1000);
      
      // No-show if not verified and it's past the 12-hour window
      const windowEnd = new Date(tourStartDate.getTime() + 12 * 60 * 60 * 1000);
      const isNoShow = !b.verified && now > windowEnd;

      if (b.verified) {
        verifiedCount++;
        if (isPackage) pkgVerified++;
        else tourVerified++;

        if (isLate) lateCount++;
      } else if (isNoShow) {
        noShowCount++;
      }

      // Guide Efficiency
      const assignedGuideId = isPackage ? schedule.assignedGuide : schedule.guide;
      if (assignedGuideId) {
        const gId = assignedGuideId.toString();
        if (!guideStats[gId]) guideStats[gId] = { totalAssigned: 0, verifiedCount: 0 };
        guideStats[gId].totalAssigned++;
        if (b.verified) guideStats[gId].verifiedCount++;
      }
    });

    const totalCount = allBookings.length;
    
    // Populate Guide info for efficiency
    const guideEfficiency = [];
    for (const [gId, stats] of Object.entries(guideStats)) {
      const guide = await User.findById(gId).select("name profilePicture").lean();
      if (guide) {
        guideEfficiency.push({
          guideId: gId,
          name: guide.name,
          efficiencyRate: ((stats.verifiedCount / stats.totalAssigned) * 100).toFixed(1),
          totalAssigned: stats.totalAssigned,
          verifiedCount: stats.verifiedCount
        });
      }
    }

    guideEfficiency.sort((a, b) => b.efficiencyRate - a.efficiencyRate);

    res.json({
      success: true,
      data: {
        totalAnalyzed: totalCount,
        qrCheckInRate: ((verifiedCount / totalCount) * 100).toFixed(1),
        noShowRate: ((noShowCount / totalCount) * 100).toFixed(1),
        lateArrivalRate: verifiedCount > 0 ? ((lateCount / verifiedCount) * 100).toFixed(1) : "0.0",
        packageVsTour: {
          tourAttendanceRate: tours.length > 0 ? ((tourVerified / tours.length) * 100).toFixed(1) : "0.0",
          packageAttendanceRate: packages.length > 0 ? ((pkgVerified / packages.length) * 100).toFixed(1) : "0.0"
        },
        guideEfficiency
      }
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Custom request funnel analytics
// @route   GET /api/analytics/request-funnel
// @access  Private/Admin
const getRequestFunnelAnalytics = async (req, res, next) => {
  try {
    const { timeframe = "30D" } = req.query;
    const { startDate, endDate } = getDateRange(timeframe);
    const RequestAuditLog = require("../models/RequestAuditLog");

    const match = { createdAt: { $gte: startDate, $lte: endDate } };
    const submitted = await Request.countDocuments(match);
    const guideAssigned = await RequestAuditLog.countDocuments({ event: "GUIDE_ASSIGNED", createdAt: { $gte: startDate, $lte: endDate } });
    const guideAccepted = await Request.countDocuments({ ...match, status: { $in: ["awaiting_payment", "confirmed", "completed"] } });
    const declined = await Request.countDocuments({ ...match, status: "declined_by_guide" });
    const expired = await Request.countDocuments({ ...match, status: "expired" });
    const paymentExpired = await Request.countDocuments({ ...match, status: "payment_expired" });
    const confirmed = await Request.countDocuments({ ...match, status: { $in: ["confirmed", "completed"] } });

    const paymentStarted = await RequestAuditLog.countDocuments({ event: "PAYMENT_LINK_SENT", createdAt: { $gte: startDate, $lte: endDate } });
    const paymentCompleted = await RequestAuditLog.countDocuments({ event: "PAYMENT_CONFIRMED", createdAt: { $gte: startDate, $lte: endDate } });

    const requestRevenue = await Booking.aggregate([
      { $match: { bookingSource: "request", paymentStatus: "paid", createdAt: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    const mostRequestedTours = await Request.aggregate([
      { $match: { ...match, tourId: { $exists: true } } },
      { $group: { _id: "$tourId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: "tours", localField: "_id", foreignField: "_id", as: "tour" } },
      { $unwind: { path: "$tour", preserveNullAndEmptyArrays: true } },
      { $project: { count: 1, title: "$tour.title.en" } },
    ]);

    const mostRequestedDates = await Request.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$preferredDate" } }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const assignmentTimes = await RequestAuditLog.aggregate([
      { $match: { event: "GUIDE_ASSIGNED", createdAt: { $gte: startDate, $lte: endDate } } },
      { $lookup: { from: "requestauditlogs", let: { rid: "$requestId" }, pipeline: [
        { $match: { $expr: { $and: [{ $eq: ["$requestId", "$$rid"] }, { $eq: ["$event", "REQUEST_CREATED"] }] } } },
      ], as: "created" } },
      { $unwind: "$created" },
      { $project: { hours: { $divide: [{ $subtract: ["$createdAt", "$created.createdAt"] }, 3600000] } } },
      { $group: { _id: null, avg: { $avg: "$hours" } } },
    ]);

    const guideAcceptance = guideAssigned > 0 ? ((guideAccepted / guideAssigned) * 100).toFixed(1) : "0.0";
    const conversionRate = submitted > 0 ? ((confirmed / submitted) * 100).toFixed(1) : "0.0";

    res.json({
      success: true,
      data: {
        funnel: {
          submitted,
          guideAssigned,
          guideAccepted,
          paymentStarted,
          paymentCompleted,
          confirmed,
        },
        metrics: {
          submittedRequests: submitted,
          acceptedRequests: guideAccepted,
          declinedRequests: declined,
          expiredRequests: expired,
          paymentExpiredRequests: paymentExpired,
          conversionRate,
          acceptanceRate: guideAcceptance,
          avgAssignmentHours: assignmentTimes[0]?.avg?.toFixed(1) || "0",
          revenueFromRequests: requestRevenue[0]?.total || 0,
          mostRequestedTours,
          mostRequestedDates,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverviewAnalytics,
  getRevenueAnalytics,
  getBookingAnalytics,
  getPerformanceAnalytics,
  getQRAnalytics,
  getRequestFunnelAnalytics,
};
