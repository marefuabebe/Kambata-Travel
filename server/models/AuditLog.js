const mongoose = require("mongoose");

/**
 * Immutable audit trail for critical admin actions.
 * Append-only: updates and deletes are blocked at the schema level.
 */
const auditLogSchema = mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        // ── User Management ──────────────────────────────────────
        "USER_DELETED",
        "ROLE_CHANGED",
        "USER_BLOCKED",
        "USER_UNBLOCKED",
        "USER_SUSPENDED",
        "PASSWORD_OVERRIDE",
        // ── Guide Management ─────────────────────────────────────
        "GUIDE_APPROVED",
        "GUIDE_REJECTED",
        "GUIDE_VERIFIED",
        "SCHEDULING_PRIVILEGE_REVOKED",
        "SCHEDULING_PRIVILEGE_RESTORED",
        // ── Booking & Tour ────────────────────────────────────────
        "MANUAL_BOOKING_CREATED",
        "BOOKING_CANCELLED_ADMIN",
        "BOOKING_FORCE_CANCELLED",
        "TOUR_CREATED",
        "TOUR_DELETED",
        "TOUR_TEMPLATE_CREATED",
        "TOUR_TEMPLATE_UPDATED",
        "TOUR_TEMPLATE_DELETED",
        // ── Destination ───────────────────────────────────────────
        "DESTINATION_CREATED",
        "DESTINATION_UPDATED",
        "DESTINATION_DELETED",
        // ── Tour Requests ─────────────────────────────────────────
        "REQUEST_CREATED",
        "ADMIN_REVIEW_STARTED",
        "GUIDE_ASSIGNED",
        "PRICE_ADJUSTED",
        "GUIDE_ACCEPTED",
        "GUIDE_DECLINED",
        "GUIDE_AUTO_EXPIRED",
        "GUIDE_REASSIGNED",
        "REASSIGNMENT_TRIGGERED",
        "REQUEST_EXPIRED",
        "REQUEST_CONFIRMED",
        // ── Payment Events (all payment lifecycle events) ─────────
        "PAYMENT_INITIATED",
        "PAYMENT_LINK_SENT",
        "PAYMENT_SUCCESS",
        "PAYMENT_FAILED",
        "PAYMENT_REFUNDED",
        "PAYMENT_VERIFY_CALLED",
        "PAYMENT_OVERRIDE",
        "REFUND_ISSUED",
        "MANUAL_REFUND_ISSUED",
        "PAYOUT_PROCESSED",
        // ── Reviews ───────────────────────────────────────────────
        "REVIEW_DELETED",
        "REVIEW_HIDDEN",
        "REVIEW_RESTORED",
        // ── Payouts & Earnings ──────────────────────────────────────
        "WITHDRAWAL_REQUEST_CREATED",
        "WITHDRAWAL_CANCELLED",
        "WITHDRAWAL_APPROVED",
        "WITHDRAWAL_COMPLETED",
        "PAYOUT_REJECTED",
        "EARNINGS_CLEARED",
        "AUTO_CLEAR_EARNINGS_RAN",
        // ── Disputes & Completions ──────────────────────────────────
        "DISPUTE_CREATED",
        "DISPUTE_RESOLVED",
        "TRAVELER_CONFIRMED",
        // ── System ────────────────────────────────────────────────
        "GLOBAL_ANNOUNCEMENT_SENT",
      ],
    },
    targetType: {
      type: String,
      required: true,
      enum: ["User", "Booking", "Tour", "Transaction", "PayoutRequest", "Review", "Destination", "System", "TourRequest"],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: function () {
        return this.targetType !== "System";
      },
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    timestamps: false,
  }
);

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetId: 1 });
auditLogSchema.index({ createdAt: -1 });

const blockMutation = function () {
  throw new Error("Audit logs are immutable and cannot be modified or deleted");
};
auditLogSchema.pre("updateOne", blockMutation);
auditLogSchema.pre("findOneAndUpdate", blockMutation);
auditLogSchema.pre("deleteOne", blockMutation);
auditLogSchema.pre("findOneAndDelete", blockMutation);

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = AuditLog;
