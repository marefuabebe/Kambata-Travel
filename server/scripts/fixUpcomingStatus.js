const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.DATABASE_URI).then(async () => {
  // Fix all Tour schedules with invalid 'upcoming' status -> 'published'
  const result = await mongoose.connection.collection("tours").updateMany(
    { "schedules.status": "upcoming" },
    { $set: { "schedules.$[elem].status": "published" } },
    { arrayFilters: [{ "elem.status": "upcoming" }] }
  );
  console.log(`[SUCCESS] Fixed ${result.modifiedCount} tour(s) with stale 'upcoming' schedule status → 'published'`);
  mongoose.disconnect();
}).catch(e => {
  console.error("[ERROR]:", e.message);
  process.exit(1);
});
