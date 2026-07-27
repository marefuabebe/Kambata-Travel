const mongoose = require("mongoose");

/**
 * Destination Model for Kambata Zone Travel API
 * Optimized for search, filtering, and publishing control.
 */
const destinationSchema = mongoose.Schema(
  {
    name: {
      en: { type: String, required: [true, "English name is required"] },
      am: { type: String, required: [true, "Amharic name is required"] },
    },
    description: {
      en: { type: String, required: [true, "English description is required"] },
      am: { type: String, required: [true, "Amharic description is required"] },
    },
    gallery: [{ type: String }],
    highlights: [{ type: String }],
    culturalSignificance: { type: String },
    facilities: [{ type: String }],
    location: {
      region: {
        type: String,
        default: "Kambata Zone", // Project scope
        required: true,
      },
      woreda: {
        type: String,
        required: [true, "Woreda is required"],
      },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    images: [
      {
        type: String, // URLs to images
      },
    ],
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      numReviews: {
        type: Number,
        default: 0,
      },
    },
    category: [
      {
        type: String,
        enum: ["nature", "culture", "historical", "adventure", "religious", "geological", "wellness"],
        required: true,
      },
    ],
    tags: [{ type: String }],
    price: {
      level: {
        type: String,
        enum: ["Budget", "Mid-range", "Luxury"],
        default: "Budget",
      },
      averagePrice: {
        type: Number,
        default: 0,
      },
      currency: {
        type: String,
        default: "ETB",
      },
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for system-seeded data
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
destinationSchema.index({ "location.woreda": 1 });
destinationSchema.index({ category: 1 });
destinationSchema.index({ "rating.average": -1 });
destinationSchema.index({ isPublished: 1 }); // Crucial for public API performance

// Text index for search across languages
destinationSchema.index({ 
  "name.en": "text", 
  "name.am": "text", 
  "description.en": "text", 
  "description.am": "text" 
});

// Geospatial index
destinationSchema.index({ "location.coordinates": "2dsphere" });

const Destination = mongoose.model("Destination", destinationSchema);

module.exports = Destination;
