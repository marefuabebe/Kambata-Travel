const Booking = require("../models/Booking");
const Notification = require("../models/Notification");
const { getIO } = require("../utils/socketIO");
const logger = require("../utils/logger");
const { sendEmail } = require("../utils/mailService");
const { buildPremiumEmail } = require("../utils/emailTemplateBuilder");
const User = require("../models/User");

/**
 * Centralized Notification Service
 */
const sendNotification = async (userId, data) => {
  try {
    const { type, priority = "NORMAL", message, referenceId } = data;

    // 1. Persist to Database
    const notification = await Notification.create({
      user: userId,
      type,
      priority,
      message,
      referenceId,
    });

    // 2. Real-time Delivery via Socket.IO
    try {
      const io = getIO();
      io.to(userId.toString()).emit("new_notification", {
        id: notification._id,
        type,
        priority,
        message,
        referenceId,
        createdAt: notification.createdAt,
      });
      logger.info(`Real-time notification sent to user: ${userId}`);
    } catch (socketErr) {
      logger.warn(`Could not send real-time notification: ${socketErr.message}`);
    }

    // 3. Placeholder for future Email/SMS logic
    return notification;
  } catch (error) {
    logger.error("Error in sendNotification:", error);
  }
};

/**
 * Scheduled Reminder Service (Runs every 6 hours usually, but for 2-hour accuracy, it should be called more frequently, e.g., every 30m)
 */
const sendTourReminders = async () => {
  try {
    const now = new Date();
    
    // Find upcoming confirmed/paid bookings
    const upcomingBookings = await Booking.find({
      status: "confirmed",
      paymentStatus: "paid",
    }).populate("tour user");

    for (const booking of upcomingBookings) {
      if (!booking.tour || !booking.user) continue;

      const schedule = booking.tour.schedules.id(booking.scheduleId);
      if (!schedule) continue;

      const startTime = new Date(schedule.startDate);
      const diffHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      let reminderType = null;
      let reminderMessage = "";

      // Check windows (allow a bit of buffer)
      if (diffHours > 167 && diffHours <= 169 && !booking.reminder7d) {
        reminderType = "7d";
        reminderMessage = `REMINDER: Your tour "${booking.tour.title?.en || booking.tour.title}" starts in 7 days! Date: ${startTime.toDateString()}`;
      } else if (diffHours > 23 && diffHours <= 25 && !booking.reminder1d) {
        reminderType = "1d";
        reminderMessage = `REMINDER: Your tour "${booking.tour.title?.en || booking.tour.title}" starts tomorrow! Date: ${startTime.toDateString()} at ${schedule.startTime || "N/A"}`;
      } else if (diffHours > 1.5 && diffHours <= 2.5 && !booking.reminder2h) {
        reminderType = "2h";
        reminderMessage = `FINAL REMINDER: Your tour "${booking.tour.title?.en || booking.tour.title}" starts in 2 hours! Meeting point: ${schedule.meetingPoint || booking.tour.meetingPoint?.en || "N/A"}`;
      }

      if (reminderType) {
        // 1. In-App Notification
        await sendNotification(booking.user._id, {
          type: "reminder",
          priority: "HIGH",
          message: reminderMessage,
          referenceId: booking._id,
        });

        // 2. Email Notification
        if (booking.user.email) {
          const frontendUrl = process.env.FRONTEND_URL || "https://kambata.travel";
          const emailHtml = buildPremiumEmail({
            type: "default",
            title: "Upcoming Tour Reminder",
            icon: "⏰",
            accentColor: "#F59E0B",
            greeting: `Hello ${booking.user.name},`,
            bodyLines: [
              reminderMessage,
              "Log in to your dashboard to chat with your guide or view the itinerary."
            ],
            infoCards: [
              { title: "Tour", value: booking.tour.title?.en || booking.tour.title, iconEmoji: "📍" }
            ],
            cta: {
              text: "View Dashboard",
              link: `${frontendUrl}/explorer-dashboard`,
              color: "#F59E0B"
            }
          });

          await sendEmail({
            to: booking.user.email,
            subject: "Upcoming Tour Reminder - Kambata Travel",
            html: emailHtml
          });
        }

        if (reminderType === "7d") booking.reminder7d = true;
        if (reminderType === "1d") booking.reminder1d = true;
        if (reminderType === "2h") booking.reminder2h = true;
        
        await booking.save();
        logger.info(`${reminderType} Reminder sent for booking: ${booking._id}`);
      }
    }
  } catch (error) {
    logger.error("Error in sendTourReminders:", error);
  }
};

/**
 * Notifies a guide when they are assigned to a new schedule.
 * Sends both an in-app notification and an email.
 */
