const mongoose = require("mongoose");
require("dotenv").config({ path: "./.env" });

const TourRequest = require("./models/TourRequest");
const Tour = require("./models/Tour");
const Package = require("./models/Package");

async function checkRequests() {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    
    console.log("Connected to MongoDB.");
    
    const requests = await TourRequest.find()
      .populate("tourId", "title images destination")
      .populate("packageId", "name tour hotel price")
      .lean();
      
    console.log("Total Requests:", requests.length);
    
    requests.forEach(req => {
      console.log("Request ID:", req._id);
      console.log("Type:", req.requestType);
      console.log("Tour:", JSON.stringify(req.tourId, null, 2));
      console.log("Package:", JSON.stringify(req.packageId, null, 2));
      console.log("Status:", req.status);
      console.log("---");
    });

  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.disconnect();
  }
}

checkRequests();
