const Tour = require("../models/Tour");
const Package = require("../models/Package");
const TourRequest = require("../models/TourRequest");
const Booking = require("../models/Booking");
const PackageBooking = require("../models/PackageBooking");
const PackageSchedule = require("../models/PackageSchedule");
const Transaction = require("../models/Transaction");
const { initializePayment } = require("./paymentService");
const { logRequestEvent } = require("./requestAuditService");
const { PAYMENT_WINDOW_MS } = require("./guideReservationService");
const logger = require("../utils/logger");

/**
 * Creates a private schedule on the tour/package after successful payment (not before).
 * Idempotent: will not create duplicate schedules if one is already assigned to the request.
 */
const createPrivateScheduleForRequest = async (request, session = null) => {
  // If schedule is already created and assigned, return it (idempotency)
  if (request.assignedSchedule) {
    if (request.tourId) {
      const tour = await Tour.findById(request.tourId).session(session || null);
      const schedule = tour?.schedules.id(request.assignedSchedule);
      if (schedule) return schedule;
    } else if (request.packageId) {
      const pkgSchedule = await PackageSchedule.findById(request.assignedSchedule).session(session || null);
      if (pkgSchedule) return pkgSchedule;
    }
  }

  if (request.tourId) {
    const tour = await Tour.findById(request.tourId).session(session || null);
    if (!tour) throw new Error("Associated tour not found");

    const duration = tour.durationInHours || 8;
    const startDate = new Date(request.preferredDate);
    const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000);

    const newSchedule = {
      guide: request.assignedGuide,
      startDate,
      endDate,
      startTime: request.preferredTime || "09:00 AM",
      endTime: "05:00 PM",
      meetingPoint: tour.meetingPoint?.en || "TBD",
      priceOverride: request.customPrice || undefined,
      remainingSlots: request.travelers,
      status: "published",
      scheduleType: "private",
      requestedBy: request.user,
      linkedRequestId: request._id,
      assignmentStatus: "accepted",
    };

    const updatedTour = await Tour.findByIdAndUpdate(
      request.tourId,
      { $push: { schedules: newSchedule } },
      { new: true, runValidators: false, session: session || undefined }
    );

    const schedule = updatedTour.schedules[updatedTour.schedules.length - 1];
    request.assignedSchedule = schedule._id;
    await request.save(session ? { session } : undefined);

    return schedule;
  } else if (request.packageId) {
    const pkg = await Package.findById(request.packageId).session(session || null);
    if (!pkg) throw new Error("Associated package not found");

    const durationDays = pkg.duration?.value || 1;
    const startDate = new Date(request.preferredDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays - 1);

    const newSchedule = {
      packageId: request.packageId,
      startDate,
      endDate,
      startTime: request.preferredTime || "09:00 AM",
      endTime: "05:00 PM",
      meetingPoint: "TBD",
      priceOverride: request.customPrice || undefined,
      specialNotes: request.notes,
      capacity: request.travelers,
      availableSeats: request.travelers,
      assignedGuide: request.assignedGuide,
      status: "published",
      scheduleType: "private",
      requestedBy: request.user,
      linkedRequestId: request._id,
    };

    const schedule = await PackageSchedule.create([newSchedule], { session: session || undefined });
    request.assignedSchedule = schedule[0]._id;
    await request.save(session ? { session } : undefined);

    return schedule[0];
  } else {
    throw new Error("Request must have either a tour or a package");
  }
};

/**
 * Initiate payment for an awaiting_payment TourRequest (no schedule exists yet).
 */