const notifyGuideOfAssignment = async (guideId, tourTitle, startDate, startTime) => {
  try {
    const guide = await User.findById(guideId);
    if (!guide) return;

    const message = `ACTION REQUIRED: You have a pending assignment for: "${tourTitle}". Date: ${new Date(startDate).toLocaleDateString()}, Time: ${startTime || "N/A"}. Please review and Accept or Reject.`;

    // 1. Send in-app notification
    await sendNotification(guideId, {
      type: "system",
      priority: "HIGH",
      message,
    });

    // 2. Send email
    if (guide.email) {
      const frontendUrl = process.env.FRONTEND_URL || "https://kambata.travel";
      const emailHtml = buildPremiumEmail({
        type: "default",
        title: "New Tour Assignment",
        icon: "👨‍💼",
        accentColor: "#E67E22",
        greeting: `Hello ${guide.name},`,
        bodyLines: [
          "You have been assigned to lead a new tour schedule.",
          "This assignment requires your immediate confirmation."
        ],
        infoCards: [
          { title: "Tour/Package", value: tourTitle, iconEmoji: "📍" },
          { title: "Date", value: new Date(startDate).toLocaleDateString(), iconEmoji: "📅" },
          { title: "Time", value: startTime || "N/A", iconEmoji: "⏰" }
        ],
        statusBadge: { text: "ACTION REQUIRED", color: "#E67E22" },
        cta: {
          text: "Respond Now",
          link: `${frontendUrl}/guide-dashboard/assignments`,
          color: "#E67E22"
        }
      });

      await sendEmail({
        to: guide.email,
        subject: "Action Required: New Tour Assignment - Kambata Travel",
        html: emailHtml
      });
      logger.info(`Assignment email sent to guide ${guide.email}`);
    }
  } catch (error) {
    logger.error("Error in notifyGuideOfAssignment:", error);
  }
};

/**
 * Notify Admin of Guide's Decision
 */
const notifyAdminOfAssignmentDecision = async (guideName, decision, tourTitle) => {
  try {
    const adminRole = await User.findOne({ role: "admin" });
    if (!adminRole) return;
    
    const message = `Guide Assignment Update: ${guideName} has ${decision.toUpperCase()} the assignment for ${tourTitle}.`;
    
    await sendNotification(adminRole._id, {
      type: "system",
      priority: decision === "rejected" ? "HIGH" : "NORMAL",
      message,
    });
    
    if (adminRole.email) {
       const emailHtml = buildPremiumEmail({
         type: "default",
         title: "Guide Assignment Update",
         icon: decision === "rejected" ? "⚠️" : "✅",
         accentColor: decision === "rejected" ? "#EF4444" : "#10B981",
         greeting: `Attention Admin,`,
         bodyLines: [
           `Guide ${guideName} has ${decision.toUpperCase()} the assignment for ${tourTitle}.`
         ],
         statusBadge: { text: decision.toUpperCase(), color: decision === "rejected" ? "#EF4444" : "#10B981" }
       });

       await sendEmail({
         to: adminRole.email,
         subject: `Guide Assignment ${decision.toUpperCase()} - ${tourTitle}`,
         html: emailHtml,
       });
    }
  } catch (error) {
    logger.error("Error notifying admin of assignment decision", error);
  }
};

/**
 * Notify Travelers when a Guide Accepts
 */
const notifyTravelersOfAcceptance = async (scheduleId, guideName, tourTitle) => {
  try {
    const bookings = await Booking.find({ scheduleId, status: "confirmed" }).populate("user");
    for (const b of bookings) {
      if (!b.user) continue;
      const message = `Great news! Your guide ${guideName} has officially confirmed their assignment for your upcoming tour: ${tourTitle}. You can now start a chat with them in your dashboard!`;
      
      await sendNotification(b.user._id, {
        type: "system",
        priority: "NORMAL",
        message,
      });

      if (b.user.email) {
        const frontendUrl = process.env.FRONTEND_URL || "https://kambata.travel";
        const emailHtml = buildPremiumEmail({
          type: "default",
          title: "Your Guide is Confirmed!",
          icon: "✅",
          accentColor: "#10B981",
          greeting: `Hi ${b.user.name},`,
          bodyLines: [
            `Great news! Your guide ${guideName} has officially confirmed their assignment for your upcoming tour: ${tourTitle}.`,
            "You can now start a chat with them in your dashboard to discuss any details!"
          ],
          cta: {
            text: "Chat with Guide",
            link: `${frontendUrl}/explorer-dashboard`,
            color: "#10B981"
          }
        });

        await sendEmail({
          to: b.user.email,
          subject: "Your Guide is Confirmed! - Kambata Travel",
          html: emailHtml,
        });
      }
    }
  } catch (error) {
    logger.error("Error notifying travelers of guide acceptance", error);
  }
};

module.exports = {
  sendNotification,
  sendTourReminders,
  notifyGuideOfAssignment,
  notifyAdminOfAssignmentDecision,
  notifyTravelersOfAcceptance
};
