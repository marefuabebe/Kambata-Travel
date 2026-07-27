const cron = require("node-cron");
const TourRequest = require("../models/TourRequest");
const Tour = require("../models/Tour");
const Booking = require("../models/Booking");
const { sendNotification } = require("../services/notificationService");
const { logRequestEvent } = require("../services/requestAuditService");
const { releaseGuideReservation, GUIDE_RESPONSE_MS, PAYMENT_WINDOW_MS } = require("../services/guideReservationService");
const { getRankedGuides } = require("../services/smartRankingService");
const { recordAction } = require("../services/auditService");
const logger = require("../utils/logger");

const notifyAdmins = async (message, referenceId) => {
  const User = require("../models/User");
  const admins = await User.find({ role: "admin" }).select("_id");
  for (const admin of admins) {
    try {
      await sendNotification(admin._id, {
        type: "system",
        priority: "HIGH",
        message,
        referenceId,
      });
    } catch (_) { /* non-blocking */ }
  }
};

const expireGuidePendingRequests = async () => {
  const cutoff = new Date(Date.now() - GUIDE_RESPONSE_MS);
  const expired = await TourRequest.find({
    status: "guide_pending",
    $or: [
      { guideReservationExpiresAt: { $lte: new Date() } },
      { guideReservationExpiresAt: { $exists: false }, updatedAt: { $lte: cutoff } },
    ],
  }).populate("user", "name email");

  for (const request of expired) {
    logger.info(`Expiring guide_pending request ${request._id}`);
    request.status = "expired";
    await request.save();

    if (request.tourId && request.assignedSchedule) {
      const tour = await Tour.findById(request.tourId);
      const sch = tour?.schedules?.id(request.assignedSchedule);
      if (sch && sch.status === "draft") {
        sch.deleteOne();
        await tour.save();
      }
    }

    await releaseGuideReservation(request);
    await logRequestEvent({
      requestId: request._id,
      role: "system",
      event: "GUIDE_EXPIRED",
      metadata: { reason: "24h guide response window elapsed" },
    });

    if (request.user) {
      await sendNotification(request.user._id, {
        type: "system",
        priority: "NORMAL",
        message: "Your custom tour request expired because the guide did not respond in time.",
        referenceId: request._id,
      });
    }
    await notifyAdmins(
      `Guide assignment expired for request ${request._id}. Reassignment may be needed.`,
      request._id
    );
  }
  return expired.length;
};

const expireAwaitingPaymentRequests = async () => {
  const now = new Date();
  const expired = await TourRequest.find({
    status: "awaiting_payment",
    paymentExpiresAt: { $lte: now },
  }).populate("user", "name email");

  for (const request of expired) {
    logger.info(`Expiring awaiting_payment request ${request._id}`);
    request.status = "payment_expired";
    await request.save();

    if (request.tourId && request.assignedSchedule) {
      const tour = await Tour.findById(request.tourId);
      const sch = tour?.schedules?.id(request.assignedSchedule);
      if (sch && sch.scheduleType === "private" && sch.status !== "cancelled") {
        sch.status = "cancelled";
        await tour.save();
      }
    }

    await Booking.updateMany(
      { linkedRequestId: request._id, paymentStatus: { $ne: "paid" } },
      { status: "cancelled", paymentStatus: "failed" }
    );

    const guideId = request.assignedGuide;
    await releaseGuideReservation(request);

    await logRequestEvent({
      requestId: request._id,
      role: "system",
      event: "PAYMENT_EXPIRED",
      metadata: { guideId },
    });

    if (request.user) {
      await sendNotification(request.user._id, {
        type: "system",
        priority: "HIGH",
        message: "Your payment window expired. Please submit a new request or contact support.",
        referenceId: request._id,
      });
    }
    await notifyAdmins(
      `Payment expired for request ${request._id}. Guide reservation released.`,
      request._id
    );
  }
  return expired.length;
};

const startDualBookingCron = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const guideExpired = await expireGuidePendingRequests();
      const paymentExpired = await expireAwaitingPaymentRequests();
      if (guideExpired || paymentExpired) {
        logger.info(`Dual booking cron: ${guideExpired} guide expirations, ${paymentExpired} payment expirations`);
      }
    } catch (error) {
      logger.error("Dual booking cron error:", error);
    }
  });
  logger.info("Dual booking cron started (every 5 minutes)");
};

module.exports = {
  startDualBookingCron,
  expireGuidePendingRequests,
  expireAwaitingPaymentRequests,
};
