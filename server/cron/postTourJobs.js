const cron = require('node-cron');
const Booking = require('../models/Booking');
const { sendEmail } = require('../utils/mailService');
const { buildPremiumEmail } = require('../utils/emailTemplateBuilder');
const logger = require('../utils/logger');

const startPostTourJobs = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    logger.info('Running Post-Tour Email Jobs...');
    try {
      const now = new Date();

      // 1. Task: "Tour Completed" Email (Immediate)
      const newlyCompletedBookings = await Booking.find({
        status: 'completed',
        postTourEmailSent: false,
      }).populate('user').populate('tour');

      for (const booking of newlyCompletedBookings) {
        if (!booking.user || !booking.user.email) continue;
        
        try {
          const frontendUrl = process.env.FRONTEND_URL || "https://kambata.travel";
          const htmlContent = buildPremiumEmail({
            type: "tour_completed",
            title: "Thank you for traveling with us!",
            icon: "🏔️",
            accentColor: "#FF8C00",
            greeting: `Hi ${booking.user.name},`,
            bodyLines: [
              `We hope you had an amazing time on your recent tour: <strong>${booking.tour?.title?.en || 'your Kambaata adventure'}</strong>.`,
              "We'd love to hear about your experience! Your feedback helps us improve and supports our amazing guides."
            ],
            cta: {
              text: "Leave a Review",
              link: `${frontendUrl}/explorer-dashboard/reviews`,
              color: "#FF8C00"
            }
          });

          await sendEmail({
            to: booking.user.email,
            subject: 'Thank you for traveling with us! 🌍',
            html: htmlContent,
          });

          booking.postTourEmailSent = true;
          await booking.save();
        } catch (emailErr) {
          logger.error(`Error sending post-tour email for booking ${booking._id}:`, emailErr);
        }
      }

      // 2. Task: "Review Reminder" Email (24 hours after completion)
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const remindersPending = await Booking.find({
        status: 'completed',
        postTourEmailSent: true,
        reviewReminderEmailSent: false,
        isReviewed: false,
        completedAt: { $lt: twentyFourHoursAgo }
      }).populate('user').populate('tour');

      for (const booking of remindersPending) {
        if (!booking.user || !booking.user.email) continue;

        try {
          const frontendUrl = process.env.FRONTEND_URL || "https://kambata.travel";
          const htmlContent = buildPremiumEmail({
            type: "review_reminder",
            title: "How was your experience?",
            icon: "⭐",
            accentColor: "#10B981",
            greeting: `Hi ${booking.user.name},`,
            bodyLines: [
              `It's been a day since your tour finished. We hope you're still smiling from your <strong>${booking.tour?.title?.en || 'Kambaata'}</strong> experience!`,
              "If you haven't already, please take a quick moment to rate your guide. Your five-star reviews mean the world to our local guides and help future travelers make great decisions."
            ],
            infoCards: [
              { title: "Tour Completed", value: new Date(booking.completedAt).toLocaleDateString(), iconEmoji: "📅" }
            ],
            cta: {
              text: "Rate Your Guide ★★★★★",
              link: `${frontendUrl}/explorer-dashboard/reviews`,
              color: "#10B981"
            }
          });

          await sendEmail({
            to: booking.user.email,
            subject: 'How was your experience? Rate your guide ★★★★★',
            html: htmlContent,
          });

          booking.reviewReminderEmailSent = true;
          await booking.save();
        } catch (emailErr) {
          logger.error(`Error sending review reminder email for booking ${booking._id}:`, emailErr);
        }
      }

    } catch (error) {
      logger.error('Post-Tour Email Jobs Error:', error);
    }
  });
};

module.exports = { startPostTourJobs };
