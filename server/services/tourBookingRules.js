const User = require("../models/User");

const LEAD_TIME_MS = 2 * 60 * 60 * 1000;

/**
 * Instant = pay on live schedule → auto-confirm after payment.
 * Request = custom date inquiry; no direct POST /bookings.
 */
const assertInstantBookingAllowed = (tour) => {
  if (tour.bookingType === "request") {
    const err = new Error(
      "This tour uses custom date requests. Submit a date request and wait for guide approval before payment."
    );
    err.statusCode = 403;
    throw err;
  }
};

const assertRequestBookingAllowed = (tour) => {
  if (tour.bookingType === "instant") {
    const err = new Error(
      "This tour supports instant booking on published schedules. Choose an available date and pay to confirm."
    );
    err.statusCode = 400;
    throw err;
  }
};

const canInstantBookTour = (tour, hasLiveSchedule) =>
  (tour.bookingType === "instant" || tour.bookingType === "both") && hasLiveSchedule;

const canRequestDateTour = (tour, hasLiveSchedule) =>
  tour.bookingType === "request" ||
  tour.bookingType === "both" ||
  !hasLiveSchedule;

const validateScheduleForBooking = async (tour, schedule) => {
  if (!schedule) {
    const err = new Error("Schedule not found");
    err.statusCode = 404;
    throw err;
  }

  const now = new Date();
  if (schedule.scheduleType !== "private" && new Date(schedule.startDate).getTime() - now.getTime() < LEAD_TIME_MS) {
    const err = new Error("Bookings must be made at least 2 hours before the tour starts");
    err.statusCode = 400;
    throw err;
  }

  if (!schedule.guide) {
    const err = new Error("This schedule has no assigned guide");
    err.statusCode = 400;
    throw err;
  }

  const guideUser = await User.findById(schedule.guide).select(
    "role guideStatus schedulingDisabled isBlocked suspendedUntil"
  );

  if (!guideUser || guideUser.role !== "guide") {
    const err = new Error("Assigned guide is not available");
    err.statusCode = 400;
    throw err;
  }

  if (guideUser.guideStatus !== "approved") {
    const err = new Error("This schedule's guide is not approved for bookings");
    err.statusCode = 400;
    throw err;
  }

  if (guideUser.schedulingDisabled) {
    const err = new Error("This guide's scheduling privileges are currently suspended");
    err.statusCode = 400;
    throw err;
  }

  if (
    guideUser.isBlocked ||
    (guideUser.suspendedUntil && guideUser.suspendedUntil > Date.now())
  ) {
    const err = new Error("This guide is temporarily unavailable");
    err.statusCode = 400;
    throw err;
  }

  return guideUser;
};

const validateGuideForRequest = async (guideId) => {
  const guideUser = await User.findById(guideId).select(
    "role guideStatus schedulingDisabled isBlocked suspendedUntil name"
  );

  if (!guideUser || guideUser.role !== "guide") {
    const err = new Error("Selected guide is not valid");
    err.statusCode = 400;
    throw err;
  }

  if (guideUser.guideStatus !== "approved") {
    const err = new Error("Selected guide is not approved for custom requests");
    err.statusCode = 400;
    throw err;
  }

  if (guideUser.schedulingDisabled) {
    const err = new Error("This guide is not accepting new requests at this time");
    err.statusCode = 400;
    throw err;
  }

  return guideUser;
};

/** Filter schedules shown to travelers (future, capacity, approved guides, privacy rules). */
const filterBookableSchedules = async (schedules = [], user = null) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const guideIds = [
    ...new Set(
      schedules.map((s) => (s.guide?._id || s.guide)?.toString()).filter(Boolean)
    ),
  ];

  const approvedGuides = await User.find({
    _id: { $in: guideIds },
    role: "guide",
    guideStatus: "approved",
    schedulingDisabled: { $ne: true },
    isBlocked: { $ne: true },
  }).select("_id");

  const approvedSet = new Set(approvedGuides.map((g) => g._id.toString()));

  return schedules.filter((s) => {
    const gid = (s.guide?._id || s.guide)?.toString();
    const isPrivate = s.scheduleType === "private";
    const canSeePrivate = user && (user.role === "admin" || (s.requestedBy && user._id.toString() === s.requestedBy.toString()));

    return (
      gid &&
      approvedSet.has(gid) &&
      s.status === "published" &&
      new Date(s.startDate) >= now &&
      (s.remainingSlots ?? 0) > 0 &&
      (!isPrivate || canSeePrivate)
    );
  });
};

const getGuideScheduleIds = async (guideId) => {
  const Tour = require("../models/Tour");
  const tours = await Tour.find({ "schedules.guide": guideId }).select("schedules");
  const ids = [];
  tours.forEach((t) => {
    t.schedules.forEach((s) => {
      if (s.guide && s.guide.toString() === guideId.toString()) {
        ids.push(s._id);
      }
    });
  });
  return ids;
};

module.exports = {
  assertInstantBookingAllowed,
  assertRequestBookingAllowed,
  canInstantBookTour,
  canRequestDateTour,
  validateScheduleForBooking,
  validateGuideForRequest,
  filterBookableSchedules,
  getGuideScheduleIds,
};
