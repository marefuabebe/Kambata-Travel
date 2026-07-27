const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Tour = require("../models/Tour");
const TourRequest = require("../models/TourRequest");

dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

const migrateLegacyData = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI || process.env.MONGO_URI);
    console.log("MongoDB Connected for Migration");

    // The user said: "Backfill bookingType = 'instant' for legacy tours"
    const toursUpdateResult = await Tour.updateMany(
      { bookingType: { $exists: false } },
      { $set: { bookingType: "instant" } }
    );
    console.log(`Updated ${toursUpdateResult.modifiedCount} legacy tours to bookingType="instant"`);

    // We might also have tours that are already "request", we will leave them.
    // If a tour was "instant", we will leave it.

    // Map old TourRequest statuses to new ones
    // "pending" -> "pending_admin"
    // "approved" -> "guide_pending"
    // "converted_to_schedule" -> "awaiting_payment"
    
    const reqUpdatePending = await TourRequest.updateMany(
      { status: "pending" },
      { $set: { status: "pending_admin" } }
    );
    console.log(`Updated ${reqUpdatePending.modifiedCount} requests: pending -> pending_admin`);

    const reqUpdateApproved = await TourRequest.updateMany(
      { status: "approved" },
      { $set: { status: "guide_pending" } }
    );
    console.log(`Updated ${reqUpdateApproved.modifiedCount} requests: approved -> guide_pending`);

    const reqUpdateConverted = await TourRequest.updateMany(
      { status: "converted_to_schedule" },
      { $set: { status: "awaiting_payment" } }
    );
    console.log(`Updated ${reqUpdateConverted.modifiedCount} requests: converted_to_schedule -> awaiting_payment`);

    console.log("Migration Complete");
    process.exit(0);
  } catch (error) {
    console.error("Migration Error:", error);
    process.exit(1);
  }
};

migrateLegacyData();
