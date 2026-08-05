const cron = require("node-cron");
const Tour = require("../models/Tour");
const PackageSchedule = require("../models/PackageSchedule");
const Package = require("../models/Package");
const logger = require("../utils/logger");
const User = require("../models/User");
const { sendNotification } = require("../services/notificationService");
const { sendEmail } = require("../utils/mailService");
const { buildPremiumEmail } = require("../utils/emailTemplateBuilder");

/**
 * Attendance Lock Cron
 * Runs every hour to lock check-ins for schedules that have ended more than 12 hours ago.
 * Prevents retroactive, fraudulent attendance records.
 */
const startAttendanceLockCron = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      const now = new Date();
      const lockThreshold = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago

      // 1. Lock Tour Schedules
      // Find tours that have schedules where (endDate < lockThreshold) AND attendanceLocked is not true
      const tours = await Tour.find({
        "schedules.attendanceLocked": { $ne: true }
      });

      let toursLockedCount = 0;
      let pkgsLockedCount = 0;

      for (const tour of tours) {
        let isModified = false;
        
        for (const schedule of tour.schedules) {
          if (!schedule.attendanceLocked) {
            let actualEndDate;
            if (schedule.endDate) {
              actualEndDate = new Date(schedule.endDate);
            } else if (schedule.startDate && tour.durationInHours) {
              actualEndDate = new Date(schedule.startDate.getTime() + tour.durationInHours * 60 * 60 * 1000);
            } else if (schedule.startDate) {
              actualEndDate = new Date(schedule.startDate);
            } else {
              continue;
            }

            if (actualEndDate < lockThreshold) {
              schedule.attendanceLocked = true;
              isModified = true;
              toursLockedCount++;

              // Notify Guide
              if (schedule.guide) {
                try {
                  const guide = await User.findById(schedule.guide);
                  if (guide && guide.email) {
                    const frontendUrl = process.env.FRONTEND_URL || "https://kambata.travel";
                    const emailHtml = buildPremiumEmail({
                      type: "default",
                      title: "Tour Attendance Locked",
                      icon: "🔒",
                      accentColor: "#F59E0B",
                      greeting: `Hello ${guide.name},`,
                      bodyLines: [
                        "The check-in window for your recent tour schedule has officially closed and attendance is now locked.",
                        "If you successfully completed the tour but forgot to scan traveler QR codes, please contact the admin team immediately to ensure your payout is not affected.",
                        "If the tour was cancelled or did not take place, no further action is needed."
                      ],
                      infoCards: [
                        { title: "Tour", value: tour.title?.en || tour.title || "Tour", iconEmoji: "📍" },
                        { title: "Date", value: new Date(schedule.startDate).toLocaleDateString(), iconEmoji: "📅" }
                      ],
                      statusBadge: { text: "ATTENDANCE LOCKED", color: "#F59E0B" },
                      cta: {
                        text: "Contact Admin Support",
                        link: `${frontendUrl}/contact`,
                        color: "#F59E0B"
                      }
                    });
                    
                    await sendEmail({
                      to: guide.email,
                      subject: "Action Required: Tour Attendance Locked - Kambata Travel",
                      html: emailHtml
                    });
                    
                    await sendNotification(guide._id, {
                      type: "system",
                      priority: "HIGH",
                      message: `Attendance for your recent schedule of "${tour.title?.en || tour.title}" is now locked. Contact admin if you forgot to check in travelers.`,
                    });
                  }
                } catch (err) {
                  logger.error("Failed to send attendance lock notification to guide:", err);
                }
              }
            }
          }
        }
        
        if (isModified) {
          await tour.save({ validateModifiedOnly: true });
        }
      }

      // 2. Lock Package Schedules
      const pkgSchedules = await PackageSchedule.find({
        attendanceLocked: { $ne: true },
        startDate: { $exists: true }
      }).populate("packageId", "durationDays");

      for (const pkgSchedule of pkgSchedules) {
        const pkg = pkgSchedule.packageId;
        if (!pkg) continue;

        let actualEndDate;
        if (pkgSchedule.endDate) {
          actualEndDate = new Date(pkgSchedule.endDate);
        } else {
          actualEndDate = new Date(pkgSchedule.startDate);
          // Packages usually span `durationDays`
          if (pkg.durationDays) {
             actualEndDate = new Date(actualEndDate.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000);
          }
        }

        if (actualEndDate < lockThreshold) {
          pkgSchedule.attendanceLocked = true;
          await pkgSchedule.save({ validateModifiedOnly: true });
          pkgsLockedCount++;

          // Notify Guide
          if (pkgSchedule.assignedGuide) {
            try {
              const guide = await User.findById(pkgSchedule.assignedGuide);
              if (guide && guide.email) {
                const frontendUrl = process.env.FRONTEND_URL || "https://kambata.travel";
                const emailHtml = buildPremiumEmail({
                  type: "default",
                  title: "Package Attendance Locked",
                  icon: "🔒",
                  accentColor: "#F59E0B",
                  greeting: `Hello ${guide.name},`,
                  bodyLines: [
                    "The check-in window for your recent package schedule has officially closed and attendance is now locked.",
                    "If you successfully completed the package but forgot to scan traveler QR codes, please contact the admin team immediately to ensure your payout is not affected.",
                    "If the package was cancelled or did not take place, no further action is needed."
                  ],
                  infoCards: [
                    { title: "Package", value: pkg.title?.en || pkg.title || "Package", iconEmoji: "📍" },
                    { title: "Start Date", value: new Date(pkgSchedule.startDate).toLocaleDateString(), iconEmoji: "📅" }
                  ],
                  statusBadge: { text: "ATTENDANCE LOCKED", color: "#F59E0B" },
                  cta: {
                    text: "Contact Admin Support",
                    link: `${frontendUrl}/contact`,
                    color: "#F59E0B"
                  }
                });
                
                await sendEmail({
                  to: guide.email,
                  subject: "Action Required: Package Attendance Locked - Kambata Travel",
                  html: emailHtml
                });
                
                await sendNotification(guide._id, {
                  type: "system",
                  priority: "HIGH",
                  message: `Attendance for your recent package "${pkg.title?.en || pkg.title}" is now locked. Contact admin if you forgot to check in travelers.`,
                });
              }
            } catch (err) {
              logger.error("Failed to send package attendance lock notification to guide:", err);
            }
          }
        }
      }

      if (toursLockedCount > 0 || pkgsLockedCount > 0) {
        logger.info(`Attendance Lock Cron: Locked ${toursLockedCount} tour schedules and ${pkgsLockedCount} package schedules.`);
      }

    } catch (error) {
      logger.error(`Error in Attendance Lock Cron: ${error.message}`);
    }
  });

  logger.info("Attendance Lock Cron initialized.");
};

module.exports = startAttendanceLockCron;
