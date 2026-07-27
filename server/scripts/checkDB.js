const mongoose = require("mongoose");
const Tour = require("../models/Tour");
const Destination = require("../models/Destination");
require("dotenv").config();

const dbUrl = process.env.MONGO_URI || "mongodb://localhost:27017/kambata-travel";

const checkDB = async () => {
  try {
    await mongoose.connect(dbUrl);
    const tours = await Tour.countDocuments();
    const dests = await Destination.countDocuments();
    console.log(`DB Status: Tours=${tours}, Destinations=${dests}`);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkDB();
