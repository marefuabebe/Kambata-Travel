const mongoose = require("mongoose");

const REQUEST_AUDIT_EVENTS = [
  "REQUEST_CREATED",
  "GUIDE_ASSIGNED",
  "GUIDE_ACCEPTED",
  "GUIDE_DECLINED",
  "GUIDE_EXPIRED",
  "PAYMENT_LINK_SENT",
  "PAYMENT_CONFIRMED",
  "PAYMENT_EXPIRED",
  "REQUEST_CONFIRMED",
  "REQUEST_CANCELLED",
  "PRICE_ADJUSTED",
  "REQUEST_REJECTED",
];

const requestAuditLogSchema = mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TourRequest",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    role: {
      type: String,
      enum: ["traveler", "guide", "admin", "system"],
      default: "system",
    },
    event: {
      type: String,
      enum: REQUEST_AUDIT_EVENTS,
      required: true,
    },
    ipAddress: String,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

requestAuditLogSchema.index({ requestId: 1, createdAt: 1 });

const RequestAuditLog = mongoose.model("RequestAuditLog", requestAuditLogSchema);

module.exports = RequestAuditLog;
module.exports.REQUEST_AUDIT_EVENTS = REQUEST_AUDIT_EVENTS;
