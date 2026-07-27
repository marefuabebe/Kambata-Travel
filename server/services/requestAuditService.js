const RequestAuditLog = require("../models/RequestAuditLog");
const logger = require("../utils/logger");

const logRequestEvent = async ({
  requestId,
  userId = null,
  role = "system",
  event,
  ipAddress = null,
  metadata = {},
}) => {
  try {
    await RequestAuditLog.create({
      requestId,
      userId,
      role,
      event,
      ipAddress,
      metadata,
    });
  } catch (error) {
    logger.error(`Failed to log request audit event ${event}:`, error);
  }
};

const TIMELINE_STEPS = [
  { key: "submitted", event: "REQUEST_CREATED", label: "Submitted" },
  { key: "admin_review", event: "GUIDE_ASSIGNED", label: "Admin Reviewing" },
  { key: "guide_review", event: "GUIDE_ACCEPTED", label: "Guide Reviewing" },
  { key: "awaiting_payment", event: "PAYMENT_LINK_SENT", label: "Awaiting Payment" },
  { key: "confirmed", event: "REQUEST_CONFIRMED", label: "Confirmed" },
];

const buildRequestTimeline = (auditLogs = [], currentStatus) => {
  const eventSet = new Set(auditLogs.map((l) => l.event));
  const declined = ["GUIDE_DECLINED", "GUIDE_EXPIRED", "PAYMENT_EXPIRED", "REQUEST_REJECTED", "REQUEST_CANCELLED"];
  const hasDecline = declined.some((e) => eventSet.has(e));

  const steps = TIMELINE_STEPS.map((step, index) => {
    let status = "pending";
    if (eventSet.has(step.event)) status = "completed";
    else if (index > 0 && TIMELINE_STEPS.slice(0, index).every((s) => eventSet.has(s.event))) {
      status = "active";
    }
    return { ...step, status };
  });

  if (currentStatus === "guide_pending" && eventSet.has("GUIDE_ASSIGNED")) {
    const guideStep = steps.find((s) => s.key === "guide_review");
    if (guideStep && guideStep.status === "pending") guideStep.status = "active";
  }
  if (currentStatus === "awaiting_payment" && eventSet.has("GUIDE_ACCEPTED")) {
    const payStep = steps.find((s) => s.key === "awaiting_payment");
    if (payStep) payStep.status = "active";
  }
  if (["confirmed", "completed"].includes(currentStatus)) {
    steps.forEach((s) => { s.status = "completed"; });
  }
  if (hasDecline) {
    const failEvent = auditLogs.find((l) => declined.includes(l.event));
    return {
      steps,
      failed: true,
      failureEvent: failEvent?.event,
      failureLabel: failEvent?.event?.replace(/_/g, " "),
    };
  }

  return { steps, failed: false };
};

module.exports = { logRequestEvent, buildRequestTimeline, TIMELINE_STEPS };
