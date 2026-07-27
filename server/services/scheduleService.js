const Tour = require("../models/Tour");
const Booking = require("../models/Booking");
const { sendNotification } = require("./notificationService");
const logger = require("../utils/logger");

/**
 * Cancel a schedule and all active bookings on it (notify travelers).
 */
const cancelScheduleWithBookings = async (tourId, scheduleId, actorUserId, isAdmin = false) => {
  const tour = await Tour.findById(tourId);
  if (!tour) {
    const err = new Error("Tour not found");
    err.statusCode = 404;
    throw err;
  }

  const schedule = tour.schedules.id(scheduleId);
  if (!schedule) {
    const err = new Error("Schedule not found");
    err.statusCode = 404;
    throw err;
  }

  if (!isAdmin) {
    const err = new Error("Only Administrators are authorized to cancel schedules");
    err.statusCode = 403;
    throw err;
  }

  const bookings = await Booking.find({
    tour: tourId,
    scheduleId,
    status: { $in: ["confirmed", "pending", "invited", "waitlisted"] },
  });

  await Promise.all(
    bookings.map(async (booking) => {
      booking.status = "cancelled";
      if (booking.paymentStatus === "paid") {
        booking.paymentStatus = "refunded";
      }
      await booking.save();

      await sendNotification(booking.user, {
        type: "booking",
        priority: "HIGH",
        message: `Your tour "${tour.title?.en || tour.title}" was cancelled by the guide. Refunds will be processed where applicable.`,
        referenceId: booking._id,
      });
    })
  );

  schedule.deleteOne();
  await tour.save();

  logger.info(
    `Schedule ${scheduleId} cancelled. ${bookings.length} booking(s) affected.`
  );

  return { tour, cancelledBookings: bookings.length };
};

const GuideLock = require("../models/GuideLock");

const lockGuide = async (guideId) => {
  try {
    await GuideLock.create({ guideId });
  } catch (err) {
    if (err.code === 11000) {
      const conflictErr = new Error("Conflict Detected: Guide is currently being assigned by another process. Please try again.");
      conflictErr.statusCode = 409;
      throw conflictErr;
    }
    throw err;
  }
};

const unlockGuide = async (guideId) => {
  try {
    await GuideLock.deleteOne({ guideId });
  } catch (err) {
    console.error(`Failed to unlock guide ${guideId}:`, err.message);
  }
};

const { ACTIVE_SCHEDULE_STATUSES } = require("../utils/availabilityConstants");

