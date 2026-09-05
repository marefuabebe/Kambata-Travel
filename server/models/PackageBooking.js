const mongoose = require("mongoose");
const { generateReferenceNumber } = require("../utils/referenceGenerator");

const packageBookingSchema = mongoose.Schema(
  {
    referenceNumber: {
      type: String,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },
    packageScheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PackageSchedule",
      required: function() {
        return this.bookingStatus === "confirmed" || this.bookingStatus === "completed";
      },
    },
    travelersCount: {
      type: Number,
      required: true,
      min: 1,
    },
    roomsBooked: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "rejected", "cancelled", "completed", "expired"],
      default: "pending",
    },
    paymentIntentId: {
      type: String,
    },
    checkedInAt: {
      type: Date,
    },
    bookingSource: {
      type: String,
      enum: ["instant", "request"],
      default: "instant",
    },
    linkedRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TourRequest",
    },
    paymentExpiresAt: {
      type: Date,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "refund_pending"],
      default: "pending",
    },
    attendanceStatus: {
      type: String,
      enum: ["pending", "present", "no_show", "late"],
      default: "pending",
    },
    isReviewed: {
      type: Boolean,
      default: false,
    },
    tx_ref: {
      type: String,
      index: true,
    },
    transactionId: {
      type: String,
    },
    // QR Code Verification
    qrTokenHash: {
      type: String,
      sparse: true,
    },
    qrNonce: {
      type: String,
    },
    qrGeneratedAt: {
      type: Date,
    },
    qrExpiresAt: {
      type: Date,
    },
    qrUsed: {
      type: Boolean,
      default: false,
    },
    pinCode: {
      type: String, // 4-digit PIN
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
    },
    verifiedByGuide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verificationLogs: [
      {
        timestamp: { type: Date, default: Date.now },
        action: String,
        guideId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        travelerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        ipAddress: String,
        deviceInfo: String,
        geoLocation: String,
        success: Boolean,
        status: String,
      }
    ],
    tourStatus: {
      type: String,
      enum: ["upcoming", "started", "completed"],
      default: "upcoming",
    },
  },
  {
    timestamps: true,
  }
);



packageBookingSchema.pre("save", async function () {
  if (!this.referenceNumber) {
    this.referenceNumber = await generateReferenceNumber("PKG");
  }
});

const PackageBooking = mongoose.model("PackageBooking", packageBookingSchema);

module.exports = PackageBooking;
