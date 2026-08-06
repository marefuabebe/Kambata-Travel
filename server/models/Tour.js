const mongoose = require("mongoose");

/**
 * Tour & Package Model
 * Optimized for complex scheduling, capacity, and difficulty filtering.
 */
const tourSchema = mongoose.Schema(
  {
    title: {
      en: { type: String, required: [true, "English title is required"] },
      am: { type: String, required: [true, "Amharic title is required"] },
    },
    description: {
      en: { type: String, required: [true, "English description is required"] },
      am: { type: String, required: [true, "Amharic description is required"] },
    },
    category: {
      type: String,
      required: [true, "Tour category is required (e.g., Adventure, Culture, Relax)"],
      index: true,
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Destination",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
    duration: {
      value: { 
        type: Number, 
        required: true,
        min: [1, "Minimum tour duration must be 1 day"]
      },
      unit: {
        type: String,
        enum: ["days", "weeks", "hours"],
        default: "days",
        required: true,
      },
    },
    difficulty: {
      type: String,
      enum: ["easy", "moderate", "hard"],
      required: true,
    },
    durationInHours: {
      type: Number,
      index: true,
    },
    bookingType: {
      type: String,
      enum: ["instant", "request", "both"],
      default: "both",
    },
    itinerary: [
      {
        day: { type: Number },
        title: {
          en: { type: String, required: true },
          am: { type: String },
        },
        description: {
          en: { type: String, required: true },
          am: { type: String },
        },
        startTime: { type: String },
        location: {
          lat: { type: Number },
          lng: { type: Number },
        },
      }
    ],
    images: [{ type: String }],
    maxCapacity: {
      type: Number,
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    /** Admin-owned supply blueprint; guides only attach schedules */
    isBlueprint: {
      type: Boolean,
      default: false,
      index: true,
    },
    meetingPoint: {
      en: { type: String, default: "" },
      am: { type: String, default: "" },
    },
    schedules: [
      {
        guide: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        remainingSlots: {
          type: Number,
          default: function () {
            return this.parent().maxCapacity;
          },
        },
        status: {
          type: String,
          enum: ["draft", "published", "upcoming", "full", "in_progress", "completed", "cancelled"],
          default: "draft",
        },
        assignmentStatus: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
        incidentReport: {
          type: String,
          maxlength: 2000,
        },
        meetingPoint: {
          type: String,
          required: true,
        },
        priceOverride: {
          type: Number,
        },
        specialNotes: {
          type: String,
          maxlength: 2000,
        },
        attendanceLocked: {
          type: Boolean,
          default: false,
        },
        guideNotes: { type: String, maxlength: 2000 },
        scheduleType: {
          type: String,
          enum: ["public", "private"],
          default: "public",
        },
        requestedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        linkedRequestId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "TourRequest",
        },
      },
    ],
    rating: {
      average: { type: Number, default: 0 },
      numReviews: { type: Number, default: 0 },
    },
    bookingsCount: {
      type: Number,
      default: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    itinerary: [
      {
        day: Number,
        title: {
          en: { type: String },
          am: { type: String },
        },
        description: {
          en: { type: String },
          am: { type: String },
        },
        startTime: String,
        location: {
          lat: Number,
          lng: Number,
        },
      },
    ],
    gallery: [{ type: String }],
    facilities: [
      {
        type: String,
        enum: [
          "hiking_required",
          "drinking_water_provided",
          "no_wifi",
          "local_guide_required",
          "coffee_ceremony",
          "indigenous_food",
          "religious_site_etiquette",
          "mules_available",
          "photography_allowed",
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
tourSchema.index({ destination: 1 });
tourSchema.index({ createdBy: 1 });
tourSchema.index({ price: 1 });
tourSchema.index({ difficulty: 1 });
tourSchema.index({ isPublished: 1 });
tourSchema.index({ "schedules.startDate": 1 });

// COMPOUND INDEXES for optimized filtering
tourSchema.index({ isPublished: 1, category: 1, price: 1 });
tourSchema.index({ isPublished: 1, destination: 1, price: 1 });
tourSchema.index({ isPublished: 1, difficulty: 1, price: 1 });

// Full-text search across languages
tourSchema.index({ 
  "title.en": "text", 
  "title.am": "text", 
  "description.en": "text", 
  "description.am": "text",
  "itinerary.title.en": "text",
  "itinerary.title.am": "text",
  "itinerary.description.en": "text",
  "itinerary.description.am": "text"
});

// Pre-save hook to calculate duration in hours
tourSchema.pre("save", function () {
  if (this.isModified("duration")) {
    if (this.duration.unit === "days") {
      this.durationInHours = this.duration.value * 24;
    } else if (this.duration.unit === "weeks") {
      this.durationInHours = this.duration.value * 24 * 7;
    } else {
      this.durationInHours = this.duration.value;
    }
  }
});

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
