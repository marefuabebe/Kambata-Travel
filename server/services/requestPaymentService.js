const Tour = require("../models/Tour");
const TourRequest = require("../models/TourRequest");
const Booking = require("../models/Booking");
const Transaction = require("../models/Transaction");
const { initializePayment } = require("./paymentService");
const { logRequestEvent } = require("./requestAuditService");
const { PAYMENT_WINDOW_MS } = require("./guideReservationService");
const logger = require("../utils/logger");

/**
 * Creates a private schedule on the tour after successful payment (not before).
 */
const createPrivateScheduleForRequest = async (request, session = null) => {
  const tour = await Tour.findById(request.tourId).session(session || null);
  if (!tour) throw new Error("Associated tour not found");

  const duration = tour.durationInHours || 8;
  const startDate = new Date(request.preferredDate);
  const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000);
  const pricePerPerson = request.finalPrice
    ? request.finalPrice / request.travelers
    : request.customPrice || tour.price;

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

  const tour = await Tour.findById(request.tourId);
  if (!tour) throw new Error("Tour not found");

  const totalPrice = request.finalPrice
    || (request.customPrice ? request.customPrice * request.travelers : tour.price * request.travelers);

  let booking = await Booking.findOne({
    linkedRequestId: request._id,
    user: user._id,
    status: { $in: ["pending", "confirmed"] },
  });

  const tx_ref = `KB-RQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

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
