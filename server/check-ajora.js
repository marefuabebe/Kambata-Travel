const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/kambata-travel")
  .then(async () => {
    console.log("Connected to MongoDB");
    const Tour = require("./models/Tour");
    const ajora = await Tour.findOne({ "title.en": "Ajora Falls" });
    if (ajora) {
      console.log("Ajora Falls found:");
      console.log("Schedules:");
      ajora.schedules.forEach(s => {
        console.log(`- ID: ${s._id}, Start: ${s.startDate}, Status: ${s.status}, Guide: ${s.guide}`);
      });
    } else {
      console.log("Ajora Falls not found.");
    }
    process.exit(0);
  });
