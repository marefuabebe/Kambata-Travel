const mongoose = require("mongoose");

/**
 * BlacklistedIP Model
 * Stores malicious IP addresses to protect the platform from repeated attacks.
 * Features auto-expiry via TTL index.
 */
const blacklistedIPSchema = mongoose.Schema(
  {
    ip: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
    },
    attemptsCount: {
      type: Number,
      default: 0,
    },
    blockedUntil: {
      type: Date,
      required: true,
    },
    // TTL Index: Automatically remove the record after the block expires
    // This keeps the database clean.
    createdAt: {
      type: Date,
      default: Date.now,
      index: { expires: "24h" }, // Match your 24h business rule
    },
  },
  {
    timestamps: true,
  }
);

const BlacklistedIP = mongoose.model("BlacklistedIP", blacklistedIPSchema);

module.exports = BlacklistedIP;
