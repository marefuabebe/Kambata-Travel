const mongoose = require("mongoose");
const Booking = require("./models/Booking");
const PackageBooking = require("./models/PackageBooking");
const Tour = require("./models/Tour");
const Package = require("./models/Package");

async function run() {
  try {
    await mongoose.connect("mongodb://localhost:27017/kambata-travel");
    console.log("Connected to DB");

    const sarobiraTour = await Tour.findOne({ "title.en": { $regex: /Sarobira/i } });
    if (!sarobiraTour) {
      console.log("Tour 'Sarobira Highlands' not found!");
      process.exit(1);
    }

    console.log("Found Sarobira Tour with ID:", sarobiraTour._id);

    const bookingsDeleted = await Booking.deleteMany({ tour: { $ne: sarobiraTour._id } });
    console.log(`Deleted ${bookingsDeleted.deletedCount} tour bookings.`);

    const packagesWithSarobira = await Package.find({ tour: sarobiraTour._id });
    const packageIds = packagesWithSarobira.map(p => p._id);

    const packageBookingsDeleted = await PackageBooking.deleteMany({ packageId: { $nin: packageIds } });
    console.log(`Deleted ${packageBookingsDeleted.deletedCount} package bookings.`);

  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
