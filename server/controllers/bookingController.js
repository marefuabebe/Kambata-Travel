const Booking = require("../models/Booking");
const BookingRequest = require("../models/BookingRequest");
const Transaction = require("../models/Transaction");
const Tour = require("../models/Tour");
const { promoteNextInWaitlist, updateRemainingSlots } = require("../services/bookingService");
const { sendNotification } = require("../services/notificationService");
const {
  assertInstantBookingAllowed,
  validateScheduleForBooking,
  getGuideScheduleIds,
} = require("../services/tourBookingRules");
const { cancelScheduleWithBookings } = require("../services/scheduleService");
const logger = require("../utils/logger");
const { initializePayment } = require("../services/paymentService");


// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (User)
const createBooking = async (req, res, next) => {
  try {
    const { tourId, scheduleId, numPeople, specialRequests, requestId } = req.body;

    const tour = await Tour.findById(tourId);
    if (!tour || !tour.isPublished) {
      res.status(404);
      throw new Error("This tour is no longer available for booking");
    }

    // Request-based payment flow (TourRequest awaiting_payment)
    if (requestId) {
      const TourRequest = require("../models/TourRequest");
      const { initiateRequestPayment } = require("../services/requestPaymentService");
      const tourRequest = await TourRequest.findById(requestId);
      if (!tourRequest || tourRequest.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error("Invalid request for payment");
      }
      const result = await initiateRequestPayment(tourRequest, req.user, {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });
      return res.status(201).json({
        success: true,
        message: "Payment initiated for custom request.",
        data: result.booking,
        checkoutUrl: result.checkoutUrl,
      });
    }

    if (!scheduleId) {
      res.status(400);
      throw new Error("Schedule ID is required for instant bookings");
    }

    const schedule = tour.schedules.id(scheduleId);

    const acceptedCustomRequest =
      tour.bookingType === "request"
        ? await BookingRequest.findOne({
            tour: tourId,
            traveler: req.user._id,
            status: "accepted",
            acceptedScheduleId: scheduleId,
          })
        : null;

    if (tour.bookingType === "request" && !acceptedCustomRequest) {
      // Also allow TourRequest flow
      const TourRequest = require("../models/TourRequest");
      const linkedRequest = schedule?.linkedRequestId
        ? await TourRequest.findOne({ _id: schedule.linkedRequestId, user: req.user._id, status: "awaiting_payment" })
        : null;
      if (!linkedRequest && !acceptedCustomRequest) {
        res.status(403);
        throw new Error(
          "This tour requires a custom date request. Ask the guide to accept your date before payment."
        );
      }
    }

    if (tour.bookingType === "instant") {
      try {
        assertInstantBookingAllowed(tour);
      } catch (e) {
        res.status(403);
        throw e;
      }
    }
    try {
      await validateScheduleForBooking(tour, schedule);
    } catch (e) {
      res.status(e.statusCode || 400);
      throw e;
    }

    // 2. Capacity Guard: Single booking cannot exceed total tour capacity
    if (numPeople > tour.maxCapacity) {
      res.status(400);
      throw new Error(`Single booking cannot exceed the tour's maximum capacity (${tour.maxCapacity} people)`);
    }

    // 3. Restriction: One active booking per user per slot
    let booking = await Booking.findOne({
      user: req.user._id,
      tour: tourId,
      scheduleId: scheduleId,
      status: { $in: ["pending", "confirmed", "waitlisted", "invited"] },
    });

    let status = "pending";
    const totalPrice = tour.price * numPeople;
    let paymentExpiresAt;
    let slotsReserved = false;

    if (booking) {
      if (booking.status === "confirmed" || booking.paymentStatus === "paid") {
        res.status(400);
        throw new Error("You already have a confirmed booking for this slot");
      }
      
      // Reuse existing pending booking
      // Adjust slots if numPeople changed
      if (booking.slotsReserved) {
        // Release old slots in DB
        await updateRemainingSlots(tourId, scheduleId, booking.numPeople);
        // Also update the in-memory schedule so the check below works!
        schedule.remainingSlots += booking.numPeople;
      }
      
      if (schedule.remainingSlots < numPeople) {
        status = "waitlisted";
        booking.slotsReserved = false;
        slotsReserved = false;
        booking.paymentExpiresAt = undefined;
      } else {
        status = "pending";
        booking.slotsReserved = true;
        slotsReserved = true;
        booking.paymentExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
        await updateRemainingSlots(tourId, scheduleId, -numPeople);
      }

      booking.numPeople = numPeople;
      booking.totalPrice = totalPrice;
      booking.status = status;
      booking.specialRequests = specialRequests || undefined;
      // Generate a new tx_ref to prevent Chapa from rejecting duplicate references
      booking.tx_ref = `KB-TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await booking.save();

    } else {
      if (schedule.remainingSlots < numPeople) {
        status = "waitlisted";
        logger.info(`User ${req.user.email} joined waitlist for tour ${tourId}`);
      } else {
        status = "pending";
        paymentExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
        await updateRemainingSlots(tourId, scheduleId, -numPeople);
        slotsReserved = true;
      }

      const tx_ref = `KB-TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      booking = await Booking.create({
        tour: tourId,
        user: req.user._id,
        scheduleId,
        guide: schedule.guide,
        numPeople,
        totalPrice,
        status,
        tx_ref,
        paymentExpiresAt,
        slotsReserved,
        specialRequests: specialRequests || undefined,
      });
    }
      // NOTE: Chat room is intentionally NOT created here.
      // It will be created in confirmPaidBooking() after payment succeeds
      // (triggered by webhook). Creating a chat room before payment would
      // result in orphaned rooms for abandoned bookings.
    

    let checkoutUrl = null;
    if (status === "pending" && slotsReserved) {
      try {
        const paymentResponse = await initializePayment(booking, req.user);
        if (paymentResponse.status === "success") {
          checkoutUrl = paymentResponse.data.checkout_url;

          // ── Create Transaction record so webhook can find it by tx_ref ──
          // This MUST happen after initializePayment confirms Chapa accepted the request.
          await Transaction.create({
            booking: booking._id,
            user: req.user._id,
            amount: booking.totalPrice,
            tx_ref: booking.tx_ref,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
          });
        }
      } catch (error) {
        // Log the error but keep the booking record so user can retry payment
        logger.error(`Failed to initialize Chapa for booking ${booking._id}: ${error.message}`);
      }
    }


    res.status(201).json({
      success: true,
      message: status === "waitlisted" ? "You've been added to the waitlist." : "Booking initiated.",
      data: booking,
      checkoutUrl // Frontend will redirect here if present
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status (Confirm/Reject/Cancel)
// @route   PATCH /api/bookings/:id/status
// @access  Private (Dynamic RBAC: Admin, Guide, User)
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id).populate("tour");

    if (!booking) {
      res.status(404);
      throw new Error("Booking not found");
    }

    const schedule = booking.tour.schedules.id(booking.scheduleId);
    if (!schedule) {
      res.status(404);
      throw new Error("Schedule not found in the associated tour.");
    }

    // --- Dynamic RBAC ---
    if (status === "cancelled") {
      // Only the user who made the booking can cancel it
      if (booking.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        res.status(403);
        throw new Error("You are not authorized to cancel this booking");
      }
    } else if (status === "confirmed" || status === "rejected") {
      if (booking.tour.bookingType === "instant") {
        res.status(400);
        throw new Error(
          "Instant bookings are confirmed automatically after payment. Use the payment flow instead of manual approval."
        );
      }
      // Only the assigned guide or an admin can accept/reject (request-type legacy path)
      if (schedule.guide.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        res.status(403);
        throw new Error("You are not authorized to accept or reject this booking");
      }
    } else {
      res.status(400);
      throw new Error("Invalid status update requested");
    }

    const oldStatus = booking.status;

    // --- Concurrency / Integrity Checks ---
    if (oldStatus === "completed") {
      res.status(400);
      throw new Error("Cannot modify a completed booking");
    }
    
    if (oldStatus === status) {
      res.status(400);
      throw new Error(`Booking is already ${status}`);
    }

    if (oldStatus === "cancelled" && status !== "cancelled") {
      res.status(400);
      throw new Error("Cannot modify a cancelled booking");
    }

    // --- State Transitions ---

    // 1. Confirming a pending request (Guide Approval)
    if (oldStatus === "pending" && status === "confirmed") {
      if (schedule.remainingSlots < booking.numPeople) {
        res.status(400);
        throw new Error("No capacity available to approve this booking");
      }

      await updateRemainingSlots(booking.tour._id, booking.scheduleId, -booking.numPeople);
      booking.paymentExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await sendNotification(booking.user, {
        type: "booking",
        priority: "HIGH",
        message: `Your booking for ${booking.tour.title} has been approved! You have 30 minutes to complete the payment.`,
        referenceId: booking._id,
      });
      logger.info(`Booking ${booking._id} confirmed by Guide ${req.user._id}`);
    }

    // 2. Rejecting a booking (Guide Rejection)
    if (status === "rejected") {
      if (oldStatus === "confirmed") {
        await updateRemainingSlots(booking.tour._id, booking.scheduleId, booking.numPeople);
        await promoteNextInWaitlist(booking.tour._id, booking.scheduleId);
      }

      await sendNotification(booking.user, {
        type: "booking",
        priority: "NORMAL",
        message: `Your booking request for ${booking.tour.title} has been rejected.`,
        referenceId: booking._id,
      });
      logger.info(`Booking ${booking._id} rejected by Guide ${req.user._id}`);
    }

    // 3. Canceling a booking (User Cancellation)
    if (status === "cancelled") {
      const startTime = new Date(schedule.startDate);
      const timeToTour = startTime.getTime() - Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (timeToTour < twentyFourHours && oldStatus === "confirmed") {
        res.status(400);
        throw new Error("Cannot cancel a confirmed booking within 24 hours of start time");
      }

      if (oldStatus === "confirmed") {
        await updateRemainingSlots(booking.tour._id, booking.scheduleId, booking.numPeople);
        await promoteNextInWaitlist(booking.tour._id, booking.scheduleId);
      }
      
      if (schedule.guide) {
        await sendNotification(schedule.guide, {
          type: "booking",
          priority: "NORMAL",
          message: `A booking for ${booking.tour.title} has been cancelled by the traveler.`,
          referenceId: booking._id,
        });
      }
      logger.info(`Booking ${booking._id} cancelled by User ${req.user._id}`);
    }

    booking.status = status;
    booking.updatedBy = req.user._id;
    await booking.save();

    res.json({
      success: true,
      message: `Booking successfully ${status}`,
      data: booking
    });
  } catch (error) {
    logger.error(`Error updating booking status: ${error.message}`);
    next(error);
  }
};

// @desc    Claim an invited waitlist spot
// @route   PUT /api/bookings/:id/claim
// @access  Private (User)
const claimWaitlistSpot = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("tour");

    if (!booking || booking.status !== "invited") {
      res.status(400);
      throw new Error("You do not have an active invitation to claim");
    }

    if (booking.invitationExpiresAt < Date.now()) {
      booking.status = "rejected"; // Expired
      await booking.save();
      await promoteNextInWaitlist(booking.tour._id, booking.scheduleId);
      res.status(400);
      throw new Error("Your invitation has expired");
    }

    // Double check capacity just in case
    const tour = await Tour.findById(booking.tour._id);
    const schedule = tour.schedules.id(booking.scheduleId);

    if (schedule.remainingSlots < booking.numPeople) {
      // This should theoretically not happen if promotion logic is right, 
      // but good for safety.
      res.status(400);
      throw new Error("Temporary system error: slots no longer available");
    }

    await updateRemainingSlots(booking.tour._id, booking.scheduleId, -booking.numPeople);
    booking.status = "confirmed";
    booking.invitationExpiresAt = undefined;
    
    await booking.save();

    // SEND NOTIFICATION
    await sendNotification(booking.user, {
      type: "booking",
      priority: "HIGH",
      message: `You have successfully claimed your spot for ${booking.tour.title}!`,
      referenceId: booking._id,
    });
    res.json({ message: "Spot claimed successfully!", booking });
  } catch (error) {
    next(error);
  }
};


