const cron = require('node-cron');
const Booking = require('../models/Booking');
const Tour = require('../models/Tour');
const Notification = require('../models/Notification');
const { sendNotification } = require('../services/notificationService');
const { sendEmail } = require('../utils/mailService');
const { buildPremiumEmail } = require('../utils/emailTemplateBuilder');
const logger = require('../utils/logger');

// Helper to check if a reminder was already sent
const hasReminderBeenSent = async (bookingId, type) => {
  const existing = await Notification.findOne({
    referenceId: bookingId,
    type: type
  });
  return !!existing;
};

// Send Reminder
const processReminder = async (booking, type, label, hoursAway) => {
  if (await hasReminderBeenSent(booking._id, type)) return;

  // For travelers
  if (booking.user) {
    await sendNotification(booking.user._id, {
      type: type,
      priority: 'HIGH',
      message: `Reminder: Your tour ${booking.tour?.title?.en || ''} starts in ${label}!`,
      referenceId: booking._id
    });

    if (booking.user.email) {
      try {
        const frontendUrl = process.env.FRONTEND_URL || "https://kambata.travel";
        const emailHtml = buildPremiumEmail({
          type: "default",
          title: "Upcoming Trip Reminder",
          icon: "⏰",
          accentColor: "#F59E0B",
          greeting: `Hi ${booking.user.name},`,
          bodyLines: [
            `Get ready! Your upcoming tour is just ${label} away.`,
            `Please double-check your dashboard to ensure you have everything prepared and know where to meet your guide.`
          ],
          infoCards: [
            { title: "Tour Name", value: booking.tour?.title?.en || 'Kambata Adventure', iconEmoji: "📍" },
            { title: "Starts In", value: label, iconEmoji: "⏳" }
          ],
          cta: {
            text: "View Itinerary",
            link: `${frontendUrl}/explorer-dashboard/bookings`,
            color: "#F59E0B"
          }
        });

        await sendEmail({
          to: booking.user.email,
          subject: `Reminder: Your tour starts in ${label}!`,
          html: emailHtml
        });
      } catch (err) {
        logger.error("Failed to send reminder email:", err);
      }
    }
  }

  // For guides
  if (booking.guide) {
    await sendNotification(booking.guide, {
      type: type,
      priority: 'HIGH',
      message: `Reminder: You have a tour starting in ${label} with ${booking.user?.name || 'a traveler'}.`,
      referenceId: booking._id
    });
  }
};

const startReminderJobs = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running Reminder Jobs...');
    try {
      const now = new Date();

      // Find all confirmed or paid bookings
      const bookings = await Booking.find({
        status: 'confirmed',
        paymentStatus: 'paid'
      }).populate('user').populate('tour');

      for (const booking of bookings) {
        // Find schedule
        if (!booking.tour || !booking.tour.schedules) continue;
        const schedule = booking.tour.schedules.id(booking.scheduleId);
        if (!schedule) continue;

        const startDate = new Date(schedule.startDate);
        if (schedule.startTime) {
          const [hours, minutes] = schedule.startTime.split(':');
          startDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
        }

        const hoursDiff = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursDiff > 0 && hoursDiff <= 2) {
          await processReminder(booking, 'reminder_2h', '2 hours', hoursDiff);
        } else if (hoursDiff > 2 && hoursDiff <= 24) {
          await processReminder(booking, 'reminder_1d', '1 day', hoursDiff);
        } else if (hoursDiff > 24 && hoursDiff <= 7 * 24) {
          await processReminder(booking, 'reminder_7d', '7 days', hoursDiff);
        }
      }
    } catch (error) {
      logger.error('Reminder Jobs Error:', error);
    }
  });
};

module.exports = { startReminderJobs };
