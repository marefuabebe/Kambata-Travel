const Tour = require("../models/Tour");
const Booking = require("../models/Booking");
const IncidentReport = require("../models/IncidentReport");
const Notification = require("../models/Notification");
const User = require("../models/User");
const TourRequest = require("../models/TourRequest");
const { getGuideScheduleIds } = require("../services/tourBookingRules");
const { sendNotification, notifyAdminOfAssignmentDecision, notifyTravelersOfAcceptance } = require("../services/notificationService");
const { recordAction } = require("../services/auditService");
const mapScheduleStatus = (s) => {
  if (s === "in_progress") return "In Progress";
  if (s === "completed" || s === "cancelled") return "Completed";
  return "Scheduled";
};

const parseTimeSafe = (timeStr, defaultHour = 9, defaultMinute = 0) => {
  if (!timeStr || typeof timeStr !== "string" || timeStr === "—") {
    return { hours: defaultHour, minutes: defaultMinute };
  }
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const meridian = match[3]?.toUpperCase();
    if (meridian === "PM" && h < 12) h += 12;
    if (meridian === "AM" && h === 12) h = 0;
    if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return { hours: h, minutes: m };
    }
  }
  return { hours: defaultHour, minutes: defaultMinute };
};

const flattenGuideAssignments = async (guideId) => {
  const tours = await Tour.find({ "schedules.guide": guideId })
    .populate("destination", "name location")
    .lean();

  const assignments = [];
  
  // 1. Process Tour Schedules
  for (const tour of tours) {
    for (const schedule of tour.schedules || []) {
      if (schedule.guide?.toString() !== guideId.toString()) continue;

      const bookings = await Booking.find({
        scheduleId: schedule._id,
        status: { $in: ["confirmed", "completed", "pending"] },
        paymentStatus: { $in: ["paid", "pending"] },
      }).select("numPeople attendanceStatus status paymentStatus tourStatus verified");

      const travelerCount = bookings.reduce((sum, b) => sum + b.numPeople, 0);
      const present = bookings.filter((b) => b.attendanceStatus === "present" || b.verified === true || b.tourStatus === "started").length;
      const absent = bookings.filter((b) => b.attendanceStatus === "absent").length;
      const late = bookings.filter((b) => b.attendanceStatus === "late").length;
      const hasStartedTourBookings = bookings.some((b) => b.tourStatus === "started" || b.verified === true || b.attendanceStatus === "present");
      const isTourInProgress = schedule.status === "in_progress" || hasStartedTourBookings;

      assignments.push({
        type: "tour",
        tourId: tour._id,
        scheduleId: schedule._id,
        tourName: tour.title?.en || tour.title,
        destination: tour.destination?.name?.en || tour.destination?.name || "—",
        description: tour.description?.en || "",
        coordinates: tour.destination?.location?.coordinates,
        meetingPoint:
          schedule.meetingPoint ||
          tour.meetingPoint?.en ||
          tour.destination?.location?.woreda ||
          "TBA",
        date: schedule.startDate || schedule.date,
        endDate: schedule.endDate || schedule.date,
        startTime: schedule.startTime || "—",
        endTime: schedule.endTime || "—",
        capacity: tour.maxCapacity,
        remainingSlots: schedule.remainingSlots,
        travelerCount,
        attendance: { present, absent, late, total: bookings.length },
        status: isTourInProgress ? "In Progress" : mapScheduleStatus(schedule.status || "draft"),
        rawStatus: isTourInProgress ? "in_progress" : (schedule.status || "draft"),
        assignmentStatus: (isTourInProgress || schedule.status === "completed") ? "accepted" : (schedule.assignmentStatus || "pending"),
        isLocked: (() => {
          if (schedule.attendanceLocked) return true;
          if (schedule.status === "completed" || schedule.status === "cancelled") return false;
          const endVal = schedule.endDate || schedule.date;
          if (!endVal) return false;
          const endDateObj = new Date(endVal);
          if (isNaN(endDateObj.getTime()) || endDateObj.getFullYear() < 2000) return false;
          const { hours, minutes } = parseTimeSafe(schedule.endTime, 23, 59);
          endDateObj.setHours(hours, minutes, 0, 0);
          return endDateObj < new Date();
        })(),
        image: tour.images?.[0],
        guideNotes: schedule.guideNotes,
      });
    }
  }

  // 2. Process Package Schedules
  const PackageSchedule = require("../models/PackageSchedule");
  const PackageBooking = require("../models/PackageBooking");
  const pkgSchedules = await PackageSchedule.find({ assignedGuide: guideId })
    .populate({
      path: "packageId",
      populate: [
        { path: "tour", select: "images" },
        { path: "hotel", select: "name location" }
      ]
    })
    .lean();

  for (const sch of pkgSchedules) {
    const bookings = await PackageBooking.find({
      packageScheduleId: sch._id,
      bookingStatus: { $in: ["confirmed", "completed", "pending"] },
      paymentStatus: { $in: ["paid", "pending"] },
    }).select("travelersCount bookingStatus paymentStatus tourStatus verified attendanceStatus");

    const travelerCount = bookings.reduce((sum, b) => sum + b.travelersCount, 0);
    const present = bookings.filter((b) => b.attendanceStatus === "present" || b.verified === true || b.tourStatus === "started").length;
    const hasStartedPkgBookings = bookings.some((b) => b.tourStatus === "started" || b.verified === true || b.attendanceStatus === "present");
    const isPkgInProgress = sch.status === "in_progress" || hasStartedPkgBookings;

    assignments.push({
      type: "package",
      tourId: sch.packageId?._id, // Used for generic link, but denote it's a package
      scheduleId: sch._id,
      tourName: sch.packageId?.name?.en || "Travel Package",
      destination: sch.packageId?.hotel?.location || "—",
      description: "Complete Travel Package including Tour & Hotel.",
      meetingPoint: sch.packageId?.hotel?.name || "TBA",
      date: sch.startDate || sch.date,
      endDate: sch.endDate || sch.date,
      startTime: sch.startTime || "09:00",
      endTime: sch.endTime || "17:00",
      capacity: sch.capacity,
      remainingSlots: sch.availableSeats,
      travelerCount,
      attendance: { present, absent: 0, late: 0, total: bookings.length },
      status: isPkgInProgress ? "In Progress" : mapScheduleStatus(sch.status || "draft"),
      rawStatus: isPkgInProgress ? "in_progress" : (sch.status || "draft"),
      assignmentStatus: (isPkgInProgress || sch.status === "completed") ? "accepted" : (sch.assignmentStatus || "pending"),
      isLocked: (() => {
        if (sch.attendanceLocked) return true;
        if (sch.status === "completed" || sch.status === "cancelled") return false;
        const endVal = sch.endDate || sch.date;
        if (!endVal) return false;
        const endDateObj = new Date(endVal);
        if (isNaN(endDateObj.getTime()) || endDateObj.getFullYear() < 2000) return false;
        const { hours, minutes } = parseTimeSafe(sch.endTime, 23, 59);
        endDateObj.setHours(hours, minutes, 0, 0);
        return endDateObj < new Date();
      })(),
      image: sch.packageId?.tour?.images?.[0],
      guideNotes: "",
    });
  }

  assignments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return assignments;
};

