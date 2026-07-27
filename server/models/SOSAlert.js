const mongoose = require("mongoose");

const sosAlertSchema = mongoose.Schema(
  {
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["traveler", "guide"],
      required: true,
    },
    type: {
      type: String,
      enum: [
        "medical_emergency",
        "safety_threat",
        "accident",
        "natural_disaster",
        "lost_traveler",
        "guide_no_show",
        "vehicle_breakdown",
        "harassment",
        "other",
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "high",
    },
    description: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    // Optional: link to a booking or tour for context
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    tourName: { type: String },
    // Status tracking
    status: {
      type: String,
      enum: ["open", "acknowledged", "in_progress", "resolved", "false_alarm"],
      default: "open",
    },
    adminNote: { type: String, trim: true },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // Contact preference
    contactPhone: { type: String },
  },
  { timestamps: true }
);

sosAlertSchema.index({ status: 1, createdAt: -1 });
sosAlertSchema.index({ submittedBy: 1, createdAt: -1 });
sosAlertSchema.index({ severity: 1, status: 1 });

module.exports = mongoose.model("SOSAlert", sosAlertSchema);
