const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function() {
        return this.authProvider === 'local';
      },
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    role: {
      type: String,
      required: true,
      default: "user",
    },
    rating: {
      average: { type: Number, default: 0 },
      numReviews: { type: Number, default: 0 },
    },
    // Email Verification Fields
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationOTP: String,
    emailVerificationExpires: Date,
    // Password Reset OTP Fields
    resetPasswordOTP: String,
    resetPasswordExpires: Date,
    otpAttempts: {
      type: Number,
      default: 0,
    },
    lastOtpRequest: {
      type: Date,
    },
    otpRequestCount: {
      type: Number,
      default: 0,
    },
    otpRequestWindowStart: {
      type: Date,
    },
    // Security/Blocking Fields
    loginAttempts: {
      type: Number,
      default: 0,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedUntil: {
      type: Date,
    },
    trustedDevices: [
      {
        deviceId: String,
        userAgent: String,
        deviceName: String,
        lastSeenAt: Date,
        ipHistory: [String],
        addedAt: { type: Date, default: Date.now },
      }
    ],
    lastScannerDevice: String,
    /** Temporary suspension — login blocked until this date */
    suspendedUntil: {
      type: Date,
    },
    /** Admin revoke: guide cannot add or manage schedules */
    schedulingDisabled: {
      type: Boolean,
      default: false,
    },
    guideStatus: {
      type: String,
      enum: ["none", "pending", "verified", "approved", "rejected"],
      default: "none",
    },
    // Profile & Contact Info
    phone: String,
    location: String,
    profilePicture: String,
    // Payout Preferences
    bankDetails: {
      bankName: String,
      accountHolder: String,
      accountNumber: String,
    },
    mobileMoney: {
      provider: String,
      phoneNumber: String,
    },
    // Guide Specialized Profile Link
    guideProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guide",
    },
    // Emergency Contact
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    // User Settings
    settings: {
      notifications: {
        emailAlerts: { type: Boolean, default: true },
        bookingUpdates: { type: Boolean, default: true },
        reminders: { type: Boolean, default: true },
      },
      privacy: {
        profileVisibility: { type: String, enum: ["public", "private"], default: "public" },
        travelHistoryVisibility: { type: String, enum: ["public", "private", "guides_only"], default: "guides_only" },
      },
      ui: {
        language: { type: String, default: "en" },
        theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
      },
    },
    // Recommendation Engine Preferences
    preferences: {
      interests: [String], // Array of categories viewed/booked
      preferredLocation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Destination",
      },
      budget: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
      },
      maxDuration: { type: Number, default: 0 }, // In hours
      difficulty: { type: String, enum: ["Easy", "Moderate", "Challenging", "Extreme", ""] },
      groupType: { type: String, enum: ["Solo", "Couple", "Family", "Group", ""] },
    },
  },
  {
    timestamps: true,
  }
);

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

module.exports = User;