const assertGuideOwnsSchedule = async (guideId, tourId, scheduleId) => {
  const tour = await Tour.findById(tourId);
  if (tour) {
    const schedule = tour.schedules.id(scheduleId);
    if (!schedule || schedule.guide.toString() !== guideId.toString()) {
      const err = new Error("You are not assigned to this schedule");
      err.statusCode = 403;
      throw err;
    }
    return { tour, schedule, type: "tour" };
  }

  const Package = require("../models/Package");
  const PackageSchedule = require("../models/PackageSchedule");
  const pkg = await Package.findById(tourId).populate("hotel");
  if (pkg) {
    const schedule = await PackageSchedule.findById(scheduleId);
    if (!schedule || schedule.assignedGuide.toString() !== guideId.toString()) {
      const err = new Error("You are not assigned to this package schedule");
      err.statusCode = 403;
      throw err;
    }
    return { tour: pkg, schedule, type: "package" };
  }

  const err = new Error("Tour or Package not found");
  err.statusCode = 404;
  throw err;
};

// GET /api/guide-ops/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const guideId = req.user._id;
    const assignments = await flattenGuideAssignments(guideId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const todaysTours = assignments.filter((a) => {
      const d = new Date(a.date);
      return d >= today && d < tomorrow && a.rawStatus !== "cancelled";
    });

    const upcomingTours = assignments.filter(
      (a) => new Date(a.date) >= tomorrow && ["draft", "published", "full"].includes(a.rawStatus)
    );

    const travelersToday = todaysTours.reduce((s, a) => s + a.travelerCount, 0);

    const completedThisMonth = assignments.filter(
      (a) => a.rawStatus === "completed" && a.assignmentStatus !== "rejected" && new Date(a.date) >= monthStart
    ).length;

    const openIncidents = await IncidentReport.countDocuments({
      guide: guideId,
      status: { $in: ["open", "under_review"] },
    });

    const unreadMessages = await Notification.countDocuments({
      user: guideId,
      isRead: false,
    });

    const recentNotifications = await Notification.find({ user: guideId })
      .sort("-createdAt")
      .limit(8)
      .lean();

    res.json({
      success: true,
      data: {
        widgets: {
          todaysTours: todaysTours.length,
          upcomingTours: upcomingTours.length,
          travelersToday,
          completedThisMonth,
          pendingIncidents: openIncidents,
          unreadMessages,
        },
        upcomingSchedule: upcomingTours[0] || todaysTours[0] || null,
        recentActivity: recentNotifications.map((n) => ({
          id: n._id,
          message: n.message,
          type: n.type,
          createdAt: n.createdAt,
        })),
        permissions: {
          role: "guide",
          canCreateTours: false,
          canManageBookings: false,
          canProcessPayments: false,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/guide-ops/assignments
const getAssignments = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    let assignments = await flattenGuideAssignments(req.user._id);
    
    // Hide rejected assignments from the main Assigned Tours list
    assignments = assignments.filter((a) => a.assignmentStatus !== "rejected");

    if (status) {
      assignments = assignments.filter(
        (a) => a.status.toLowerCase() === String(status).toLowerCase()
      );
    }
    if (search) {
      const q = String(search).toLowerCase();
      assignments = assignments.filter(
        (a) =>
          String(a.tourName).toLowerCase().includes(q) ||
          String(a.destination).toLowerCase().includes(q)
      );
    }

    res.json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    next(error);
  }
};

// GET /api/guide-ops/assignments/:tourId/:scheduleId
const getAssignmentDetail = async (req, res, next) => {
  try {
    const { tour, schedule, type } = await assertGuideOwnsSchedule(
      req.user._id,
      req.params.tourId,
      req.params.scheduleId
    );

    let bookings = [];
    if (type === "tour") {
      bookings = await Booking.find({
        scheduleId: schedule._id,
        status: { $in: ["confirmed", "completed", "pending"] },
      })
        .populate("user", "name email phone emergencyContact profilePicture")
        .lean();
    } else {
      const PackageBooking = require("../models/PackageBooking");
      const pkgBookings = await PackageBooking.find({
        packageScheduleId: schedule._id,
        bookingStatus: { $in: ["confirmed", "completed", "pending"] },
      })
        .populate("user", "name email phone emergencyContact profilePicture")
        .lean();
        
      bookings = pkgBookings.map(b => ({
        ...b,
        status: b.bookingStatus,
        attendanceStatus: "pending",
        numPeople: b.travelersCount,
      }));
    }

    const travelers = bookings.map((b) => ({
      bookingId: b._id,
      referenceNumber: b.referenceNumber || b._id?.toString().substring(0, 8),
      fullName: b.user?.name,
      phone: b.user?.phone,
      email: b.user?.email,
      partySize: b.numPeople,
      emergencyContact: b.user?.emergencyContact,
      attendanceStatus: b.attendanceStatus,
      paymentStatus: b.paymentStatus,
      status: b.status,
      chatRoom: b.chatRoom,
    }));

    const attendance = {
      total: travelers.length,
      present: travelers.filter((t) => t.attendanceStatus === "present").length,
      absent: travelers.filter((t) => t.attendanceStatus === "absent").length,
      late: travelers.filter((t) => t.attendanceStatus === "late").length,
      pending: travelers.filter((t) => t.attendanceStatus === "pending").length,
    };

    const incidents = await IncidentReport.find({
      guide: req.user._id,
      scheduleId: schedule._id,
    })
      .sort("-createdAt")
      .lean();

    res.json({
      success: true,
      data: {
        tour: {
          id: tour._id,
          name: type === "tour" ? (tour.title?.en || tour.title) : (tour.name?.en || tour.name),
          destination: type === "tour" ? tour.destination : (tour.hotel?.location || "—"),
          description: type === "tour" ? tour.description?.en : tour.overview?.en,
          meetingPoint: schedule.meetingPoint || (type === "tour" ? tour.meetingPoint?.en : tour.hotel?.name) || "TBA",
          date: schedule.startDate || schedule.date,
          endDate: schedule.endDate || schedule.date,
          startTime: schedule.startTime || "09:00",
          endTime: schedule.endTime || "17:00",
          capacity: type === "tour" ? tour.maxCapacity : schedule.capacity,
          status: mapScheduleStatus(schedule.status || "draft"),
          rawStatus: schedule.status || "draft",
          isLocked: schedule.attendanceLocked || false,
          guideNotes: schedule.guideNotes || "",
        },
        travelers,
        attendance,
        incidents,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode);
    }
    next(error);
  }
};

// PATCH /api/guide-ops/assignments/:tourId/:scheduleId/status
const updateAssignmentStatus = async (req, res, next) => {
  try {
    const { status, guideNotes } = req.body;
    const { tour, schedule, type } = await assertGuideOwnsSchedule(
      req.user._id,
      req.params.tourId,
      req.params.scheduleId
    );

    if (schedule.attendanceLocked) {
      res.status(403);
      throw new Error("Cannot change status. This tour/package is already locked.");
    }

    if (status === "start" || status === "in_progress") {
      schedule.status = "in_progress";
      schedule.assignmentStatus = "accepted";
    } else if (status === "complete" || status === "completed") {
      schedule.status = "completed";
      if (guideNotes) schedule.guideNotes = guideNotes;

      const paidBookings = await Booking.find({
        scheduleId: schedule._id,
        status: "confirmed",
        paymentStatus: "paid",
      });

      for (const booking of paidBookings) {
        booking.status = "completed";
        if (booking.payoutStatus === "pending_completion" || !booking.payoutStatus) {
          const { stageGuideEarnings } = require("../services/walletService");
          const { guideShare, platformFee } = await stageGuideEarnings(req.user._id, booking.totalPrice);
          booking.payoutStatus = "pending_clearance";
          booking.completedAt = new Date();
          booking.guideEarnings = guideShare;
          booking.platformFee = platformFee;
        }
        await booking.save();

        await sendNotification(booking.user, {
          type: "booking",
          priority: "NORMAL",
          message: `Your tour is complete! You can now leave a review.`,
          referenceId: booking._id,
        });
      }
    } else {
      res.status(400);
      throw new Error("Use status: start or complete");
    }

    if (type === "tour") {
      await tour.save();
    } else {
      await schedule.save();
    }

    res.json({
      success: true,
      message: `Tour ${schedule.status === "completed" ? "completed" : "started"}`,
      data: { status: mapScheduleStatus(schedule.status), rawStatus: schedule.status },
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

// GET /api/guide-ops/travelers
const getTravelers = async (req, res, next) => {
  try {
    const scheduleIds = await getGuideScheduleIds(req.user._id);
    const { tourId, scheduleId, attendance } = req.query;

    const query = {
      scheduleId: { $in: scheduleIds },
      status: { $in: ["confirmed", "completed", "pending"] },
      paymentStatus: { $in: ["paid", "pending"] },
    };
    if (scheduleId) query.scheduleId = scheduleId;
    if (tourId) query.tour = tourId;
    if (attendance) query.attendanceStatus = attendance;

    const bookings = await Booking.find(query)
      .populate("user", "name email phone emergencyContact profilePicture")
      .populate("tour", "title destination")
      .sort("-createdAt")
      .lean();

    // Fetch Package Bookings
    const PackageSchedule = require("../models/PackageSchedule");
    const PackageBooking = require("../models/PackageBooking");
    
    const pkgSchedules = await PackageSchedule.find({ assignedGuide: req.user._id }).select("_id packageId");
    const pkgScheduleIds = pkgSchedules.map(s => s._id);
    
    const pkgQuery = {
      packageScheduleId: { $in: pkgScheduleIds },
      bookingStatus: { $in: ["confirmed", "completed", "pending"] },
      paymentStatus: { $in: ["paid", "pending"] },
    };
    if (scheduleId) pkgQuery.packageScheduleId = scheduleId;
    // We can't easily filter pkgQuery by tourId without populating first, but we can do it post-query
    
    const pkgBookings = await PackageBooking.find(pkgQuery)
      .populate("user", "name email phone emergencyContact profilePicture")
      .populate({
        path: "packageId",
        populate: { path: "tour", select: "title destination _id" }
      })
      .sort("-createdAt")
      .lean();

    let allTravelers = [
      ...bookings.map((b) => ({
        bookingId: b._id,
        referenceNumber: b.referenceNumber,
        tourName: b.tour?.title?.en || b.tour?.title,
        tourId: b.tour?._id,
        scheduleId: b.scheduleId,
        userId: b.user?._id,
        fullName: b.user?.name,
        phone: b.user?.phone,
        email: b.user?.email,
        partySize: b.numPeople,
        emergencyContact: b.user?.emergencyContact,
        attendanceStatus: b.attendanceStatus,
        status: b.status,
        createdAt: b.createdAt,
        isPackage: false
      })),
      ...pkgBookings.map((b) => ({
        bookingId: b._id,
        referenceNumber: b.referenceNumber || b._id.toString().substring(0, 8),
        tourName: b.packageId?.name?.en || b.packageId?.name || "Travel Package",
        tourId: b.packageId?.tour?._id,
        scheduleId: b.packageScheduleId,
        userId: b.user?._id,
        fullName: b.user?.name,
        phone: b.user?.phone,
        email: b.user?.email,
        partySize: b.travelersCount,
        emergencyContact: b.user?.emergencyContact,
        attendanceStatus: "present", // Packages don't track attendance yet
        status: b.bookingStatus,
        createdAt: b.createdAt,
        isPackage: true
      }))
    ];

    if (tourId) {
      allTravelers = allTravelers.filter(t => t.tourId?.toString() === tourId);
    }
    
    // Sort combined by createdAt desc
    allTravelers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      count: allTravelers.length,
      data: allTravelers,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/guide-ops/attendance/bulk
const bulkAttendance = async (req, res, next) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates)) {
      res.status(400);
      throw new Error("updates array required");
    }

    const results = [];
    for (const { bookingId, status } of updates) {
      if (!["pending", "present", "absent", "late"].includes(status)) continue;

      const booking = await Booking.findById(bookingId);
      if (!booking) continue;

      const scheduleIds = await getGuideScheduleIds(req.user._id);
      if (
        booking.guide?.toString() !== req.user._id.toString() &&
        !scheduleIds.some((id) => id.toString() === booking.scheduleId.toString())
      ) {
        continue;
      }

      booking.attendanceStatus = status;
      await booking.save();
      results.push({ bookingId, status });
    }

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

// GET /api/guide-ops/requests
const getRequests = async (req, res, next) => {
  try {
    const TourRequest = require("../models/TourRequest");
    const guideId = req.user._id;
    const requests = await TourRequest.find({
      assignedGuide: guideId,
      status: { $in: ["guide_pending", "awaiting_payment", "confirmed", "declined_by_guide", "expired"] }
    })
      .populate("tourId", "title")
      .populate("packageId", "name")
      .populate("user", "name email")
      .sort("-createdAt")
      .lean();

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/guide-ops/incidents
const createIncident = async (req, res, next) => {
  try {
    const { tourId, scheduleId, title, description, type, severity, photoUrl, location } =
      req.body;

    await assertGuideOwnsSchedule(req.user._id, tourId, scheduleId);

    const incident = await IncidentReport.create({
      guide: req.user._id,
      tour: tourId,
      scheduleId,
      title,
      description,
      type: type || "other",
      severity: severity || "medium",
      photoUrl,
      location,
    });

    const admins = await User.find({ role: "admin" }).select("_id");
    for (const admin of admins) {
      await sendNotification(admin._id, {
        type: "system",
        priority: severity === "critical" ? "HIGH" : "NORMAL",
        message: `[Incident ${severity}] ${title} — reported by guide`,
        referenceId: incident._id,
      });
    }

    res.status(201).json({ success: true, data: incident });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

// GET /api/guide-ops/incidents
const listIncidents = async (req, res, next) => {
  try {
    const incidents = await IncidentReport.find({ guide: req.user._id })
      .populate("tour", "title")
      .sort("-createdAt")
      .lean();

    res.json({ success: true, data: incidents });
  } catch (error) {
    next(error);
  }
};

// GET /api/guide-ops/history
const getTourHistory = async (req, res, next) => {
  try {
    const assignments = await flattenGuideAssignments(req.user._id);
    const completed = assignments.filter((a) => a.rawStatus === "completed" && a.assignmentStatus !== "rejected");

    res.json({ success: true, count: completed.length, data: completed });
  } catch (error) {
    next(error);
  }
};

// POST /api/guide-ops/announcements
const sendScheduleAnnouncement = async (req, res, next) => {
  try {
    const { tourId, scheduleId, message, title } = req.body;
    const { schedule } = await assertGuideOwnsSchedule(
      req.user._id,
      tourId,
      scheduleId
    );

    const bookings = await Booking.find({
      scheduleId: schedule._id,
      status: { $in: ["confirmed", "pending"] },
      paymentStatus: { $in: ["paid", "pending"] },
    });

    const text = title ? `${title}: ${message}` : message;

    await Promise.all(
      bookings.map((b) =>
        sendNotification(b.user, {
          type: "system",
          priority: "HIGH",
          message: text,
          referenceId: b._id,
        })
      )
    );

    res.json({
      success: true,
      message: `Announcement sent to ${bookings.length} travelers`,
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

// POST /api/guide-ops/assignments/respond
const respondToAssignment = async (req, res, next) => {
  try {
    const { scheduleId, type, decision } = req.body; // type: "tour" | "package", decision: "accepted" | "rejected"
    const guideId = req.user._id;

    if (!["accepted", "rejected"].includes(decision)) {
      res.status(400);
      throw new Error("Invalid decision");
    }

    let scheduleObj;
    let tourTitle = "";

    if (type === "tour") {
      const tour = await Tour.findOne({ "schedules._id": scheduleId });
      if (!tour) throw new Error("Tour not found");
      const sched = tour.schedules.id(scheduleId);
      if (sched.guide.toString() !== guideId.toString()) throw new Error("Not assigned");
      sched.assignmentStatus = decision;
      if (decision === "accepted" && sched.status === "upcoming") {
        sched.status = "published";
      }
      await tour.save();
      scheduleObj = sched;
      tourTitle = tour.title?.en || tour.title;
    } else {
      const PackageSchedule = require("../models/PackageSchedule");
      const Package = require("../models/Package");
      const sched = await PackageSchedule.findById(scheduleId);
      if (!sched || sched.assignedGuide?.toString() !== guideId.toString()) throw new Error("Not assigned");
      sched.assignmentStatus = decision;
      if (decision === "accepted" && sched.status === "upcoming") {
        sched.status = "published";
      }
      await sched.save();
      const pkg = await Package.findById(sched.packageId);
      scheduleObj = sched;
      tourTitle = pkg?.title?.en || pkg?.title || "Package";
    }

    recordAction(req, `GUIDE_ASSIGNMENT_${decision.toUpperCase()}`, "Schedule", scheduleId, { guideId });

    // Notify Admin
    await notifyAdminOfAssignmentDecision(req.user.name, decision, tourTitle);

    // Notify Travelers if accepted
    if (decision === "accepted") {
      await notifyTravelersOfAcceptance(scheduleId, req.user.name, tourTitle);

      // Trigger payment notification for Custom Request
      if (scheduleObj.linkedRequestId) {
        const TourRequest = require("../models/TourRequest");
        const request = await TourRequest.findById(scheduleObj.linkedRequestId).populate("user");
        
        if (request && request.user) {
          // Self-heal: if the request was stuck in 'approved' due to previous validation errors,
          // ensure it moves to 'converted_to_schedule' now that the guide has accepted it.
          if (request.status !== "converted_to_schedule") {
            request.status = "converted_to_schedule";
            if (!request.travelers) request.travelers = 1;
            if (!request.requestType) request.requestType = "custom_date";
            await request.save();
          }

          const { sendNotification } = require("../services/notificationService");
          const { sendEmail } = require("../utils/mailService");
          const { buildPremiumEmail } = require("../utils/emailTemplateBuilder");
          
          // 1. In-App Notification
          await sendNotification(request.user._id, {
            type: "booking",
            priority: "HIGH",
            message: `Your guide has accepted the schedule! Please complete your payment to confirm the booking.`,
          });

          // 2. Email Notification
          const checkoutLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/${type === 'tour' ? 'checkout' : 'checkout-package'}/${type === 'tour' ? tourId : sched.packageId}?scheduleId=${scheduleId}`;
          const emailHtml = buildPremiumEmail({
            type: "default",
            title: "Your Guide is Ready!",
            icon: "👨‍💼",
            accentColor: "#E67E22",
            greeting: `Dear ${request.user.name},`,
            bodyLines: [
              "An expert guide has just accepted your private schedule request.",
              "To secure your booking, please complete your payment using the link below."
            ],
            infoCards: [
              { title: "Tour Date", value: new Date(scheduleObj.startDate || scheduleObj.date).toLocaleDateString(), iconEmoji: "📅" }
            ],
            cta: {
              text: "Pay Now",
              link: checkoutLink,
              color: "#E67E22"
            }
          });

          await sendEmail({
            to: request.user.email,
            subject: "Guide Assigned - Complete Your Payment",
            html: emailHtml
          });
        }
      }
    }

    res.json({ success: true, message: `Assignment ${decision}`, assignmentStatus: decision });
  } catch (error) {
    next(error);
  }
};

const scanDigitalPass = async (req, res, next) => {
  try {
    const { token } = req.body;
    const jwt = require("jsonwebtoken");

    if (!token) {
      res.status(400);
      throw new Error("Missing QR token");
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      res.status(400);
      throw new Error("Invalid or expired Digital Pass");
    }

    const { bookingId, scheduleId, type } = decoded;

    // Verify Guide owns this schedule
    const guideId = req.user._id;
    let scheduleObj;
    let bookingRecord;
    let travelerName;

    // Resolve booking and schedule for both types
    let tourName = "";
    let partySize = 1;

    if (type === "package") {
      const PackageSchedule = require("../models/PackageSchedule");
      const PackageBooking = require("../models/PackageBooking");
      scheduleObj = await PackageSchedule.findById(scheduleId).populate({ path: "packageId", select: "name" });
      if (!scheduleObj || scheduleObj.assignedGuide?.toString() !== guideId.toString()) {
        res.status(403);
        throw new Error("Not authorized to scan passes for this schedule");
      }
      bookingRecord = await PackageBooking.findById(bookingId).populate("user", "name _id");
      if (bookingRecord) {
        travelerName = bookingRecord.user?.name;
        partySize = bookingRecord.travelersCount || 1;
        tourName = scheduleObj.packageId?.name?.en || scheduleObj.packageId?.name || "Travel Package";
      }
    } else {
      const fallback = await (async () => {
        const tourDoc = await Tour.findOne({ "schedules._id": scheduleId });
        if (!tourDoc) throw new Error("Tour not found");
        const sched = tourDoc.schedules.id(scheduleId);
        if (sched.guide.toString() !== guideId.toString()) throw new Error("Not authorized");
        return { tour: tourDoc, schedule: sched };
      })();
      scheduleObj = fallback.schedule;
      tourName = fallback.tour?.title?.en || fallback.tour?.title || "Tour";
      bookingRecord = await Booking.findById(bookingId).populate("user", "name _id");
      if (bookingRecord) {
        travelerName = bookingRecord.user?.name;
        partySize = bookingRecord.numPeople || 1;
      }
    }

    if (!bookingRecord) {
      res.status(404);
      throw new Error("Booking not found");
    }

    // Check for duplicate scan
    if (bookingRecord.attendanceStatus === "present") {
      res.status(400);
      throw new Error("Traveler is already checked in");
    }

    // Update attendance
    if (type === "tour") {
      bookingRecord.attendanceStatus = "present";
    }
    bookingRecord.checkedInAt = new Date();
    await bookingRecord.save();

    // Send Welcome Notification to Traveler
    const travelerId = bookingRecord.user?._id || bookingRecord.user;
    if (travelerId) {
      await sendNotification(travelerId, {
        type: "booking",
        priority: "HIGH",
        message: `🎉 Welcome to your tour! Your attendance has been verified by your guide.\n\nTour: ${tourName}\nGuide: ${req.user.name}\nStatus: Checked In ✓`,
        referenceId: bookingRecord._id,
      });
    }

    res.json({
      success: true,
      message: "Check-In Successful",
      data: {
        travelerName,
        referenceNumber: bookingRecord.referenceNumber || bookingRecord._id.toString().slice(-8).toUpperCase(),
        tourName,
        partySize,
        checkedInAt: bookingRecord.checkedInAt,
      }
    });

  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

const getCalendar = async (req, res, next) => {
  try {
    const assignments = await flattenGuideAssignments(req.user._id);
    
    const GuideTimeOff = require("../models/GuideTimeOff");
    const timeOffs = await GuideTimeOff.find({ guide: req.user._id }).lean();
    
    // Convert to a format suitable for react-big-calendar
    const events = [];
    
    for (const a of assignments) {
      // Exclude rejected assignments, but include cancelled and others
      if (a.assignmentStatus === "rejected") continue;
      
      let start = new Date(a.date);
      if (isNaN(start.getTime()) || start.getFullYear() < 2000) {
        start = new Date();
      }
      const { hours: sh, minutes: sm } = parseTimeSafe(a.startTime, 9, 0);
      start.setHours(sh, sm, 0, 0);
      
      let end = new Date(a.endDate || a.date);
      if (isNaN(end.getTime()) || end.getFullYear() < 2000) {
        end = new Date(start);
      }
      const { hours: eh, minutes: em } = parseTimeSafe(a.endTime, Math.min(23, sh + 4), sm);
      end.setHours(eh, em, 0, 0);
      if (end <= start) {
        end = new Date(start.getTime() + 3 * 3600 * 1000);
      }
      
      events.push({
        id: a.scheduleId,
        tourId: a.tourId,
        scheduleId: a.scheduleId,
        title: a.tourName,
        start,
        end,
        type: a.type || "tour",
        status: a.rawStatus || a.status,
        rawStatus: a.rawStatus || a.status,
        assignmentStatus: a.assignmentStatus,
        isLocked: a.isLocked || false,
        image: a.image,
        travelers: a.travelerCount,
        meetingPoint: a.meetingPoint,
        destination: a.destination,
        coordinates: a.coordinates,
        startTime: a.startTime,
        endTime: a.endTime,
        attendance: a.attendance,
      });
    }
    
    for (const t of timeOffs) {
      events.push({
        id: t._id,
        title: `Time Off (${t.reason})`,
        start: new Date(t.startDate),
        end: new Date(t.endDate),
        type: "timeOff",
        status: t.status || "approved",
        reason: t.reason
      });
    }
    
    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

const blockTimeOff = async (req, res, next) => {
  try {
    const { startDate, endDate, reason, notes } = req.body;
    
    if (!startDate || !endDate) {
      res.status(400);
      throw new Error("Start and end dates are required");
    }
    
    const GuideTimeOff = require("../models/GuideTimeOff");
    
    const timeOff = await GuideTimeOff.create({
      guide: req.user._id,
      startDate,
      endDate,
      reason,
      notes,
      status: "approved" // auto-approve for now
    });
    
    res.status(201).json({ success: true, data: timeOff });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getAssignments,
  getAssignmentDetail,
  updateAssignmentStatus,
  getTravelers,
  bulkAttendance,
  createIncident,
  listIncidents,
  getTourHistory,
  sendScheduleAnnouncement,
  respondToAssignment,
  scanDigitalPass,
  getCalendar,
  blockTimeOff,
  getRequests,
  flattenGuideAssignments,
};
