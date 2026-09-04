/**
 * bookingConfirmService.js
 *
 * ENTERPRISE ARCHITECTURE — Two-phase booking confirmation.
 *
 * Phase 1 — confirmPaidBookingCore()
 *   Database-only operations that run INSIDE a MongoDB session.
 *   Handles: slot decrement, status transition, chat room, guide assignment.
 *   FORBIDDEN: any network call, email, notification, analytics.
 *
 * Phase 2 — runBookingPostProcessing()
 *   All non-critical side effects run AFTER commit via Promise.allSettled().
 *   Handles: invoice PDF, email, notifications, recommendation engine.
 *   Rule: failure here NEVER rolls back the payment.
 *
 * Legacy shim — confirmPaidBooking()
 *   Kept for backward-compat with verifyPaymentStatus fallback path.
 *   Internally calls both phases in sequence (no session — verify is not
 *   within a concurrent session anyway).
 */

"use strict";

const Tour = require("../models/Tour");
const { updateRemainingSlots, promoteNextInWaitlist } = require("./bookingService");
const { sendNotification } = require("./notificationService");
const { ensureChatRoomForBooking } = require("./chatService");
const { generateInvoicePdf } = require("./invoicePdfService");
const { recordAction } = require("./auditService");
const { sendEmail } = require("../utils/mailService");
const { buildPremiumEmail } = require("../utils/emailTemplateBuilder");
const logger = require("../utils/logger");

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1 — TRANSACTIONAL CORE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * confirmPaidBookingCore(booking, session)
 *
 * Executes ALL business-critical database state changes.
 * Must be called INSIDE an active MongoDB session.
 *
 * Idempotency: safe to call multiple times — all operations are guarded.
 *
 * Returns: { committed: boolean, tourDoc, scheduleDoc }
 *   committed = false means the booking was already in a paid state (no-op).
 */
