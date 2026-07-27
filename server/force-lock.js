const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/kambata-travel').then(async () => {
  const Tour = require('./models/Tour');
  const Package = require('./models/Package');
  const PackageSchedule = require('./models/PackageSchedule');
  
  const now = new Date();
  const lockThreshold = new Date(now.getTime() - 12 * 60 * 60 * 1000);

  let toursLockedCount = 0;
  let pkgsLockedCount = 0;

  const tours = await Tour.find({ "schedules.attendanceLocked": { $ne: true } });
  for (const tour of tours) {
    let isModified = false;
    for (const schedule of tour.schedules) {
      if (!schedule.attendanceLocked) {
        let actualEndDate = schedule.endDate ? new Date(schedule.endDate) : (schedule.startDate && tour.durationInHours ? new Date(schedule.startDate.getTime() + tour.durationInHours * 60 * 60 * 1000) : schedule.startDate ? new Date(schedule.startDate) : null);
        if (actualEndDate && actualEndDate < lockThreshold) {
          schedule.attendanceLocked = true;
          isModified = true;
          toursLockedCount++;
        }
      }
    }
    if (isModified) await tour.save({ validateModifiedOnly: true });
  }

  const pkgSchedules = await PackageSchedule.find({ attendanceLocked: { $ne: true }, startDate: { $exists: true } }).populate("packageId", "durationDays");
  for (const pkgSchedule of pkgSchedules) {
    const pkg = pkgSchedule.packageId;
    if (!pkg) continue;

    let actualEndDate;
    if (pkgSchedule.endDate) {
      actualEndDate = new Date(pkgSchedule.endDate);
    } else {
      actualEndDate = new Date(pkgSchedule.startDate);
      if (pkg.durationDays) {
         actualEndDate = new Date(actualEndDate.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000);
      }
    }

    if (actualEndDate < lockThreshold) {
      pkgSchedule.attendanceLocked = true;
      await pkgSchedule.save();
      pkgsLockedCount++;
    }
  }

  console.log(`Locked ${toursLockedCount} tours and ${pkgsLockedCount} packages.`);
  process.exit(0);
});
