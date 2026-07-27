const mongoose = require("mongoose");

/**
 * Guide Model
 * Standalone model for specialized tour providers.
 * Segregates professional metadata from core user identity.
 */
const guideSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    bio: {
      en: { type: String, default: "Professional Local Guide" },
      am: { type: String, default: "ፕሮፌሽናል የአካባቢ መመሪያ" },
    },
    age: { type: Number },
    languages: [{ type: String, default: ["English", "Amharic"] }],
    experienceYears: { type: Number, default: 0 },
    certificationImage: { type: String }, // Legacy field
    nationalId: { 
      url: { type: String },
      public_id: { type: String },
      resource_type: { type: String },
      status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" }
    },
    license: { 
      url: { type: String },
      public_id: { type: String },
      resource_type: { type: String },
      status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" }
    },
    certificates: [{ 
      url: { type: String },
      public_id: { type: String },
      resource_type: { type: String },
      name: { type: String, default: "Certificate" },
      status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" }
    }],
    verificationPdfs: [{ 
      url: { type: String },
      public_id: { type: String },
      resource_type: { type: String },
      name: { type: String, default: "Verification Document" },
      status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" }
    }],
    
    status: {
      type: String,
      enum: ["pending", "verified", "approved", "rejected"],
      default: "pending",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    
    // Professional Multi-Badge System
    badges: [
      {
        name: { type: String }, // e.g., 'local_expert'
        iconUrl: { type: String }, // Custom icon imagery
        issuedAt: { type: Date, default: Date.now }
      }
    ],
    
    // Computed/Aggregated Stats
    stats: {
      completedBookings: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 }
    },

    specialties: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Performance Indexes
guideSchema.index({ status: 1, isVerified: 1 });
guideSchema.index({ "stats.averageRating": -1 });

const Guide = mongoose.model("Guide", guideSchema);

module.exports = Guide;
