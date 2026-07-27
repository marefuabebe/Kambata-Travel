const mongoose = require("mongoose");

/**
 * Notification Model
 * Manages user alerts with priority levels and automatic 30-day cleanup.
 */
const notificationSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["booking", "payment", "reminder", "system"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["HIGH", "NORMAL", "LOW"],
      default: "NORMAL",
    },
    message: {
      type: String,
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId, // Link to booking or tour
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: { expires: 30 * 24 * 60 * 60 }, // TTL index: Auto-delete after 30 days
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient dashboard loading
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
