const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/kambata-travel")
  .then(async () => {
    console.log("Connected to MongoDB");
    const Tour = require("./models/Tour");
    const durame = await Tour.findOne({ "title.en": "Durame Town" });
    if (durame) {
      console.log("Durame Town found:");
      console.log("canInstantBook:", durame.canInstantBook);
      console.log("canRequestDate:", durame.canRequestDate);
      console.log("Schedules:");
      durame.schedules.forEach(s => {
        console.log(`- ID: ${s._id}, Start: ${s.startDate}, Status: ${s.status}, Guide: ${s.guide}`);
      });
    } else {
      console.log("Durame Town not found.");
    }
    process.exit(0);
  });