// @desc    Get booking price estimate
// @route   GET /api/bookings/estimate
// @access  Private (User)
const getBookingEstimate = async (req, res, next) => {
  try {
    const { tourId, numPeople } = req.query;

    if (!tourId || !numPeople) {
      res.status(400);
      throw new Error("Please provide tourId and numPeople");
    }

    const tour = await Tour.findById(tourId).select("price").lean();
    if (!tour) {
      res.status(404);
      throw new Error("Tour not found");
    }

    const basePrice = tour.price;
    const totalPrice = basePrice * parseInt(numPeople);

    res.json({
      success: true,
      data: {
        tourId,
        basePrice,
        numPeople: parseInt(numPeople),
        totalPrice,
        currency: "ETB"
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bookings for the logged-in guide's tours
// @route   GET /api/bookings/guide/my-bookings
// @access  Private (Guide)
const getGuideBookings = async (req, res, next) => {
  try {
    const guideScheduleIds = await getGuideScheduleIds(req.user._id);

    const bookings = await Booking.find({
      $or: [
        { guide: req.user._id },
        { scheduleId: { $in: guideScheduleIds } },
      ],
    })
      .populate("tour", "title images destination bookingType")
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user's bookings (Traveler/Explorer)
// @route   GET /api/bookings/my-bookings
// @access  Private (User)
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ 
      user: req.user._id,
      $or: [
        { bookingSource: { $ne: "request" } },
        { status: { $ne: "pending" } }
      ]
    })
      .populate({
        path: "tour",
        select: "title destination images duration category schedules bookingType",
        populate: { path: "destination", select: "name" },
      })
      .populate("guide", "name profilePicture email")
      .sort({ createdAt: -1 })
      .lean();

    const enriched = bookings.map((b) => {
      const schedule = b.tour?.schedules?.find(
        (s) => s._id?.toString() === b.scheduleId?.toString()
      );
      return {
        ...b,
        scheduleStartDate: schedule?.startDate,
        scheduleEndDate: schedule?.endDate,
      };
    });

    res.json({
      success: true,
      count: enriched.length,
      data: enriched,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Guide or Admin marks traveler attendance
// @route   PATCH /api/bookings/:id/attendance
// @access  Private (Guide, Admin)
const markAttendance = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    if (!["pending", "present", "absent", "late"].includes(status)) {
      res.status(400);
      throw new Error("Invalid attendance status");
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      throw new Error("Booking not found");
    }

    // Security Check
    if (booking.guide.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      res.status(403);
      throw new Error("You are not authorized to mark attendance for this booking");
    }

    booking.attendanceStatus = status;
    await booking.save();

    res.json({
      success: true,
      message: `Attendance marked as ${status}`,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Traveler confirms tour completion
// @route   POST /api/bookings/:id/confirm-completion
// @access  Private (User)
const confirmCompletion = async (req, res, next) => {
  const { clearGuideEarnings } = require("../services/walletService");
  const IncidentReport = require("../models/IncidentReport");

  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      throw new Error("Booking not found");
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You are not authorized to confirm this booking");
    }

    if (booking.payoutStatus !== "pending_clearance") {
      res.status(400);
      throw new Error("Booking is not pending clearance or has already been cleared");
    }

    // Check for active disputes via IncidentReport or booking flag
    const activeDisputes = await IncidentReport.countDocuments({
      scheduleId: booking.scheduleId,
      status: { $in: ["open", "under_review"] }
    });

    if (activeDisputes > 0 || booking.hasDispute) {
      res.status(400);
      throw new Error("Cannot confirm completion while there are active disputes.");
    }

    await clearGuideEarnings(booking._id);

    // Audit Log for Traveler Confirmation
    const AuditLog = require("../models/AuditLog");
    await AuditLog.create([{
      action: "TRAVELER_CONFIRMED",
      targetType: "Booking",
      targetId: booking._id,
      actor: req.user._id,
      metadata: { amount: booking.totalPrice }
    }]);

    res.json({
      success: true,
      message: "Tour completion confirmed. Guide earnings released.",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Traveler opens a dispute for a booking
// @route   POST /api/bookings/:id/dispute
// @access  Private (User)
const openDispute = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      throw new Error("Booking not found");
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error("You are not authorized to dispute this booking");
    }

    if (booking.status !== "completed" && booking.status !== "confirmed") {
      res.status(400);
      throw new Error("Only confirmed or completed bookings can be disputed.");
    }

    if (booking.hasDispute) {
      res.status(400);
      throw new Error("A dispute is already open for this booking.");
    }

    booking.hasDispute = true;
    await booking.save();

    // Audit Log for Dispute
    const AuditLog = require("../models/AuditLog");
    await AuditLog.create([{
      action: "DISPUTE_CREATED",
      targetType: "Booking",
      targetId: booking._id,
      actor: req.user._id,
      metadata: { reason: req.body.reason || "Traveler opened dispute" }
    }]);

    res.json({
      success: true,
      message: "Dispute opened successfully. Admin will review your case.",
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  updateBookingStatus,
  claimWaitlistSpot,
  getBookingEstimate,
  getGuideBookings,
  getMyBookings,
  markAttendance,
  confirmCompletion,
  openDispute,
};