const getGuideAvailabilityDebug = async (guideId, startDate, endDate, startTime, endTime) => {
  if (!guideId || !startDate || !endDate) return { available: true, conflicts: [] };

  const parseDateTime = (date, timeStr, isEnd) => {
    const dt = new Date(date);
    if (!timeStr) {
      if (isEnd) dt.setHours(23, 59, 59, 999);
      else dt.setHours(0, 0, 0, 0);
      return dt;
    }
    const [time, modifier] = timeStr.trim().split(' ');
    if (!time || !modifier) {
      if (isEnd) dt.setHours(23, 59, 59, 999);
      else dt.setHours(0, 0, 0, 0);
      return dt;
    }
    let [hours, minutes] = time.split(':').map(Number);
    if (hours === 12) { hours = modifier === 'PM' ? 12 : 0; }
    else if (modifier === 'PM') { hours += 12; }
    dt.setHours(hours, minutes, 0, 0);
    return dt;
  };

  const reqStartDt = parseDateTime(startDate, startTime, false);
  const reqEndDt = parseDateTime(endDate, endTime, true);

  const doOverlap = (s2, e2, st2, et2) => {
    const otherStartDt = parseDateTime(s2, st2, false);
    const otherEndDt = parseDateTime(e2, et2, true);
    return reqStartDt < otherEndDt && reqEndDt > otherStartDt;
  };

  const startD = new Date(reqStartDt);
  startD.setHours(0,0,0,0);
  const endD = new Date(reqEndDt);
  endD.setHours(23,59,59,999);

  const conflicts = [];

  // 1. Check Tour Schedules
  const conflictingTours = await Tour.find({
    "schedules": {
      $elemMatch: {
        guide: guideId,
        status: { $in: ACTIVE_SCHEDULE_STATUSES },
        startDate: { $lte: endD },
        endDate: { $gte: startD }
      }
    }
  }).lean();

  for (const tour of conflictingTours) {
    for (const sch of tour.schedules) {
      if (sch.guide.toString() === guideId.toString() && ACTIVE_SCHEDULE_STATUSES.includes(sch.status)) {
        if (doOverlap(sch.startDate, sch.endDate, sch.startTime, sch.endTime)) {
          conflicts.push({
            source: "tour",
            scheduleId: sch._id,
            title: tour.title?.en || "Tour",
            startDate: sch.startDate,
            endDate: sch.endDate,
            status: sch.status,
            reason: `Assigned to Tour "${tour.title?.en || "Tour"}"`
          });
        }
      }
    }
  }

  // 2. Check Package Schedules
  const PackageSchedule = require("../models/PackageSchedule");
  const conflictingPackages = await PackageSchedule.find({
    assignedGuide: guideId,
    status: { $in: ACTIVE_SCHEDULE_STATUSES },
    startDate: { $lte: endD },
    endDate: { $gte: startD }
  }).populate("packageId", "name title").lean();

  for (const pkg of conflictingPackages) {
    if (doOverlap(pkg.startDate, pkg.endDate, pkg.startTime, pkg.endTime)) {
      const title = pkg.packageId?.title?.en || pkg.packageId?.name?.en || "Package";
      conflicts.push({
        source: "package",
        scheduleId: pkg._id,
        title,
        startDate: pkg.startDate,
        endDate: pkg.endDate,
        status: pkg.status,
        reason: `Assigned to Package "${title}"`
      });
    }
  }

  // 3. Check GuideTimeOff
  const GuideTimeOff = require("../models/GuideTimeOff");
  const conflictingTimeOffs = await GuideTimeOff.find({
    guide: guideId,
    status: "approved",
    startDate: { $lte: endD },
    endDate: { $gte: startD }
  }).lean();

  for (const t of conflictingTimeOffs) {
    if (doOverlap(t.startDate, t.endDate, null, null)) {
      conflicts.push({
        source: "timeoff",
        scheduleId: t._id,
        title: "Time Off",
        startDate: t.startDate,
        endDate: t.endDate,
        status: t.status,
        reason: `Approved Time Off: ${t.reason || "Not specified"}`
      });
    }
  }

  // 4. Check TourRequests
  const TourRequest = require("../models/TourRequest");
  const conflictingRequests = await TourRequest.find({
    assignedGuide: guideId,
    status: { $in: ["guide_pending", "awaiting_payment"] }
  }).populate("tourId", "title duration").lean();

  for (const req of conflictingRequests) {
    if (!req.preferredDate) continue;
    const reqStartDate = new Date(req.preferredDate);
    const reqEndDate = new Date(req.preferredDate);
    if (req.tourId && req.tourId.duration && req.tourId.duration.unit === "days") {
      reqEndDate.setDate(reqEndDate.getDate() + Math.max(0, req.tourId.duration.value - 1));
    }
    
    if (doOverlap(reqStartDate, reqEndDate, req.preferredTime, null)) {
      conflicts.push({
        source: "request",
        scheduleId: req._id,
        title: req.tourId?.title?.en || "Custom Request",
        startDate: reqStartDate,
        endDate: reqEndDate,
        status: req.status,
        reason: `Pending Custom Request Assignment: ${req.tourId?.title?.en || "Tour"}`
      });
    }
  }

  // 5. Check Guide Locks
  const GuideLock = require("../models/GuideLock");
  const locks = await GuideLock.find({ guideId }).lean();
  for (const lock of locks) {
    conflicts.push({
      source: "system_lock",
      scheduleId: lock._id,
      title: "System Lock",
      startDate: lock.createdAt,
      endDate: lock.createdAt,
      status: "locked",
      reason: "Guide is currently locked by another concurrent assignment process."
    });
  }

  return {
    available: conflicts.length === 0,
    conflicts
  };
};

const checkGuideAvailability = async (guideId, startDate, endDate, startTime, endTime, excludeScheduleId = null) => {
  const { available, conflicts } = await getGuideAvailabilityDebug(guideId, startDate, endDate, startTime, endTime);
  
  // Filter out system locks because checkGuideAvailability is called AFTER we create our own lock.
  const scheduleConflicts = conflicts.filter(c => c.source !== "system_lock");
  
  if (scheduleConflicts.length > 0) {
    // If excludeScheduleId is provided, ignore conflicts that match it
    const activeConflicts = excludeScheduleId 
      ? scheduleConflicts.filter(c => c.scheduleId.toString() !== excludeScheduleId.toString())
      : scheduleConflicts;

    if (activeConflicts.length > 0) {
      const first = activeConflicts[0];
      const err = new Error(`Conflict Detected: ${first.reason}`);
      err.statusCode = 409;
      throw err;
    }
  }
  return false;
};

