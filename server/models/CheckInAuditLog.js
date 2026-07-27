const mongoose = require("mongoose");

const checkInAuditLogSchema = mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    bookingType: {
      type: String,
      enum: ["tour", "package"],
      default: "tour",
    },
    travelerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    guideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    action: {
      type: String,
      enum: ["QR_SCANNED", "MANUAL_VERIFIED", "CHECKIN_COMPLETED", "CHECKIN_REJECTED", "PIN_FAILED"],
      required: true,
    },
    method: {
      type: String,
      enum: ["QR", "MANUAL"],
      required: true,
    },
    location: {
      latitude: Number,
      longitude: Number,
    },
    deviceInfo: {
      userAgent: String,
      ipAddress: String,
    },
    status: {
      type: String, // e.g. "Success", "Failed: GPS Mismatch", "Failed: Invalid PIN"
    },
    notes: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for admin queries
checkInAuditLogSchema.index({ createdAt: -1 });

const CheckInAuditLog = mongoose.model("CheckInAuditLog", checkInAuditLogSchema);

module.exports = CheckInAuditLog;
