const mongoose = require("mongoose");
const Tour = require("../models/Tour");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const dbUrl = process.env.MONGO_URI || "mongodb://localhost:27017/kambata-travel";

const updateTourImage = async () => {
  try {
    await mongoose.connect(dbUrl);
    
    // Find Gamosha tour
    const tour = await Tour.findOne({ "title.en": { $regex: /Gamosha/i } });
    
    if (tour) {
      tour.images = ["/images/GamoshaHotSpring.png"];
      await tour.save();
      console.log(`Updated images for: ${tour.title.en} to GamoshaHotSpring.png`);
    } else {
      console.error("Tour not found.");
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

updateTourImage();
