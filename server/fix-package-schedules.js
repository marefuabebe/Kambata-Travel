const mongoose = require("mongoose");
const PackageSchedule = require("./models/PackageSchedule");

require("dotenv").config();

async function fix() {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    const result = await PackageSchedule.updateMany({ status: "draft" }, { $set: { status: "published" } });
    console.log(`Updated ${result.modifiedCount} draft schedules to published.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
