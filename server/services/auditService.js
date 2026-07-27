const AuditLog = require("../models/AuditLog");
const logger = require("../utils/logger");

const recordAction = async (req, action, targetType, targetId, metadata = {}) => {
  try {
    if (!req.user) return;

    const payload = {
      actor: req.user._id,
      action,
      targetType,
      metadata,
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "unknown",
      userAgent: req.headers["user-agent"],
    };

    if (targetType !== "System" && targetId) {
      payload.targetId = targetId;
    }

    await AuditLog.create(payload);
    logger.info(`Audit logged: ${action} by ${req.user._id} on ${targetType}`);
  } catch (error) {
    logger.error("Failed to record audit action:", error);
  }
};

module.exports = { recordAction };
