const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const { uploadImage } = require("../utils/cloudinary");
const Tour = require("../models/Tour");
const Destination = require("../models/Destination");

dotenv.config({ path: path.join(__dirname, "../.env") });

const dbUrl = process.env.MONGO_URI || "mongodb://localhost:27017/kambata-travel";

const migrate = async () => {
  try {
    await mongoose.connect(dbUrl);
    console.log("MongoDB Connected for Migration...");

    const frontendPublicPath = path.join(__dirname, "../../frontend/public");

    // 1. Migrate Destinations
    const destinations = await Destination.find({});
    console.log(`Found ${destinations.length} destinations to migrate.`);

    for (const dest of destinations) {
      if (dest.images && dest.images.length > 0) {
        const newImages = [];
        for (const imgPath of dest.images) {
           // Check if it's already a Cloudinary URL
           if (imgPath.includes("cloudinary.com")) {
             newImages.push(imgPath);
             continue;
           }

           const absolutePath = path.join(frontendPublicPath, imgPath);
           if (fs.existsSync(absolutePath)) {
             console.log(`Uploading Destination Image: ${imgPath}`);
             const result = await uploadImage(absolutePath, "kambata-travel/destinations");
             newImages.push(result.url);
           } else {
             console.warn(`File not found: ${absolutePath}`);
             newImages.push(imgPath);
           }
        }
        dest.images = newImages;
        await dest.save();
      }
    }

    // 2. Migrate Tours
    const tours = await Tour.find({});
    console.log(`Found ${tours.length} tours to migrate.`);

    for (const tour of tours) {
      if (tour.images && tour.images.length > 0) {
        const newImages = [];
        for (const imgPath of tour.images) {
           if (imgPath.includes("cloudinary.com")) {
             newImages.push(imgPath);
             continue;
           }

           const absolutePath = path.join(frontendPublicPath, imgPath);
           if (fs.existsSync(absolutePath)) {
             console.log(`Uploading Tour Image: ${imgPath}`);
             const result = await uploadImage(absolutePath, "kambata-travel/tours");
             newImages.push(result.url);
           } else {
             console.warn(`File not found: ${absolutePath}`);
             newImages.push(imgPath);
           }
        }
        tour.images = newImages;
        await tour.save();
      }
    }

    console.log("Cloudinary Migration Completed Successfully!");
    process.exit();
  } catch (err) {
    console.error("Migration Failed:", err);
    process.exit(1);
  }
};

migrate();
