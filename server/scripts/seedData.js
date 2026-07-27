const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Destination = require("../models/Destination");
const Tour = require("../models/Tour");
const User = require("../models/User");

dotenv.config({ path: require("path").join(__dirname, "../.env") });

const dbUrl = process.env.MONGO_URI || "mongodb://localhost:27017/kambata-travel";

const seedData = async () => {
  try {
    await mongoose.connect(dbUrl);
    console.log("MongoDB Connected for seeding...");

    // 1. Create/Find Seed User (Admin)
    let admin = await User.findOne({ role: "admin" });
    if (!admin) {
      admin = await User.create({
        name: "Seed Admin",
        email: "admin@kambatatravel.com",
        password: "password123",
        role: "admin",
        isEmailVerified: true
      });
      console.log("Created Seed Admin user.");
    }

    // 2. Create Guide
    let guide = await User.findOne({ email: "guide@kambatatravel.com" });
    if (!guide) {
      guide = await User.create({
        name: "Seed Guide",
        email: "guide@kambatatravel.com",
        password: "password123",
        role: "guide",
        guideStatus: "approved",
        isEmailVerified: true
      });
    }

    // Clear existing
    await Destination.deleteMany();
    await Tour.deleteMany();

    // 3. Create Destinations
    const dests = await Destination.create([
      {
        name: { en: "Mount Hambarcho", am: "ሀምባርቾ ተራራ" },
        description: { en: "The highest peak in Kambata with 777 stairs.", am: "በከምባታ ከፍተኛው ጫፍ 777 ደረጃዎች ያሉት።" },
        location: { woreda: "Durame", region: "Kambata Zone", coordinates: { lat: 7.23, lng: 37.89 } },
        images: ["/images/hambarcho_777.png"],
        category: ["nature", "adventure"],
        isPublished: true,
        rating: { average: 4.8, numReviews: 120 }
      },
      {
        name: { en: "Ajora Falls", am: "አጆራ ፏፏቴ" },
        description: { en: "Majestic twin falls in a lush canyon.", am: "ግርማ ሞገስ ያለው መንታ ፏፏቴ።" },
        location: { woreda: "Ajora", region: "Kambata Zone", coordinates: { lat: 7.15, lng: 37.80 } },
        images: ["/images/ajora_falls_tour.png"],
        category: ["nature"],
        isPublished: true,
        rating: { average: 4.9, numReviews: 85 }
      },
      {
        name: { en: "Durame Town", am: "ዱራሜ ከተማ" },
        description: { en: "The vibrant heart of Kambata culture.", am: "የከምባታ ባህል ንቁ ልብ።" },
        location: { woreda: "Durame", region: "Kambata Zone", coordinates: { lat: 7.24, lng: 37.89 } },
        images: ["/images/Durame.png"],
        category: ["culture"],
        isPublished: true,
        rating: { average: 4.5, numReviews: 210 }
      },
      {
        name: { en: "Sarobita Highlands", am: "ሳሮቢታ ተራራ" },
        description: { en: "Verdant hills and traditional homesteads.", am: "ለምለም ኮረብታዎች።" },
        location: { woreda: "Kambata", region: "Kambata Zone", coordinates: { lat: 7.20, lng: 37.85 } },
        images: ["/images/sarobita.png"],
        category: ["nature"],
        isPublished: true,
        rating: { average: 4.7, numReviews: 55 }
      }
    ]);

    // 4. Create Tours
    await Tour.create([
      {
        title: { en: "The 777 Stairs Challenge", am: "የ777 ደረጃዎች ፈተና" },
        description: { en: "Scale the heights of Mount Hambarcho.", am: "የሀምባርቾን ተራራ ጫፍ ይውጡ።" },
        destination: dests[0]._id,
        createdBy: admin._id,
        price: 34.50,
        category: "nature",
        duration: { value: 1, unit: "days" },
        durationInHours: 6,
        maxCapacity: 15,
        difficulty: "hard",
        images: ["/images/hambarcho_777.png"],
        isPublished: true,
        rating: { average: 4.8, numReviews: 45 },
        bookingsCount: 150,
        schedules: [{
           startDate: new Date("2026-05-01"),
           endDate: new Date("2026-05-01"),
           startTime: "08:00",
           remainingSlots: 15,
           guide: guide._id
        }]
      },
      {
        title: { en: "Gamosha Hot Spring Retreat", am: "የጋሞሻ ፍል ውሃ ጉዞ" },
        description: { en: "Relax in the natural thermal waters of Kambata.", am: "በተፈጥሮ ፍል ውሃ ይዝናኑ።" },
        destination: dests[2]._id,
        createdBy: admin._id,
        price: 15.00,
        category: "wellness",
        duration: { value: 4, unit: "hours" },
        durationInHours: 4,
        maxCapacity: 20,
        difficulty: "easy",
        images: ["/images/kambata_hero_bg.png"],
        isPublished: true,
        rating: { average: 4.9, numReviews: 32 },
        bookingsCount: 89,
        schedules: [{
           startDate: new Date("2026-05-02"),
           endDate: new Date("2026-05-02"),
           startTime: "10:00",
           remainingSlots: 20,
           guide: guide._id
        }]
      },
      {
        title: { en: "Ajora Twin Falls Expedition", am: "የአጆራ መንታ ፏፏቴ ጉዞ" },
        description: { en: "A deep dive into the lush canyon mist.", am: "ወደ ለምለም ካንየን ጉዞ።" },
        destination: dests[1]._id,
        createdBy: admin._id,
        price: 85.00,
        category: "nature",
        duration: { value: 2, unit: "days" },
        durationInHours: 36,
        maxCapacity: 8,
        difficulty: "moderate",
        images: ["/images/ajora_falls_tour.png"],
        isPublished: true,
        rating: { average: 4.9, numReviews: 18 },
        bookingsCount: 42,
        schedules: [{
           startDate: new Date("2026-05-05"),
           endDate: new Date("2026-05-07"),
           startTime: "07:00",
           remainingSlots: 8,
           guide: guide._id
        }]
      }
    ]);

    console.log("Database Seeded with Compliant Data Successfully!");
    process.exit();
  } catch (err) {
    console.error("Seeding Failed:", err);
    process.exit(1);
  }
};

seedData();
