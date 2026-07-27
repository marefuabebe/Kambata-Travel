const SOSAlert = require("../models/SOSAlert");
const User = require("../models/User");
const { sendNotification } = require("../services/notificationService");
const { recordAction } = require("../services/auditService");
const { sendEmail } = require("../utils/mailService");
const { buildPremiumEmail } = require("../utils/emailTemplateBuilder");
const logger = require("../utils/logger");

// ─── Helper: Notify all admins of a new SOS ───────────────────────────────────
const notifyAdminsOfSOS = async (alert, submitter) => {
  try {
    const admins = await User.find({ role: "admin" }).select("_id email name");
    const severityLabel = alert.severity.toUpperCase();
    const typeLabel = alert.type.replace(/_/g, " ").toUpperCase();

    for (const admin of admins) {
      await sendNotification(admin._id, {
        type: "system",
        priority: "HIGH",
        message: `🚨 SOS ALERT [${severityLabel}]: ${typeLabel} reported by ${submitter.name}. Location: ${alert.location || "Unknown"}. Open the Admin SOS Center to respond immediately.`,
        referenceId: alert._id,
      });

      if (admin.email) {
        const frontendUrl = process.env.FRONTEND_URL || "https://kambata.travel";
        const emailHtml = buildPremiumEmail({
          type: "sos",
          title: `SOS Alert: ${typeLabel}`,
          icon: "🚨",
          accentColor: "#EF4444",
          greeting: `Attention Admin,`,
          bodyLines: [
            `An emergency SOS alert has been submitted by ${submitter.name} (${alert.role}).`,
            "Please review the details below and respond immediately via the admin dashboard."
          ],
          infoCards: [
            { title: "Reported By", value: `${submitter.name} (${alert.role})`, iconEmoji: "👤" },
            { title: "Type", value: typeLabel, iconEmoji: "⚠️" },
            { title: "Severity", value: severityLabel, iconEmoji: "🔥" },
            { title: "Location", value: alert.location || "Not provided", iconEmoji: "📍" },
            { title: "Tour", value: alert.tourName || "N/A", iconEmoji: "🎒" },
            { title: "Contact Phone", value: alert.contactPhone || "Not provided", iconEmoji: "📞" },
            { title: "Description", value: alert.description, iconEmoji: "📝" }
          ],
          statusBadge: { text: "URGENT", color: "#EF4444" },
          cta: {
            text: "Respond Now",
            link: `${frontendUrl}/admin-portal/sos`,
            color: "#EF4444"
          }
        });

        await sendEmail({
          to: admin.email,
          subject: `🚨 Emergency SOS Alert [${severityLabel}] - Kambata Travel`,
          html: emailHtml,
        });
      }
    }
  } catch (err) {
    logger.error("Error notifying admins of SOS:", err);
  }
};

// ─── POST /api/sos ─────────────────────────────────────────────────────────────
const createAlert = async (req, res, next) => {
  try {
    const { type, severity, description, location, bookingId, tourName, contactPhone } = req.body;

    if (!type || !description) {
      res.status(400);
      throw new Error("Type and description are required");
    }

    const submitter = req.user;

    const alert = await SOSAlert.create({
      submittedBy: submitter._id,
      role: submitter.role === "guide" ? "guide" : "traveler",
      type,
      severity: severity || "high",
      description,
      location,
      bookingId: bookingId || undefined,
      tourName,
      contactPhone,
    });

    // Notify all admins immediately
    await notifyAdminsOfSOS(alert, submitter);

    // Confirm receipt to the submitter
    await sendNotification(submitter._id, {
      type: "system",
      priority: "HIGH",
      message: `✅ Your SOS alert has been received and is being reviewed by our team. Alert ID: #${alert._id.toString().slice(-6).toUpperCase()}. Help is on the way.`,
      referenceId: alert._id,
    });

    await recordAction(submitter._id, "SOS_ALERT_CREATED", { alertId: alert._id, type, severity });

    res.status(201).json({
      success: true,
      message: "SOS Alert submitted. Our team has been notified.",
      data: alert,
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/sos/mine ─────────────────────────────────────────────────────────
const getMyAlerts = async (req, res, next) => {
  try {
    const alerts = await SOSAlert.find({ submittedBy: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, data: alerts });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/sos/admin ────────────────────────────────────────────────────────
const getAllAlerts = async (req, res, next) => {
  try {
    const { status, severity, role, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (role) filter.role = role;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [alerts, total] = await Promise.all([
      SOSAlert.find(filter)
        .populate("submittedBy", "name email profilePicture phone")
        .populate("resolvedBy", "name")
        .sort({ severity: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      SOSAlert.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: alerts,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    next(error);
  }
};

// ─── PATCH /api/sos/admin/:id ──────────────────────────────────────────────────
const updateAlertStatus = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const alert = await SOSAlert.findById(req.params.id).populate("submittedBy", "_id name email");

    if (!alert) {
      res.status(404);
      throw new Error("SOS Alert not found");
    }

    const prevStatus = alert.status;
    alert.status = status || alert.status;
    if (adminNote !== undefined) alert.adminNote = adminNote;

    if (status === "resolved" || status === "false_alarm") {
      alert.resolvedAt = new Date();
      alert.resolvedBy = req.user._id;
    }

    await alert.save();
    await recordAction(req.user._id, "SOS_ALERT_UPDATED", { alertId: alert._id, prevStatus, newStatus: status });

    // Notify submitter of status change
    if (alert.submittedBy?._id) {
      const statusMessages = {
        acknowledged: "✅ Your SOS alert has been acknowledged by our team. We are assessing the situation.",
        in_progress: "🔄 Your emergency is actively being handled by our support team. Stay calm and follow any instructions.",
        resolved: `✅ Your SOS alert has been marked as RESOLVED by our team.${adminNote ? ` Note: ${adminNote}` : ""} If you still need help, please submit a new alert.`,
        false_alarm: `ℹ️ Your SOS alert has been reviewed and marked as a false alarm.${adminNote ? ` Note: ${adminNote}` : ""}`,
      };

      const msg = statusMessages[status];
      if (msg) {
        await sendNotification(alert.submittedBy._id, {
          type: "system",
          priority: status === "resolved" ? "NORMAL" : "HIGH",
          message: msg,
          referenceId: alert._id,
        });
      }
    }

    res.json({ success: true, message: "Alert updated", data: alert });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/sos/admin/stats ──────────────────────────────────────────────────
const getAlertStats = async (req, res, next) => {
  try {
    const [open, critical, inProgress, resolved] = await Promise.all([
      SOSAlert.countDocuments({ status: "open" }),
      SOSAlert.countDocuments({ severity: "critical", status: { $in: ["open", "acknowledged", "in_progress"] } }),
      SOSAlert.countDocuments({ status: "in_progress" }),
      SOSAlert.countDocuments({ status: "resolved" }),
    ]);

    const recentByType = await SOSAlert.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({ success: true, data: { open, critical, inProgress, resolved, recentByType } });
  } catch (error) {
    next(error);
  }
};

module.exports = { createAlert, getMyAlerts, getAllAlerts, updateAlertStatus, getAlertStats };
