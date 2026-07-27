require("dotenv").config();
const mongoose = require("mongoose");
const Booking = require("./models/Booking");

async function fixTours() {
  await mongoose.connect(process.env.DATABASE_URI);
  console.log("Connected to MongoDB.");

  // Find all bookings where status is "completed" but tourStatus is not "completed"
  const bookings = await Booking.find({ status: "completed", tourStatus: { $ne: "completed" } });
  
  console.log(`Found ${bookings.length} bookings to fix.`);

  for (const booking of bookings) {
    booking.tourStatus = "completed";
    await booking.save();
  }

  console.log("Done fixing bookings!");
  process.exit(0);
}

fixTours().catch(err => {
  console.error(err);
  process.exit(1);
});
