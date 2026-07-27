const mongoose = require("mongoose");

const packageScheduleSchema = mongoose.Schema(
  {
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
    availableSeats: {
      type: Number,
      required: true,
    },
    allocatedRooms: {
      type: Number,
      required: true,
      default: 0,
    },
    availableRooms: {
      type: Number,
      required: true,
      default: 0,
    },
    assignedGuide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    meetingPoint: {
      type: String,
      required: true,
    },
    priceOverride: {
      type: Number,
    },
    specialNotes: {
      type: String,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["draft", "published", "full", "in_progress", "completed", "cancelled"],
      default: "draft",
    },
    assignmentStatus: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    incidentReport: {
      type: String,
      maxlength: 2000,
    },
    attendanceLocked: {
      type: Boolean,
      default: false,
    },
    scheduleType: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    linkedRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TourRequest",
    },
  },
  {
    timestamps: true,
  }
);

packageScheduleSchema.index({ packageId: 1 });
packageScheduleSchema.index({ startDate: 1 });
packageScheduleSchema.index({ assignedGuide: 1 });

const PackageSchedule = mongoose.model("PackageSchedule", packageScheduleSchema);
module.exports = PackageSchedule;
