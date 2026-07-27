const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/kambata-travel")
  .then(async () => {
    console.log("Connected to MongoDB");
    const Review = require("./models/Review");
    try {
      await Review.collection.dropIndex("tour_1_user_1");
      console.log("Dropped tour_1_user_1 index");
    } catch (err) {
      console.log("Error dropping index:", err.message);
    }
    
    try {
      await Review.collection.dropIndex("package_1_user_1");
      console.log("Dropped package_1_user_1 index");
    } catch (err) {}
    try {
      await Review.collection.dropIndex("hotel_1_user_1");
      console.log("Dropped hotel_1_user_1 index");
    } catch (err) {}
    try {
      await Review.collection.dropIndex("guide_1_user_1_booking_1");
      console.log("Dropped guide_1_user_1_booking_1 index");
    } catch (err) {}
    
    await Review.syncIndexes();
    console.log("Re-synced indexes");
    process.exit(0);
  });
