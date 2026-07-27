const mongoose = require("mongoose");

/**
 * PayoutRequest Model
 * Tracks guide withdrawal requests and banking information.
 */
const payoutRequestSchema = mongoose.Schema(
  {
    guide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "Payout amount is required"],
    },
    bankInfo: {
      bankName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      accountHolder: { type: String, required: true },
      telebirr: { type: String }, // Optional as per requirements
    },
    status: {
      type: String,
      enum: ["pending", "approved", "completed", "rejected", "cancelled"],
      default: "pending",
    },
    adminNote: {
      type: String,
    },
    processedAt: {
      type: Date,
    },
    transactionReference: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const PayoutRequest = mongoose.model("PayoutRequest", payoutRequestSchema);

module.exports = PayoutRequest;
