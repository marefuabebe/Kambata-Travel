require("dotenv").config();
const mongoose = require("mongoose");
const Tour = require("./models/Tour");
const User = require("./models/User");

const seedTours = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    console.log("Connected to MongoDB");

    // Get an admin user to set as createdBy
    const admin = await User.findOne({ role: "admin" });
    const adminId = admin ? admin._id : null;

    const tours = [
      "Durame City Explorer",
      "Hambaricho Mountain Hike",
      "Kambaata Cultural Tour",
      "Ajora Waterfalls Trip"
    ];

    for (const name of tours) {
      const existing = await Tour.findOne({ "title.en": name });
      if (!existing) {
        await Tour.create({
          title: { en: name, am: `${name} (Amharic)` },
          description: { en: `Explore ${name} with our expert guides.`, am: "አማርኛ መግለጫ" },
          location: "Kambaata Zone",
          duration: { value: 1, unit: "days" },
          price: 500,
          maxGroupSize: 15,
          difficulty: "easy",
          included: [{ en: "Transport", am: "ትራንስፖርት" }],
          notIncluded: [{ en: "Lunch", am: "ምሳ" }],
          images: ["https://res.cloudinary.com/dzf4st3t2/image/upload/v1720176848/samples/landscapes/nature-mountains.jpg"],
          status: "active",
          createdBy: adminId,
          itinerary: [{ day: 1, title: { en: "Arrival", am: "መድረስ" }, description: { en: "Start tour", am: "መጀመር" } }],
          schedules: [
            {
              startDate: new Date(Date.now() + 86400000 * 7), // Next week
              endDate: new Date(Date.now() + 86400000 * 8),
              availableSlots: 15
            }
          ]
        });
        console.log(`Created tour: ${name}`);
      } else {
        console.log(`Tour already exists: ${name}`);
      }
    }

    console.log("Tour seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seedTours();
