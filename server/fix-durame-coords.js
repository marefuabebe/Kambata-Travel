const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Destination = require("./models/Destination");

dotenv.config();

mongoose.connect(process.env.DATABASE_URI).then(async () => {
  console.log("Connected to MongoDB");
  
  try {
    const destination = await Destination.findOne({ "name.en": { $regex: /Durame/i } });
    if (destination) {
      console.log("Found Destination:", destination.name.en);
      console.log("Coordinates:", destination.location.coordinates);
      
      // If coordinates are missing or wrong, let's fix them to real Durame coordinates
      // Real coordinates of Durame Town: ~ 7.2384° N, 37.8925° E
      if (!destination.location.coordinates || !destination.location.coordinates.lat || destination.location.coordinates.lat === 9.032) {
         destination.location.coordinates = {
           lat: 7.2384,
           lng: 37.8925
         };
         await destination.save();
         console.log("Updated Durame coordinates to 7.2384, 37.8925");
      }
    } else {
      console.log("Could not find Durame destination.");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit();
  }
}).catch(err => {
  console.error("Connection error:", err);
  process.exit();
});
