const mongoose = require("mongoose");

const packageSchema = mongoose.Schema(
  {
    name: {
      en: { type: String, required: [true, "English package name is required"] },
      am: { type: String, required: [true, "Amharic package name is required"] },
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: [true, "A Tour is required for a package"],
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: [true, "A Hotel is required for a package"],
    },
    roomTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "A specific Hotel Room Type is required for a package"],
    },
    duration: {
      value: { 
        type: Number, 
        required: true,
        min: [1, "Minimum duration must be 1 day"]
      },
      unit: {
        type: String,
        enum: ["days"],
        default: "days",
        required: true,
      },
    },
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
    },
    description: {
      en: { type: String, required: [true, "English description is required"] },
      am: { type: String, required: [true, "Amharic description is required"] },
    },
    includedServices: [
      {
        en: { type: String },
        am: { type: String },
      },
    ],
    images: [{ type: String }],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    schedules: [
      {
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        availableSlots: { type: Number, required: true },
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
  },
  {
    timestamps: true,
  }
);

packageSchema.index({ status: 1 });
packageSchema.index({ "name.en": "text", "name.am": "text" });

const Package = mongoose.model("Package", packageSchema);
module.exports = Package;