const initiateRequestPayment = async (request, user, reqMeta = {}) => {
  if (request.status !== "awaiting_payment") {
    const err = new Error("Request is not awaiting payment");
    err.statusCode = 400;
    throw err;
  }
  if (request.user.toString() !== user._id.toString()) {
    const err = new Error("Not authorized to pay for this request");
    err.statusCode = 403;
    throw err;
  }
  if (request.paymentExpiresAt && new Date() > request.paymentExpiresAt) {
    const err = new Error("Payment window has expired. Please contact support.");
    err.statusCode = 400;
    throw err;
  }

  let item = null;
  let totalPrice = 0;
  
  if (request.tourId) {
    item = await Tour.findById(request.tourId);
    if (!item) throw new Error("Tour not found");
    totalPrice = request.finalPrice || (request.customPrice ? request.customPrice * request.travelers : item.price * request.travelers);
  } else if (request.packageId) {
    item = await Package.findById(request.packageId);
    if (!item) throw new Error("Package not found");
    totalPrice = request.finalPrice || (request.customPrice ? request.customPrice * request.travelers : item.basePrice * request.travelers);
  } else {
    throw new Error("Request must have either a tourId or packageId");
  }

  const tx_ref = `KB-RQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  let booking;

  if (request.tourId) {
    booking = await Booking.findOne({
      linkedRequestId: request._id,
      user: user._id,
      status: { $in: ["pending", "confirmed"] },
    });

    if (booking) {
      if (booking.paymentStatus === "paid") {
        const err = new Error("This request has already been paid");
        err.statusCode = 400;
        throw err;
      }
      booking.totalPrice = totalPrice;
      booking.numPeople = request.travelers;
      booking.tx_ref = tx_ref;
      booking.paymentExpiresAt = request.paymentExpiresAt || new Date(Date.now() + PAYMENT_WINDOW_MS);
      await booking.save();
    } else {
      booking = await Booking.create({
        tour: request.tourId,
        user: user._id,
        scheduleId: request.assignedSchedule || undefined,
        bookingSource: "request",
        linkedRequestId: request._id,
        guide: request.assignedGuide,
        numPeople: request.travelers,
        totalPrice,
        status: "pending",
        tx_ref,
        paymentExpiresAt: request.paymentExpiresAt || new Date(Date.now() + PAYMENT_WINDOW_MS),
        slotsReserved: false,
      });
    }
  } else if (request.packageId) {
    booking = await PackageBooking.findOne({
      linkedRequestId: request._id,
      user: user._id,
      bookingStatus: { $in: ["pending", "confirmed"] },
    });

    if (booking) {
      if (booking.paymentStatus === "paid") {
        const err = new Error("This request has already been paid");
        err.statusCode = 400;
        throw err;
      }
      booking.totalPrice = totalPrice;
      booking.travelersCount = request.travelers;
      booking.tx_ref = tx_ref;
      booking.paymentExpiresAt = request.paymentExpiresAt || new Date(Date.now() + PAYMENT_WINDOW_MS);
      await booking.save();
    } else {
      booking = await PackageBooking.create({
        packageId: request.packageId,
        user: user._id,
        packageScheduleId: request.assignedSchedule || undefined,
        bookingSource: "request",
        linkedRequestId: request._id,
        travelersCount: request.travelers,
        roomsBooked: Math.ceil(request.travelers / 2),
        totalPrice,
        bookingStatus: "pending",
        tx_ref,
        paymentExpiresAt: request.paymentExpiresAt || new Date(Date.now() + PAYMENT_WINDOW_MS),
      });
    }
  }

  let checkoutUrl = null;
  try {
    const paymentResponse = await initializePayment(booking, user);
    if (paymentResponse.status === "success") {
      checkoutUrl = paymentResponse.data.checkout_url;
      await Transaction.create({
        booking: booking._id,
        user: user._id,
        amount: booking.totalPrice,
        tx_ref: booking.tx_ref,
        ipAddress: reqMeta.ip,
        userAgent: reqMeta.userAgent,
      });
    }
  } catch (error) {
    logger.error(`Request payment init failed for ${request._id}: ${error.message}`);
    throw error;
  }

  await logRequestEvent({
    requestId: request._id,
    userId: user._id,
    role: "traveler",
    event: "PAYMENT_LINK_SENT",
    ipAddress: reqMeta.ip,
    metadata: { bookingId: booking._id, totalPrice },
  });

  return { booking, checkoutUrl };
};

module.exports = {
  createPrivateScheduleForRequest,
  initiateRequestPayment,
};
