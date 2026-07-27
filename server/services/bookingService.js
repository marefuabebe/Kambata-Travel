const Booking = require("../models/Booking");
const Tour = require("../models/Tour");
const mongoose = require("mongoose");
const { sendNotification } = require("./notificationService");
const logger = require("../utils/logger");

/**
 * Promote the next user in the FIFO waitlist 
 * @param {string} tourId
 * @param {string} scheduleId
 */
const promoteNextInWaitlist = async (tourId, scheduleId) => {
  try {
    // Find the oldest waitlisted booking for this slot
    const nextBooking = await Booking.findOne({
      tour: tourId,
      scheduleId: scheduleId,
      status: "waitlisted",
    }).sort({ createdAt: 1 }); // FIFO

    if (!nextBooking) {
      return null;
    }

    // Move to 'invited' status and set 15-min expiry
    nextBooking.status = "invited";
    nextBooking.invitationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await nextBooking.save();

    // SEND NOTIFICATION
    await sendNotification(nextBooking.user, {
      type: "booking",
      priority: "HIGH",
      message: `A spot has opened up for your tour! You have 15 minutes to claim it.`,
      referenceId: nextBooking._id,
    });

    logger.info(`Waitlist promotion: User ${nextBooking._id} invited to claim spot.`);

    return nextBooking;
  } catch (error) {
    logger.error("Error in promoteNextInWaitlist:", error);
  }
};

/**
 * Cleanup expired invitations and promote next in line
 */
const cleanupExpiredInvitations = async () => {
  try {
    const expiredBookings = await Booking.find({
      status: "invited",
      invitationExpiresAt: { $lt: Date.now() },
    });

    for (const booking of expiredBookings) {
      logger.info(`Cleaning up expired invitation for booking ${booking._id}`);
      
      // Remove from waitlist entirely as requested
      booking.status = "rejected"; // Or a new status like 'expired'
      await booking.save();

      // SEND NOTIFICATION
      await sendNotification(booking.user, {
        type: "booking",
        priority: "NORMAL",
        message: `Your waitlist invitation has expired and the spot has been offered to another user.`,
        referenceId: booking._id,
      });

      // Trigger next promotion for this slot
      await promoteNextInWaitlist(booking.tour, booking.scheduleId);
    }
  } catch (error) {
    logger.error("Error in cleanupExpiredInvitations:", error);
  }
};

/**
 * Atomic capacity management
 */
const updateRemainingSlots = async (tourId, scheduleId, amount) => {
  return await Tour.updateOne(
    { _id: tourId, "schedules._id": scheduleId },
    { $inc: { "schedules.$.remainingSlots": amount } }
  );
};

/**
 * Automatically transition 'confirmed' bookings to 'completed' 
 * after the tour's end date has passed.
 */
const markToursAsCompleted = async () => {
  try {
    const now = new Date();
    // Start of current day
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Find confirmed bookings 
    const confirmedBookings = await Booking.find({
      status: "confirmed",
      paymentStatus: "paid",
      earningsReleased: { $ne: true },
    }).populate("tour");

    const completions = [];
    const completedSchedules = new Set();

    for (const booking of confirmedBookings) {
      if (!booking.tour) continue;
      
      const schedule = booking.tour.schedules.id(booking.scheduleId);
      if (!schedule) continue;

      // If endDate is before today, the tour is over
      if (new Date(schedule.endDate) < startOfToday) {
        completedSchedules.add(`${booking.tour._id}:${booking.scheduleId}`);
        const isAbsent = booking.attendanceStatus === "absent" || (booking.attendanceStatus !== "present" && !booking.verified && !booking.qrUsed);
        
        booking.status = isAbsent ? "expired" : "completed";
        booking.earningsReleased = true;
        completions.push(booking.save());

        const guideId = schedule.guide?.toString() || booking.tour.createdBy?.toString();
        const { depositEarnings } = require("./walletService");
        if (guideId) {
          depositEarnings(guideId, booking.totalPrice);
        }

        if (isAbsent) {
          sendNotification(booking.user, {
            type: "booking",
            priority: "NORMAL",
            message: `Your scheduled tour date has passed. Unfortunately, it looks like you missed your tour.`,
            referenceId: booking._id,
          });

          // Send an email!
          const User = require("../models/User");
          const bUser = await User.findById(booking.user);
          if (bUser && bUser.email) {
            const { sendEmail } = require("../utils/mailService");
            const { buildPremiumEmail } = require("../utils/emailTemplateBuilder");
            
            const emailHtml = buildPremiumEmail({
              type: "default",
              title: "Missed Tour Notification",
              icon: "⚠️",
              accentColor: "#EF4444",
              greeting: `Hi ${bUser.name},`,
              bodyLines: [
                "Your scheduled tour date has passed, and our records indicate you did not check in.",
                "Your travel pass has now expired. If you believe this is an error, please contact our support team immediately."
              ],
              infoCards: [
                { title: "Status", value: "Expired (No-show)", iconEmoji: "❌" }
              ],
              statusBadge: { text: "EXPIRED", color: "#EF4444" }
            });

            await sendEmail({
              to: bUser.email,
              subject: "Missed Tour Notification - Kambata Travel",
              html: emailHtml,
            });
          }

          logger.info(`Booking ${booking._id} marked as expired (no-show) and commission applied.`);
        } else {
          sendNotification(booking.user, {
            type: "booking",
            priority: "NORMAL",
            message: `Welcome back! Your tour has been completed. We hope you had a great experience! Please leave a review to help other travelers.`,
            referenceId: booking._id,
          });

          logger.info(`Booking ${booking._id} marked as completed and commission applied.`);
        }
      }
    }

    await Promise.all(completions);

    // Update schedules to "completed" status
    for (const sch of completedSchedules) {
      const [tourId, scheduleId] = sch.split(":");
      await Tour.updateOne(
        { _id: tourId, "schedules._id": scheduleId },
        { $set: { "schedules.$.status": "completed" } }
      );
      logger.info(`Schedule ${scheduleId} automatically marked as completed.`);
    }

  } catch (error) {
    logger.error("Error in markToursAsCompleted:", error);
  }
};

/**
 * Automatically release capacity for abandoned or expired payment sessions.
 */
const cleanupAbandonedPayments = async () => {
  try {
    const expiredBookings = await Booking.find({
      paymentStatus: "pending",
      paymentExpiresAt: { $lt: new Date() },
      status: { $nin: ["cancelled", "rejected", "completed"] },
    });

    for (const booking of expiredBookings) {
      if (booking.slotsReserved) {
        await updateRemainingSlots(booking.tour, booking.scheduleId, booking.numPeople);
        booking.slotsReserved = false;
      }

      // 2. Mark as cancelled/expired
      booking.status = "cancelled";
      booking.paymentStatus = "failed"; // Marks as failed/expired
      await booking.save();

      // SEND NOTIFICATION
      await sendNotification(booking.user, {
        type: "booking",
        priority: "NORMAL",
        message: `Your booking session has expired and the slots have been released.`,
        referenceId: booking._id,
      });

      // 3. Immediate waitlist promotion
      await promoteNextInWaitlist(booking.tour, booking.scheduleId);
      
      logger.info(`Abandoned payment cleaned up for booking: ${booking._id}`);
    }
  } catch (error) {
    logger.error("Error in cleanupAbandonedPayments:", error);
  }
};

module.exports = {
  promoteNextInWaitlist,
  cleanupExpiredInvitations,
  updateRemainingSlots,
  markToursAsCompleted,
  cleanupAbandonedPayments,
};
