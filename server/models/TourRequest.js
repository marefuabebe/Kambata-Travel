const mongoose = require("mongoose");

const tourRequestSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
    },
    requestType: {
      type: String,
      enum: ["custom_date", "private_tour", "waitlist"],
      required: true,
    },
    preferredDate: {
      type: Date,
    },
    preferredTime: {
      type: String,
    },
    travelers: {
      type: Number,
      required: true,
      min: 1,
    },
    preferredGuide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: String,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["pending_admin", "guide_pending", "accepted", "rejected", "declined_by_guide", "expired", "payment_expired", "awaiting_payment", "confirmed", "completed", "cancelled"],
      default: "pending_admin",
    },
    adminNotes: {
      type: String,
    },
    customPrice: {
      type: Number,
    },
    finalPrice: {
      type: Number,
    },
    paymentExpiresAt: {
      type: Date,
    },
    guideReservationExpiresAt: {
      type: Date,
    },
    assignedSchedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Schedule",
    },
    assignedGuide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const TourRequest = mongoose.model("TourRequest", tourRequestSchema);

module.exports = TourRequest;