const confirmPaidBookingCore = async (booking, session) => {
  // ── Idempotency guard ────────────────────────────────────────────────────
  // If both flags are already set, this function was already called for this
  // booking (double webhook, retry, or verify-path race). Do nothing.
  if (booking.paymentStatus === "paid" && booking.slotsReserved) {
    logger.info(`confirmPaidBookingCore: Booking ${booking._id} already fully committed — no-op.`);
    return { committed: false, tourDoc: null, scheduleDoc: null };
  }

  const sessionOpts = session ? { session } : {};

  // ── Load tour/package + schedule ─────────────────────────────────────────────────
  let tour = null;
  let schedule = null;
  const isPackage = !!booking.packageId;

  if (isPackage) {
    const Package = require("../models/Package");
    const PackageSchedule = require("../models/PackageSchedule");
    tour = await Package.findById(booking.packageId).session(session || null);
    if (!tour) {
      logger.warn(`confirmPaidBookingCore: Package ${booking.packageId} not found for booking ${booking._id}.`);
      return { committed: false, tourDoc: null, scheduleDoc: null };
    }
    if (booking.packageScheduleId) {
      schedule = await PackageSchedule.findById(booking.packageScheduleId).session(session || null);
    }

    if (!schedule && booking.linkedRequestId && booking.bookingSource === "request") {
      const TourRequest = require("../models/TourRequest");
      const { createPrivateScheduleForRequest } = require("./requestPaymentService");
      const tourRequest = await TourRequest.findById(booking.linkedRequestId).session(session || null);
      if (tourRequest && tourRequest.status === "awaiting_payment") {
        schedule = await createPrivateScheduleForRequest(tourRequest, session);
        booking.packageScheduleId = schedule._id;
        booking.guide = schedule.assignedGuide;
      }
    }

    if (!schedule) {
      logger.warn(`confirmPaidBookingCore: PackageSchedule ${booking.packageScheduleId} not found.`);
      return { committed: false, tourDoc: tour, scheduleDoc: null };
    }
  } else {
    tour = await Tour.findById(booking.tour).session(session || null);
    if (!tour) {
      logger.warn(`confirmPaidBookingCore: Tour ${booking.tour} not found for booking ${booking._id}.`);
      return { committed: false, tourDoc: null, scheduleDoc: null };
    }

    if (booking.scheduleId) {
      schedule = tour.schedules.id(booking.scheduleId);
    }

    // Request-flow: create private schedule only after successful payment
    if (!schedule && booking.linkedRequestId && booking.bookingSource === "request") {
      const TourRequest = require("../models/TourRequest");
      const { createPrivateScheduleForRequest } = require("./requestPaymentService");
      const tourRequest = await TourRequest.findById(booking.linkedRequestId).session(session || null);
      if (tourRequest && tourRequest.status === "awaiting_payment") {
        schedule = await createPrivateScheduleForRequest(tourRequest, session);
        booking.scheduleId = schedule._id;
        booking.guide = schedule.guide;
        tour = await Tour.findById(booking.tour).session(session || null);
      }
    }

    if (!schedule) {
      logger.warn(`confirmPaidBookingCore: Schedule ${booking.scheduleId} not found in tour ${tour._id}.`);
      return { committed: false, tourDoc: tour, scheduleDoc: null };
    }
  }

  // ── 1. Status transitions ─────────────────────────────────────────────────
  if (booking.paymentStatus !== "paid") {
    booking.paymentStatus = "paid";
    booking.paymentDate = booking.paymentDate || new Date();
    booking.paymentExpiresAt = undefined;
  }

  if (isPackage) {
    if (booking.bookingStatus === "pending") {
      booking.bookingStatus = "confirmed";
    }
  } else {
    if (booking.status === "pending" || booking.status === "invited") {
      booking.status = "confirmed";
    }
  }

  // ── 2. Guide assignment ───────────────────────────────────────────────────
  if (!isPackage && !booking.guide && schedule.guide) {
    booking.guide = schedule.guide;
  }

  // ── 3. Slot decrement (idempotent via slotsReserved flag) ─────────────────
  if (!isPackage && !booking.slotsReserved) {
    await updateRemainingSlots(booking.tour, booking.scheduleId, -booking.numPeople);
    booking.slotsReserved = true;
  }

  // ── 4. Chat room ──────────────────────────────────────────────────────────
  if (!booking.chatRoom) {
    const roomOpts = isPackage ? {
      packageBookingId: booking._id,
      tourId: booking.packageId, // chat room uses tourId field for packageId too sometimes, or maybe we leave it
      travelerId: booking.user,
      guideId: schedule.assignedGuide,
      contextType: "package"
    } : {
      bookingId: booking._id,
      tourId: booking.tour,
      travelerId: booking.user,
      guideId: schedule.guide,
    };
    
    // Note: ensureChatRoomForBooking supports both
    const room = await ensureChatRoomForBooking(roomOpts);
    if (room) booking.chatRoom = room._id;
  }

  // ── 5. Generate QR Code Token ─────────────────────────────────────────────
  const { generateQRData } = require("./qrService");
  
  // Set expiration to start date + 1 day
  const startDate = schedule.startDate;
  const expirationDate = new Date(startDate);
  expirationDate.setDate(expirationDate.getDate() + 1);

  booking.qrGeneratedAt = new Date();
  booking.qrExpiresAt = expirationDate;

  // We only keep the nonce and hash in the DB
  const { qrNonce, qrTokenHash } = generateQRData(
    booking._id,
    isPackage ? "package" : "tour",
    booking.qrGeneratedAt,
    booking.qrExpiresAt
  );

  booking.qrNonce = qrNonce;
  booking.qrTokenHash = qrTokenHash;
  // Ensure we don't accidentally keep the old encrypted field if it somehow exists
  booking.qrTokenEncrypted = undefined;

  booking.verificationLogs.push({
    action: "QR_GENERATED",
    status: "Success"
  });

  // ── 6. Persist booking ────────────────────────────────────────────────────
  await booking.save(sessionOpts);

  // ── 7. Update linked TourRequest ──────────────────────────────────────────
  if (!isPackage && booking.linkedRequestId) {
    const TourRequest = require("../models/TourRequest");
    const { logRequestEvent } = require("./requestAuditService");
    await TourRequest.findByIdAndUpdate(
      booking.linkedRequestId,
      { status: "confirmed", assignedSchedule: booking.scheduleId },
      sessionOpts
    );
    await logRequestEvent({
      requestId: booking.linkedRequestId,
      userId: booking.user,
      role: "traveler",
      event: "PAYMENT_CONFIRMED",
      metadata: { bookingId: booking._id },
    });
    await logRequestEvent({
      requestId: booking.linkedRequestId,
      userId: booking.user,
      role: "system",
      event: "REQUEST_CONFIRMED",
      metadata: { bookingId: booking._id, scheduleId: booking.scheduleId },
    });
  } else if (!isPackage && schedule.linkedRequestId) {
    const TourRequest = require("../models/TourRequest");
    await TourRequest.findByIdAndUpdate(
      schedule.linkedRequestId,
      { status: "confirmed" },
      sessionOpts
    );
  }

  // ── 8. Increment tour bookingsCount ──────────────────────────────────────
  if (!isPackage) {
    await Tour.findByIdAndUpdate(
      booking.tour,
      { $inc: { bookingsCount: 1 } },
      sessionOpts
    );
  } else {
    const Package = require("../models/Package");
    await Package.findByIdAndUpdate(
      booking.packageId,
      { $inc: { bookingsCount: 1 } },
      sessionOpts
    );
  }

  logger.info(`confirmPaidBookingCore: Booking ${booking._id} committed — QR generated.`);
  return { committed: true, tourDoc: tour, scheduleDoc: schedule };
};

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2 — POST-COMMIT SIDE EFFECTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * runBookingPostProcessing(booking, options)
 *
 * Executes ALL non-critical side effects AFTER the MongoDB session commits.
 * Uses Promise.allSettled() so that any single failure is isolated and logged
 * without affecting the others.
 *
 * CRITICAL RULE: This function MUST NEVER be called inside a MongoDB session.
 *
 * @param {Object} booking          - The confirmed booking document (lean or Mongoose)
 * @param {Object} options
 * @param {Object} options.tourDoc       - Pre-loaded tour document (from confirmPaidBookingCore)
 * @param {Object} options.scheduleDoc   - Pre-loaded schedule sub-document
 * @param {boolean} options.isPackage    - true if this is a PackageBooking
 * @param {string}  options.tx_ref       - Transaction reference (for audit/invoice)
 * @param {string}  options.transaction_id - Chapa provider transaction ID
 * @param {string}  options.transactionDbId - MongoDB _id of the Transaction document
 * @param {Object}  options.mockReq      - Synthetic req object for audit logging
 */
