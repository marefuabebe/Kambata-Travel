const mongoose = require("mongoose");

/**
 * BookingRequest Model
 * Used for "On-Demand" requests when no schedule exists.
 */
const bookingRequestSchema = mongoose.Schema(
  {
    traveler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    guide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: true,
    },
    requestedDate: {
      type: Date,
      required: true,
    },
    partySize: {
      type: Number,
      default: 1,
    },
    message: String,
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "withdrawn"],
      default: "pending",
    },
    chatRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
    },
    acceptedScheduleId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  }
);

const BookingRequest = mongoose.model("BookingRequest", bookingRequestSchema);

module.exports = BookingRequest;