/**
 * Find alternative guide slots when the requested window is fully booked.
 *
 * Phase 1 — ±3 days (priority: "near_requested_date"):
 *   Checks offsets [-1, +1, -2, +2, -3, +3] so the result closest to the
 *   traveler's preferred date is always tried first per guide.
 *
 * Phase 2 — +4…+14 days fallback (priority: "future_available"):
 *   Only reached if a guide has no free slot in Phase 1.
 *
 * Results are globally sorted by |dayOffset| so the admin sees the
 * nearest available dates first regardless of which guide is earlier.
 *
 * @param {string|Date} startDate  – The traveler's preferred start date
 * @param {string|Date} endDate    – The traveler's preferred end date
 * @param {string}      startTime  – e.g. "09:00 AM"
 * @param {string}      endTime    – e.g. "05:00 PM"
 * @returns {Array}  Up to 5 alternative slot objects, sorted by proximity
 */
const findAlternativeGuideSlots = async (startDate, endDate, startTime, endTime) => {
  const Guide = require("../models/Guide");

  const reqStart = new Date(startDate);
  const reqEnd   = new Date(endDate);
  const durationDays = Math.max(0, Math.round((reqEnd - reqStart) / (1000 * 60 * 60 * 24)));

  const guides = await Guide.find({ status: "approved", isVerified: true })
    .populate("user", "name profilePicture")
    .lean();

  // Phase 1 offsets: sorted by |offset| so -1/+1 are tried before -2/+2 etc.
  const nearOffsets = [-1, 1, -2, 2, -3, 3];
  // Phase 2 offsets: forward-only beyond the ±3 window
  const farOffsets  = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

  const MAX_ALTERNATIVES = 5;
  const alternatives = [];

  for (const guide of guides) {
    if (alternatives.length >= MAX_ALTERNATIVES) break;

    const guideUserId = guide.user._id.toString();
    let found = false;

    // ── Phase 1: ±3 days ──────────────────────────────────────────────────
    for (const offset of nearOffsets) {
      const testStart = new Date(reqStart);
      testStart.setDate(testStart.getDate() + offset);
      // Never test dates in the past
      if (testStart < new Date()) continue;

      const testEnd = new Date(testStart);
      testEnd.setDate(testEnd.getDate() + durationDays);

      try {
        await checkGuideAvailability(guideUserId, testStart, testEnd, startTime, endTime);
        alternatives.push({
          guideId:            guideUserId,
          guideName:          guide.user.name,
          guideProfilePicture: guide.user.profilePicture || null,
          startDate:  testStart.toISOString().split("T")[0],
          endDate:    testEnd.toISOString().split("T")[0],
          startTime,
          endTime,
          priority:   "near_requested_date",
          dayOffset:  offset,
        });
        found = true;
        break;
      } catch (_) { /* slot busy, try next offset */ }
    }

    // ── Phase 2: +4…+14 days ──────────────────────────────────────────────
    if (!found) {
      for (const offset of farOffsets) {
        const testStart = new Date(reqStart);
        testStart.setDate(testStart.getDate() + offset);
        const testEnd = new Date(testStart);
        testEnd.setDate(testEnd.getDate() + durationDays);

        try {
          await checkGuideAvailability(guideUserId, testStart, testEnd, startTime, endTime);
          alternatives.push({
            guideId:            guideUserId,
            guideName:          guide.user.name,
            guideProfilePicture: guide.user.profilePicture || null,
            startDate:  testStart.toISOString().split("T")[0],
            endDate:    testEnd.toISOString().split("T")[0],
            startTime,
            endTime,
            priority:   "future_available",
            dayOffset:  offset,
          });
          found = true;
          break;
        } catch (_) { /* slot busy, try next */ }
      }
    }
  }

  // Sort globally: nearest day offset first (Phase 1 results naturally surface first)
  alternatives.sort((a, b) => Math.abs(a.dayOffset) - Math.abs(b.dayOffset));

  return alternatives;
};

module.exports = { cancelScheduleWithBookings, checkGuideAvailability, getGuideAvailabilityDebug, findAlternativeGuideSlots, lockGuide, unlockGuide };

