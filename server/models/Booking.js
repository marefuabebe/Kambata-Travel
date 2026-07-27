const mongoose = require("mongoose");
const { generateReferenceNumber } = require("../utils/referenceGenerator");

/**
 * Booking Model
 * Manages reservation state, waitlists, and payment tracking.
 */
const bookingSchema = mongoose.Schema(
  {
    referenceNumber: {
      type: String,
      unique: true,
      index: true,
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId, // Refers to the _id in Tour.schedules array; set after payment for request bookings
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
    guide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    specialRequests: {
      type: String,
      maxlength: 2000,
    },
    numPeople: {
      type: Number,
      required: [true, "Number of people is required"],
      min: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    platformFee: {
      type: Number,
    },
    guideEarnings: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "rejected", "cancelled", "waitlisted", "invited", "completed"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refund_pending", "refunded"],
      default: "pending",
    },
    payoutStatus: {
      type: String,
      enum: ["pending_completion", "pending_clearance", "cleared", "paid_out", "refunded"],
      default: "pending_completion",
    },
    completedAt: {
      type: Date,
    },
    hasDispute: {
      type: Boolean,
      default: false,
    },
    isReviewed: {
      type: Boolean,
      default: false,
    },
    attendanceStatus: {
      type: String,
      enum: ["pending", "present", "absent", "late"],
      default: "pending",
    },
    paymentExpiresAt: {
      type: Date, // Hold slots for 30 minutes
    },
    isReminderSent: {
      type: Boolean,
      default: false,
    },
    reminder7d: {
      type: Boolean,
      default: false,
    },
    reminder1d: {
      type: Boolean,
      default: false,
    },
    reminder2h: {
      type: Boolean,
      default: false,
    },
    invitationExpiresAt: {
      type: Date, // Valid for 15 minutes after promotion from waitlist
    },
    postTourEmailSent: {
      type: Boolean,
      default: false,
    },
    reviewReminderEmailSent: {
      type: Boolean,
      default: false,
    },
    // Payment Tracking
    tx_ref: {
      type: String,
      unique: true,
      sparse: true, // Only for those who initiate payment
    },
    transactionId: {
      type: String, // ID from Chapa/Telebirr
    },
    paymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String, // e.g., 'chapa', 'telebirr'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    slotsReserved: {
      type: Boolean,
      default: false,
    },
    checkedInAt: {
      type: Date,
    },
    earningsReleased: {
      type: Boolean,
      default: false,
    },
    chatRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatRoom",
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

// Indexes
bookingSchema.index({ tour: 1, scheduleId: 1 });
bookingSchema.index({ guide: 1, status: 1 });
bookingSchema.index({ user: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ createdAt: 1 }); // Important for FIFO waitlist

// Prevent duplicate active bookings for the same user/slot
// This will be enforced via pre-save hook for more flexible status checking
// but a unique index can help for basic cases if needed.

bookingSchema.pre("save", async function () {
  if (!this.referenceNumber) {
    this.referenceNumber = await generateReferenceNumber("TOUR");
  }
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
