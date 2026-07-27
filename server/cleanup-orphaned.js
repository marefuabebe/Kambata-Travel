const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const PackageSchedule = require("./models/PackageSchedule");
const Package = require("./models/Package");

const cleanup = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    console.log("Connected to MongoDB.");

    const schedules = await PackageSchedule.find();
    let deletedCount = 0;

    for (const sch of schedules) {
      const pkg = await Package.findById(sch.packageId);
      if (!pkg) {
        console.log(`Deleting orphaned schedule: ${sch._id}`);
        await sch.deleteOne();
        deletedCount++;
      }
    }

    console.log(`Cleanup complete. Deleted ${deletedCount} orphaned schedules.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

cleanup();
