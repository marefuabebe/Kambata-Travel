const mongoose = require("mongoose");
require("dotenv").config();
const Tour = require("./models/Tour");

async function fixSchedules() {
  await mongoose.connect(process.env.DATABASE_URI);
  console.log("Connected to DB");

  const tours = await Tour.find({});
  let updatedCount = 0;

  for (let tour of tours) {
    let modified = false;
    for (let i = 0; i < tour.schedules.length; i++) {
      if (!tour.schedules[i].meetingPoint) {
        tour.schedules[i].meetingPoint = tour.meetingPoint?.en || "TBA";
        modified = true;
      }
      if (!tour.schedules[i].endTime) {
        tour.schedules[i].endTime = "17:00"; // default fallback
        modified = true;
      }
    }

    if (modified) {
      try {
        await tour.save();
        updatedCount++;
        console.log(`Fixed schedules for tour: ${tour.title?.en || tour._id}`);
      } catch (err) {
        console.error(`Failed to fix tour ${tour._id}:`, err.message);
      }
    }
  }

  console.log(`Successfully fixed ${updatedCount} tours.`);
  process.exit(0);
}

fixSchedules().catch(console.error);
