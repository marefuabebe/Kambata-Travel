const mongoose = require("mongoose");

/**
 * Transaction Model
 * Authoritative financial record for all payment attempts and outcomes.
 * Optimized for auditing and reporting.
 */
const transactionSchema = mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "ETB",
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String, // e.g., 'chapa', 'telebirr'
    },
    tx_ref: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    providerTransactionId: {
      type: String, // Official ID from Chapa/Telebirr
    },
    rawPayload: {
      type: Object, // Store the full response from the provider
    },
    refundAmount: {
      type: Number,
      default: 0
    },
    refundReason: String,
    // Security/Audit Metadata
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
