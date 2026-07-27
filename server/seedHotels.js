require("dotenv").config();
const mongoose = require("mongoose");
const Hotel = require("./models/Hotel");
const User = require("./models/User");

const seedHotels = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    console.log("Connected to MongoDB");

    // Get an admin user to set as createdBy
    const admin = await User.findOne({ role: "admin" });
    const adminId = admin ? admin._id : null;

    const hotels = [
      "Mesala Hotel",
      "Wojo Hotel",
      "Mintesnot Hotel",
      "Yichalal Hotel",
      "Aberash Hotel",
      "Hambaricho View Hotel",
      "Kebron International Hotel"
    ];

    for (const name of hotels) {
      const existing = await Hotel.findOne({ name });
      if (!existing) {
        await Hotel.create({
          name: name,
          location: "Durame",
          description: `Welcome to ${name}, providing excellent hospitality in the heart of Kambaata.`,
          contactNumber: "+251900000000",
          amenities: ["Free WiFi", "Restaurant", "Parking"],
          status: "active",
          createdBy: adminId,
          roomTypes: [
            {
              name: "Standard Room",
              description: "Comfortable room with a queen bed.",
              pricePerNight: 1500, // example in ETB
              capacity: 2,
              totalInventory: 10
            },
            {
              name: "Deluxe Room",
              description: "Spacious room with beautiful views.",
              pricePerNight: 2500,
              capacity: 2,
              totalInventory: 5
            }
          ]
        });
        console.log(`Created hotel: ${name}`);
      } else {
        console.log(`Hotel already exists: ${name}`);
      }
    }

    console.log("Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedHotels();
