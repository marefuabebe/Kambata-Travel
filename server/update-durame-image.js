const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Tour = require("./models/Tour");

dotenv.config();

mongoose.connect(process.env.DATABASE_URI).then(async () => {
  console.log("Connected to MongoDB");
  
  try {
    const imageUrl = "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037908/kambata/c4fjijbxuyd0gbdlqshp.png";
    
    // Find the Durame Town tour (or any tour with Durame in title)
    const tour = await Tour.findOne({ "title.en": { $regex: /Durame/i } });
    
    if (tour) {
      tour.images = [imageUrl];
      await tour.save();
      console.log("Successfully updated Durame tour image!");
    } else {
      console.log("Could not find Durame Town tour.");
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
