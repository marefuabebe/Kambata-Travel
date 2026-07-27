const mongoose = require("mongoose");

/**
 * Wallet Model for Guides
 * Tracks available earnings, lifetime revenue, and pending payouts.
 */
const walletSchema = mongoose.Schema(
  {
    guide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarned: {
      type: Number,
      default: 0,
    },
    pendingEarnings: {
      type: Number,
      default: 0,
    },
    pendingPayout: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "ETB",
    },
  },
  {
    timestamps: true,
  }
);

const Wallet = mongoose.model("Wallet", walletSchema);

module.exports = Wallet;