const runBookingPostProcessing = async (booking, options = {}) => {
  const {
    tourDoc,
    scheduleDoc,
    isPackage = false,
    tx_ref,
    transaction_id,
    transactionDbId,
    mockReq,
  } = options;

  const Booking = require("../models/Booking");
  const PackageBooking = require("../models/PackageBooking");
  const User = require("../models/User");

  // Build tasks — each is a self-contained async function
  const tasks = [];

  // ── Task 1: Traveler notification ────────────────────────────────────────
  tasks.push(async () => {
    await sendNotification(booking.user, {
      type: "payment",
      priority: "HIGH",
      message: `Booking confirmed! Payment received — funds are held securely until your tour is completed.`,
      referenceId: booking._id,
    });
    logger.info(`Post-commit: Traveler notification sent for booking ${booking._id}.`);
  });

  // ── Task 2: Guide notification ────────────────────────────────────────────
  if (scheduleDoc?.guide) {
    tasks.push(async () => {
      const tourTitle = tourDoc?.title?.en || tourDoc?.title || "your tour";
      await sendNotification(scheduleDoc.guide, {
        type: "booking",
        priority: "HIGH",
        message: `New confirmed booking on ${tourTitle}. ${booking.numPeople} traveler(s) — check your passenger list.`,
        referenceId: booking._id,
      });
      logger.info(`Post-commit: Guide notification sent for booking ${booking._id}.`);
    });
  }

  // ── Task 2.5: Admin notification ──────────────────────────────────────────
  tasks.push(async () => {
    const admins = await User.find({ role: "admin" }).select("_id");
    const tourTitle = tourDoc?.title?.en || tourDoc?.title || "a tour";
    
    await Promise.all(
      admins.map(admin =>
        sendNotification(admin._id, {
          type: "payment",
          priority: "NORMAL",
          message: `Payment successful! Received ETB ${booking.totalPrice} for ${booking.numPeople} traveler(s) on ${tourTitle}.`,
          referenceId: booking._id,
        })
      )
    );
    logger.info(`Post-commit: Admin notification(s) sent for booking ${booking._id}.`);
  });

  // ── Task 3: Invoice PDF + Email ───────────────────────────────────────────
  tasks.push(async () => {
    const bUser = await User.findById(booking.user);
    if (!bUser?.email) return;

    let populatedBooking;
    if (!isPackage) {
      populatedBooking = await Booking.findById(booking._id)
        .populate("tour user guide");
    } else {
      populatedBooking = await PackageBooking.findById(booking._id).populate({
        path: "packageId",
        populate: { path: "tour hotel" },
      });
    }

    const pdfBuffer = await generateInvoicePdf({
      invoiceNumber: tx_ref,
      issuedAt: new Date(),
      customer: { name: bUser.name, email: bUser.email },
      type: isPackage ? "package" : "tour",
      record: populatedBooking,
    });

    const frontendUrl = process.env.FRONTEND_URL || "https://kambata.travel";
    const tourTitle = populatedBooking.tour?.title?.en || populatedBooking.tour?.title || "your tour";
    
    const emailHtml = buildPremiumEmail({
      type: "booking_confirmed",
      title: "Your Booking is Confirmed!",
      accentColor: "#10B981",
      greeting: `Hello ${bUser.name},`,
      bodyLines: [
        "We are thrilled to confirm your reservation! Your adventure to the heart of Kambata is officially booked.",
        "Your payment was successful, and your receipt is attached as a PDF to this email. Please review your booking details below and keep this email for your records."
      ],
      statusBadge: { text: "CONFIRMED", color: "#10B981" },
      bookingSummary: {
        tourName: tourTitle,
        date: new Date(populatedBooking.date).toLocaleDateString(),
        guideName: populatedBooking.guide ? populatedBooking.guide.name : "To be assigned",
        travelers: populatedBooking.numPeople || 1,
        totalPrice: `ETB ${populatedBooking.totalPrice}`
      },
      cta: {
        text: "View Your Itinerary",
        link: `${frontendUrl}/explorer-dashboard/bookings`,
        color: "#10B981"
      }
    });

    await sendEmail({
      to: bUser.email,
      subject: `Your Kambata Travel Booking Confirmed! (${tx_ref})`,
      html: emailHtml,
      attachments: [
        {
          filename: `receipt-${tx_ref}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    logger.info(`Post-commit: Invoice PDF sent to ${bUser.email} for tx_ref=${tx_ref}.`);
  });

  // ── Task 4: Recommendation engine signal ─────────────────────────────────
  if (booking.tour) {
    tasks.push(async () => {
      const { updateFromBooking } = require("./recommendationService");
      await updateFromBooking(booking.user, booking.tour);
      logger.info(`Post-commit: Recommendation engine updated for booking ${booking._id}.`);
    });
  }

  // ── Task 5: Waitlist promotion ────────────────────────────────────────────
  // Promoting next waitlist entry is post-commit safe — it's about future bookings,
  // not the current one. A failure here is recoverable (next webhook retry, or admin tool).
  // NOTE: This applies to failed/refunded flows, but included here for completeness
  // if the tour has capacity freed by a cancellation post-confirm (edge case).

  // ── Task 6: Audit log ─────────────────────────────────────────────────────
  if (mockReq && transactionDbId) {
    tasks.push(async () => {
      await recordAction(mockReq, "PAYMENT_SUCCESS", "Transaction", transactionDbId, {
        tx_ref,
        providerTransactionId: transaction_id,
        bookingId: booking._id,
      });
      logger.info(`Post-commit: Audit log written for tx_ref=${tx_ref}.`);
    });
  }

  // ── Execute all tasks concurrently — failures are isolated ───────────────
  const results = await Promise.allSettled(tasks.map((fn) => fn()));

  // Report any failures without throwing
  results.forEach((result, i) => {
    if (result.status === "rejected") {
      logger.error(
        `Post-commit task[${i}] failed for booking ${booking._id} (tx_ref=${tx_ref}): ${result.reason?.message || result.reason}`
      );
    }
  });

  const failCount = results.filter((r) => r.status === "rejected").length;
  if (failCount > 0) {
    logger.warn(
      `Post-commit: ${failCount}/${tasks.length} tasks failed for booking ${booking._id}. Payment remains confirmed.`
    );
  } else {
    logger.info(`Post-commit: All ${tasks.length} tasks completed for booking ${booking._id}.`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LEGACY SHIM — backward-compat for verifyPaymentStatus fallback path
// ─────────────────────────────────────────────────────────────────────────────

/**
 * confirmPaidBooking(booking)
 *
 * @deprecated Prefer calling confirmPaidBookingCore() + runBookingPostProcessing()
 *             directly with a proper MongoDB session.
 *
 * Used only by verifyPaymentStatus as a fallback when the webhook never fired.
 * The verify path does NOT have an active session, so we run both phases
 * sequentially without a session parameter.
 */
const confirmPaidBooking = async (booking) => {
  const { committed, tourDoc, scheduleDoc } = await confirmPaidBookingCore(booking, null);

  if (!committed) {
    // Already confirmed — no side effects to run again
    return booking;
  }

  const isPackage = !!booking.packageId;
  const tx_ref = booking.tx_ref;
  const mockReq = {
    user: { _id: booking.user },
    ip: "verify-endpoint",
    headers: { "user-agent": "server/verify" },
  };

  await runBookingPostProcessing(booking, {
    tourDoc,
    scheduleDoc,
    isPackage,
    tx_ref,
    transaction_id: booking.transactionId,
    transactionDbId: null,  // not available in verify path
    mockReq,
  });

  return booking;
};

module.exports = {
  confirmPaidBookingCore,
  runBookingPostProcessing,
  confirmPaidBooking,       // legacy shim
};
