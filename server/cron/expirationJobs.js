const cron = require('node-cron');
const TourRequest = require('../models/TourRequest');
const Tour = require('../models/Tour');
const PackageSchedule = require('../models/PackageSchedule');
const Booking = require('../models/Booking');
const PackageBooking = require('../models/PackageBooking');
const { sendNotification } = require('../services/notificationService');
const { sendEmail } = require('../utils/mailService');
const { buildPremiumEmail } = require("../utils/emailTemplateBuilder");
const logger = require('../utils/logger');

// Run every hour
const startExpirationJobs = () => {
  cron.schedule('0 * * * *', async () => {
    logger.info('Running Expiration Job for Unpaid Private Schedules...');
    try {
      // 1. Expire requests where payment window has passed
      const expiredPayments = await TourRequest.find({
        status: 'awaiting_payment',
        paymentExpiresAt: { $lt: new Date() },
        assignedSchedule: { $exists: true }
      }).populate('user');

      // 2. Expire requests where the preferred date has passed (never fulfilled)
      const pastDateRequests = await TourRequest.find({
        status: { $in: ['pending_admin', 'guide_pending', 'reassigning_guide', 'guide_matching', 'awaiting_payment'] },
        preferredDate: { $lt: new Date() }
      }).populate('user');

      // 3. Traveler Deadline: Expire if not fulfilled in 72 hours
      const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
      const staleRequests = await TourRequest.find({
        status: { $in: ['pending_admin', 'guide_pending', 'reassigning_guide', 'guide_matching'] },
        createdAt: { $lt: seventyTwoHoursAgo }
      }).populate('user');

      const allExpired = [...expiredPayments, ...pastDateRequests, ...staleRequests];

      // Remove duplicates just in case
      const uniqueRequests = Array.from(new Set(allExpired.map(r => r._id.toString())))
        .map(id => allExpired.find(r => r._id.toString() === id));

      for (const request of uniqueRequests) {
        let scheduleObj;
        let isPackage = false;
        let parentTour;

        // Find schedule
        if (request.tourId) {
          parentTour = await Tour.findOne({ 'schedules._id': request.assignedSchedule });
          if (parentTour) scheduleObj = parentTour.schedules.id(request.assignedSchedule);
        } else if (request.packageId) {
          scheduleObj = await PackageSchedule.findById(request.assignedSchedule);
          isPackage = true;
        }

        if (!scheduleObj) continue;

        // Check for paid bookings
        let paidBookings = 0;
        if (isPackage) {
          paidBookings = await PackageBooking.countDocuments({
            packageScheduleId: scheduleObj._id,
            paymentStatus: 'paid'
          });
        } else {
          paidBookings = await Booking.countDocuments({
            scheduleId: scheduleObj._id,
            paymentStatus: 'paid'
          });
        }

        if (paidBookings === 0) {
          // EXPIRE IT
          logger.info(`Expiring request ${request._id} and releasing schedule ${scheduleObj._id}`);

          // 1. Update Request
          let reasonText = "due to non-payment";
          if (request.createdAt < seventyTwoHoursAgo && request.status !== 'awaiting_payment') {
            request.status = 'expired';
            reasonText = "because we could not find an available guide for your requested dates";
          } else if (request.preferredDate < new Date()) {
            request.status = 'expired';
          } else {
            request.status = 'payment_expired';
          }
          await request.save();

          const { logRequestEvent } = require("../services/requestAuditService");
          await logRequestEvent({
            requestId: request._id,
            userId: request.user ? request.user._id : null,
            role: "system",
            event: request.status === "payment_expired" ? "PAYMENT_EXPIRED" : "REQUEST_EXHAUSTED",
            ipAddress: "system",
          });

          const { releaseGuideReservation } = require("../services/guideReservationService");
          await releaseGuideReservation(request);

          // 2. Delete Schedule (not just cancel)
          if (!isPackage) {
            parentTour.schedules.pull(scheduleObj._id);
            await parentTour.save();
          } else {
            await PackageSchedule.findByIdAndDelete(scheduleObj._id);
          }

          // 3. Notify Traveler
          if (request.user) {
            await sendNotification(request.user._id, {
              type: 'system',
              priority: 'HIGH',
              message: `Your custom request for ${new Date(request.preferredDate).toLocaleDateString()} has expired ${reasonText}.`
            });

            const frontendUrl = process.env.FRONTEND_URL || "https://kambata.travel";
            const emailHtml = buildPremiumEmail({
              type: "default",
              title: "Request Expired",
              icon: "⏳",
              accentColor: "#EF4444",
              greeting: `Dear ${request.user.name},`,
              bodyLines: [
                `Your custom schedule for ${new Date(request.preferredDate).toLocaleDateString()} has been automatically cancelled ${reasonText}.`,
                "If you are still interested in traveling with us, please submit a new request from your dashboard."
              ],
              statusBadge: { text: "EXPIRED", color: "#EF4444" },
              cta: {
                text: "Submit New Request",
                link: `${frontendUrl}/requests/new`,
                color: "#EF4444"
              }
            });

            await sendEmail({
              to: request.user.email,
              subject: "Request Expired - Kambata Travel",
              html: emailHtml
            });
          }

          // 4. Notify Admins
          if (request.status === 'payment_expired') {
            const User = require("../models/User");
            const admins = await User.find({ role: "admin" }).select("_id");
            for (const admin of admins) {
              await sendNotification(admin._id, {
                type: 'system',
                priority: 'HIGH',
                message: `Request ${request._id} payment expired. Temporary schedule deleted.`,
                referenceId: request._id,
              });
            }
          }
        }
      }

      // 4. Expire guide responses (24 hours) and auto assign next
      const expiredGuideResponses = await TourRequest.find({
        status: 'guide_pending',
        guideResponseExpiresAt: { $lt: new Date() }
      }).populate('user');
      
      for (const request of expiredGuideResponses) {
        logger.info(`Guide response expired for request ${request._id}. Auto-assigning next guide.`);
        
        request.status = "reassigning_guide";
        request.declinedGuides = request.declinedGuides || [];
        if (request.assignedGuide && !request.declinedGuides.includes(request.assignedGuide)) {
          request.declinedGuides.push(request.assignedGuide);
        }
        await request.save();
        
        const { logRequestEvent } = require("../services/requestAuditService");
        await logRequestEvent({
          requestId: request._id,
          userId: request.assignedGuide,
          role: "system",
          event: "GUIDE_AUTO_EXPIRED",
          ipAddress: "system",
        });
        
        const { releaseGuideReservation } = require("../services/guideReservationService");
        await releaseGuideReservation(request);
        
        const { autoAssignNextGuide } = require('../controllers/requestController');
        const assigned = await autoAssignNextGuide(request, { ip: "system", user: null });
        
        if (!assigned && request.user) {
          await sendNotification(request.user._id, {
            type: "system",
            priority: "NORMAL",
            message: "We are unable to fulfill this request at the moment.",
            referenceId: request._id,
          });
        }
      }
    } catch (error) {
      logger.error('Expiration Job Error:', error);
    }
  });
};

module.exports = { startExpirationJobs };
