const mongoose = require("mongoose");
const Destination = require("../models/Destination");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const dbUrl = process.env.MONGO_URI || "mongodb://localhost:27017/kambata-travel";

const updateSarobitaImage = async () => {
  try {
    await mongoose.connect(dbUrl);
    
    // Find Sarobita destination
    const dest = await Destination.findOne({ "name.en": { $regex: /Sarobita/i } });
    
    if (dest) {
      dest.images = ["https://res.cloudinary.com/dzf4st3t2/image/upload/v1776362718/Gemini_Generated_Image_bmo32hbmo32hbmo3_axyzig.png"];
      await dest.save();
      console.log(`Updated images for: ${dest.name.en}`);
    } else {
      console.error("Destination not found.");
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

updateSarobitaImage();
