const cron = require("node-cron");
const Tour = require("../models/Tour");
const PackageSchedule = require("../models/PackageSchedule");
const Package = require("../models/Package");
const logger = require("../utils/logger");

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
      // Find tours that have schedules where (endDate < lockThreshold) AND attendanceLocked is false
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
