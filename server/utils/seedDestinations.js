const mongoose = require("mongoose");
const Destination = require("../models/Destination");
require("dotenv").config();

const attractions = [
  {
    name: "Hambaricho Mountain (Habaricho 777)",
    description: "Major eco-tourism and cultural mountain site featuring the famous 777 symbolic staircase (now expanded to 1500+ steps). It leads to the summit of Mount Hambaricho, offering panoramic views of the Great Rift Valley.",
    highlights: [
      "777 symbolic steps (expanded to 1500+)",
      "3,058m mountain peak",
      "Great Rift Valley panoramic view",
      "Ancient Kambata kingdom historical site",
      "Annual international prayer gathering (50,000+ visitors)"
    ],
    culturalSignificance: "The number 777 represents seven kinship groups, seven mountain chains, and seven river systems in Kambata tradition.",
    facilities: [
      "Camping tents available",
      "Large traditional meeting hall (300+ capacity)"
    ],
    location: {
      woreda: "Durame",
      coordinates: { lat: null, lng: null }
    },
    category: ["culture", "adventure"],
    tags: ["mountain", "hiking", "culture", "spiritual", "history"],
    isPublished: true
  },
  {
    name: "Ajora Twin Waterfalls",
    description: "Twin waterfalls (Soke ~210m and Ajancho ~250m) plunging into a deep gorge, one of East Africa’s most dramatic waterfall systems.",
    location: {
      woreda: "Kachabira",
      coordinates: { lat: null, lng: null }
    },
    category: ["nature", "adventure"],
    tags: ["waterfall", "nature", "hiking"],
    highlights: ["Soke Waterfall (~210m)", "Ajancho Waterfall (~250m)", "Deep Gorge"],
    isPublished: true
  },
  {
    name: "Matana Waterfall",
    description: "Scenic waterfall surrounded by dense greenery and steep landscapes ideal for trekking and nature walks.",
    location: {
      woreda: "Kachabira",
      coordinates: { lat: null, lng: null }
    },
    category: ["nature"],
    tags: ["waterfall", "forest", "nature"],
    isPublished: true
  },
  {
    name: "Gamasha Hot Springs",
    description: "Therapeutic volcanic hot springs with developed pools used for relaxation and traditional healing.",
    location: {
      woreda: "Kachabira",
      coordinates: { lat: null, lng: null }
    },
    category: ["wellness"],
    tags: ["hot_spring", "wellness"],
    isPublished: true
  },
  {
    name: "Motoqoma (Iibbaalla) Hot Spring",
    description: "Natural healing hot spring surrounded by conserved forest, known for its spiritual and medicinal value.",
    location: {
      woreda: "Adilo Zuria",
      coordinates: { lat: null, lng: null }
    },
    category: ["wellness", "religious"],
    tags: ["hot_spring", "forest", "spiritual"],
    isPublished: true
  },
  {
    name: "Sarobira Landscape Viewpoint",
    description: "Wide dramatic landscape where rivers converge toward the Omo River basin, offering panoramic views.",
    location: {
      woreda: "Kambata Zone",
      coordinates: { lat: null, lng: null }
    },
    category: ["nature"],
    tags: ["viewpoint", "landscape"],
    isPublished: true
  },
  {
    name: "Yeigzer Dildy (Natural Bridge)",
    description: "Naturally formed rock bridge over the Sana River created without human intervention.",
    location: {
      woreda: "Ajora Route",
      coordinates: { lat: null, lng: null }
    },
    category: ["geological", "adventure"],
    tags: ["natural_bridge", "geology"],
    isPublished: true
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // Clear existing (optional - user requested real data, so let's start fresh)
    await Destination.deleteMany({ createdBy: null }); 

    await Destination.insertMany(attractions);
    console.log("Kambata Zone Attractions Seeded Successfully!");
    
    process.exit();
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
};

seedDB();
