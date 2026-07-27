const mongoose = require("mongoose");

const incidentReportSchema = mongoose.Schema(
  {
    guide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: true,
    },
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        "weather_delay",
        "vehicle_issue",
        "traveler_emergency",
        "safety_issue",
        "schedule_delay",
        "other",
      ],
      default: "other",
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["open", "under_review", "resolved"],
      default: "open",
    },
    photoUrl: String,
    location: String,
    adminNote: String,
  },
  { timestamps: true }
);

incidentReportSchema.index({ guide: 1, createdAt: -1 });
incidentReportSchema.index({ status: 1 });

module.exports = mongoose.model("IncidentReport", incidentReportSchema);
