const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Destination = require("../models/Destination");
const Tour = require("../models/Tour");
const User = require("../models/User");

dotenv.config({ path: require("path").join(__dirname, "../.env") });

const dbUrl = process.env.MONGO_URI || "mongodb://localhost:27017/kambata-travel";

const debugSeed = async () => {
  try {
    await mongoose.connect(dbUrl);
    console.log("Connected...");

    const admin = await User.findOne({ role: "admin" });
    const dest = await Destination.findOne({});

    if (!admin || !dest) {
      console.error("Missing admin or destination.");
      process.exit(1);
    }

    const tourData = {
        title: { en: "Debug Tour", am: "ሙከራ" },
        description: { en: "Debug Desc", am: "ሙከራ" },
        destination: dest._id,
        createdBy: admin._id,
        price: 10,
        category: "nature",
        duration: { value: 1, unit: "days" },
        maxCapacity: 10,
        difficulty: "easy",
        isPublished: true,
        schedules: [{
           startDate: new Date(),
           endDate: new Date()
        }]
    };

    console.log("Attempting to create tour...");
    const tour = await Tour.create(tourData);
    console.log("Success! Tour ID:", tour._id);
    process.exit(0);
  } catch (err) {
    console.error("DEBUG SEED FAILED!");
    if (err.errors) {
       Object.keys(err.errors).forEach(key => {
         console.error(`- ${key}: ${err.errors[key].message}`);
       });
    } else {
       console.error(err.message);
    }
    process.exit(1);
  }
};

debugSeed();
