const mongoose = require("mongoose");
const Package = require("../models/Package");
const PackageSchedule = require("../models/PackageSchedule");
const PackageBooking = require("../models/PackageBooking");
const Tour = require("../models/Tour");
const { initializePayment } = require("../services/paymentService");
const { notifyGuideOfAssignment } = require("../services/notificationService");
const logger = require("../utils/logger");

// Utility: Guide Conflict Detection removed, using shared service.

// ==============================
// PUBLIC Endpoints
// ==============================

const getPackageCatalog = async (req, res, next) => {
  try {
    const packages = await Package.find({ status: "active" })
      .populate("tour", "title images difficulty duration rating")
      .populate("hotel", "name location images rating")
      .lean();

    res.json({ success: true, count: packages.length, data: packages });
  } catch (error) {
    next(error);
  }
};

const getPackageById = async (req, res, next) => {
  try {
    const pkg = await Package.findById(req.params.id)
      .populate("tour")
      .populate("hotel")
      .lean();
    if (!pkg) throw new Error("Package not found");

    // Fetch and attach published schedules for the frontend
    const PackageSchedule = require("../models/PackageSchedule");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const schedules = await PackageSchedule.find({
      packageId: pkg._id,
      status: "published",
      startDate: { $gte: today }
    }).sort({ startDate: 1 }).lean();
    
    // Map properties so frontend structure matches what it expects (e.g. remainingSlots instead of availableSeats)
    pkg.schedules = schedules.map(s => ({
      ...s,
      remainingSlots: s.availableSeats !== undefined ? s.availableSeats : s.capacity
    }));

    res.json({ success: true, data: pkg });
  } catch (error) {
    next(error);
  }
};

const getPackageSchedules = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let query = {
      packageId: req.params.id,
      startDate: { $gte: today },
      status: "published",
      availableSeats: { $gt: 0 }
    };

    const schedules = await PackageSchedule.find(query)
    .populate("assignedGuide", "name profileImage")
    .sort({ date: 1 })
    .lean();

    const filtered = schedules.filter(s => {
      if (s.scheduleType !== "private") return true;
      if (!req.user) return false;
      if (req.user.role === "admin") return true;
      if (s.requestedBy && s.requestedBy.toString() === req.user._id.toString()) return true;
      return false;
    });

    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (error) {
    next(error);
  }
};

// ==============================
// TRAVELER Endpoints
// ==============================

const bookTravelPackage = async (req, res, next) => {
  const topologyType = mongoose.connection.client?.topology?.s?.description?.type;
  const useTransaction = topologyType && topologyType !== "Single" && topologyType !== "Unknown";
  const session = useTransaction ? await mongoose.startSession() : undefined;

  try {
    let bookingRecord;
    let checkoutUrl = null;

    const action = async () => {
      const { travelersCount } = req.body;
      const { id: packageId, scheduleId } = req.params;

      const pkg = await Package.findById(packageId).session(session || null);
      if (!pkg || pkg.status !== "active") throw new Error("Package not available");

      const schedule = await PackageSchedule.findById(scheduleId).session(session || null);
      if (!schedule) throw new Error("Schedule not found");
      if (schedule.availableSeats < travelersCount) throw new Error(`Only ${schedule.availableSeats} seats available.`);

      const totalPrice = pkg.basePrice * travelersCount;
      const tx_ref = `PKG-TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      schedule.availableSeats -= travelersCount;
      await schedule.save({ session });

      const bookings = await PackageBooking.create(
        [{
          user: req.user._id,
          packageId,
          packageScheduleId: scheduleId,
          travelersCount,
          totalPrice,
          bookingStatus: "pending",
          paymentStatus: "pending",
          tx_ref
        }],
        { session }
      );
      bookingRecord = bookings[0];
    };

    if (useTransaction) {
      await session.withTransaction(action);
    } else {
      await action();
    }

    if (session) session.endSession();

    try {
      const Transaction = require("../models/Transaction");
      const { recordAction } = require("../services/auditService");
      
      let transaction = await Transaction.findOne({ tx_ref: bookingRecord.tx_ref });
      if (!transaction) {
        transaction = await Transaction.create({
          booking: bookingRecord._id,
          user: req.user._id,
          amount: bookingRecord.totalPrice,
          tx_ref: bookingRecord.tx_ref,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        });
      }

      recordAction(req, "PAYMENT_INITIATED", "Transaction", transaction._id, {
        amount: bookingRecord.totalPrice,
        tx_ref: bookingRecord.tx_ref,
      }).catch(() => {});

      const paymentResponse = await initializePayment(
        { _id: bookingRecord._id, tx_ref: bookingRecord.tx_ref, totalPrice: bookingRecord.totalPrice },
        req.user
      );
      if (paymentResponse.status === "success") {
        checkoutUrl = paymentResponse.data.checkout_url;
      }
    } catch (paymentErr) {
      logger.error(`Package Payment Init Error: ${paymentErr.message}`);
    }

    res.status(201).json({
      success: true,
      message: "Travel Package reserved. Proceed to payment.",
      data: bookingRecord,
      checkoutUrl,
    });
  } catch (error) {
    session.endSession();
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==============================
// ADMIN Endpoints
// ==============================

const createPackage = async (req, res, next) => {
  try {
    const pkg = await Package.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: pkg });
  } catch (error) {
    next(error);
  }
};

const updatePackage = async (req, res, next) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!pkg) throw new Error("Package not found");
    res.json({ success: true, data: pkg });
  } catch (error) {
    next(error);
  }
};

const deletePackage = async (req, res, next) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) throw new Error("Package not found");
    
    // Cascade delete all associated schedules to prevent orphaned schedules
    // holding guides hostage
    const PackageSchedule = require("../models/PackageSchedule");
    await PackageSchedule.deleteMany({ packageId: pkg._id });
    
    await pkg.deleteOne();
    res.json({ success: true, message: "Package and its schedules deleted" });
  } catch (error) {
    next(error);
  }
};

const createPackageSchedule = async (req, res, next) => {
  const { lockGuide, unlockGuide } = require("../services/scheduleService");
  let lockedGuideId = null;

  try {
    const { assignedGuide, startDate, endDate, startTime, endTime, capacity, meetingPoint, priceOverride, specialNotes } = req.body;
    
    if (!assignedGuide || !startDate || !endDate || !startTime || !endTime || !capacity || !meetingPoint) {
      res.status(400);
      throw new Error("assignedGuide, startDate, endDate, startTime, endTime, capacity, and meetingPoint are required.");
    }

    await lockGuide(assignedGuide);
    lockedGuideId = assignedGuide;

    const { checkGuideAvailability } = require("../services/scheduleService");
    await checkGuideAvailability(assignedGuide, startDate, endDate, startTime, endTime);

    const schedule = await PackageSchedule.create({
      packageId: req.params.id,
      assignedGuide,
      startDate,
      endDate,
      startTime,
      endTime,
      capacity,
      meetingPoint,
      priceOverride,
      specialNotes,
      status: "published",
      availableSeats: capacity
    });

    const pkg = await Package.findById(req.params.id);
    const title = pkg?.title?.en || pkg?.title || "New Package";
    await notifyGuideOfAssignment(assignedGuide, title, startDate, startTime).catch(e => console.error("Notification Error:", e));

    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  } finally {
    if (lockedGuideId) {
      await unlockGuide(lockedGuideId);
    }
  }
};

const updatePackageSchedule = async (req, res, next) => {
  const { lockGuide, unlockGuide } = require("../services/scheduleService");
  let lockedGuideId = null;

  try {
    const { assignedGuide, startDate, endDate, startTime, endTime } = req.body;
    
    const oldSchedule = await PackageSchedule.findById(req.params.scheduleId);
    if (!oldSchedule) throw new Error("Schedule not found");

    const guideToUse = assignedGuide || oldSchedule.assignedGuide;
    const sDate = startDate || oldSchedule.startDate;
    const eDate = endDate || oldSchedule.endDate;
    const sTime = startTime || oldSchedule.startTime;
    const eTime = endTime || oldSchedule.endTime;

    if (guideToUse) {
      await lockGuide(guideToUse);
      lockedGuideId = guideToUse;

      const { checkGuideAvailability } = require("../services/scheduleService");
      await checkGuideAvailability(guideToUse, sDate, eDate, sTime, eTime, req.params.scheduleId);
    }

    const guideChanged = assignedGuide && oldSchedule.assignedGuide?.toString() !== assignedGuide.toString();

    const updateData = { ...req.body };
    if (guideChanged) {
      updateData.assignmentStatus = "pending";
    }

    const schedule = await PackageSchedule.findByIdAndUpdate(req.params.scheduleId, updateData, { new: true, runValidators: true });
    
    if (guideChanged) {
      const pkg = await Package.findById(schedule.packageId);
      const title = pkg?.title?.en || pkg?.title || "Package";
      await notifyGuideOfAssignment(assignedGuide, title, schedule.startDate, schedule.startTime).catch(e => console.error("Notification Error:", e));
    }

    res.json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  } finally {
    if (lockedGuideId) {
      await unlockGuide(lockedGuideId);
    }
  }
};

const deletePackageSchedule = async (req, res, next) => {
  try {
    const schedule = await PackageSchedule.findById(req.params.scheduleId);
    if (!schedule) throw new Error("Schedule not found");
    await schedule.deleteOne();
    res.json({ success: true, message: "Schedule deleted" });
  } catch (error) {
    next(error);
  }
};

const getAllPackageSchedulesAdmin = async (req, res, next) => {
  try {
    const schedules = await PackageSchedule.find({ packageId: req.params.id })
      .populate("assignedGuide", "name profileImage")
      .populate("requestedBy", "name")
      .sort({ startDate: 1, startTime: 1 })
      .lean();

    const scheduleIds = schedules.map(s => s._id);
    const bookings = await PackageBooking.find({ packageScheduleId: { $in: scheduleIds } }).lean();

    const result = schedules.map(schedule => {
      const schBookings = bookings.filter(b => b.packageScheduleId.toString() === schedule._id.toString());
      const totalBookingsCount = schBookings.length;
      const totalTravelers = schBookings.reduce((sum, b) => sum + (b.travelersCount || 0), 0);
      
      const revenue = schBookings
        .filter(b => b.paymentStatus === "paid" && b.bookingStatus !== "cancelled")
        .reduce((sum, b) => sum + b.totalPrice, 0);

      const expectedRevenue = schBookings
        .filter(b => b.bookingStatus !== "cancelled")
        .reduce((sum, b) => sum + b.totalPrice, 0);

      return {
        ...schedule,
        stats: {
          totalBookings: totalBookingsCount,
          totalTravelers,
          revenue,
          expectedRevenue,
        }
      };
    });

    res.json({ success: true, count: result.length, data: result });
  } catch (error) {
    next(error);
  }
};

const cancelPackageScheduleAdmin = async (req, res, next) => {
  try {
    const pkg = await Package.findById(req.params.packageId);
    if (!pkg) {
      res.status(404);
      throw new Error("Package not found");
    }

    const schedule = await PackageSchedule.findById(req.params.scheduleId);
    if (!schedule) {
      res.status(404);
      throw new Error("Schedule not found");
    }

    if (schedule.status === "cancelled") {
      res.status(400);
      throw new Error("Schedule is already cancelled");
    }

    schedule.status = "cancelled";
    await schedule.save();

    const { createNotification } = require("../services/notificationService");
    const { sendEmail } = require("../utils/mailService");
    const { buildPremiumEmail } = require("../utils/emailTemplateBuilder");
    
    const bookings = await PackageBooking.find({ packageScheduleId: schedule._id }).populate("user");

    for (const booking of bookings) {
      booking.bookingStatus = "cancelled";
      
      if (booking.paymentStatus === "paid") {
        booking.paymentStatus = "refund_pending";
      }
      
      await booking.save();

      if (booking.user) {
        const title = pkg.name?.en || "Package";
        const msg = `We're sorry to inform you that your upcoming schedule for "${title}" has been cancelled. Your booking has been marked for review, and any eligible refunds will be processed by our admin team shortly.`;
        
        await createNotification({
          userId: booking.user._id,
          title: "Schedule Cancelled",
          message: msg,
          type: "booking",
          link: `/my-bookings`
        });

        if (booking.user.email) {
          try {
            const frontendUrl = process.env.FRONTEND_URL || "https://kambata.travel";
            const emailHtml = buildPremiumEmail({
              type: "default",
              title: "Schedule Cancelled",
              icon: "⚠️",
              accentColor: "#EF4444",
              greeting: `Hello ${booking.user.name},`,
              bodyLines: [
                `We're sorry to inform you that your upcoming schedule for "${title}" has been cancelled.`,
                "Your booking has been marked for review, and any eligible refunds will be processed by our admin team shortly."
              ],
              infoCards: [
                { title: "Package", value: title, iconEmoji: "📍" },
                { title: "Status", value: "Cancelled", iconEmoji: "❌" }
              ],
              statusBadge: { text: "CANCELLED", color: "#EF4444" },
              cta: {
                text: "View My Bookings",
                link: `${frontendUrl}/my-bookings`,
                color: "#EF4444"
              }
            });

            await sendEmail({
              to: booking.user.email,
              subject: `Update on your booking for ${title} - Kambata Travel`,
              html: emailHtml
            });
          } catch (err) {
            logger.error(`Failed to send cancellation email to ${booking.user.email}:`, err);
          }
        }
      }
    }

    if (schedule.assignedGuide) {
      try {
        const title = pkg.name?.en || "Package";
        await createNotification({
          userId: schedule.assignedGuide,
          title: "Schedule Cancelled",
          message: `Your assigned schedule for "${title}" on ${new Date(schedule.startDate).toLocaleDateString()} has been cancelled by the admin.`,
          type: "system",
          link: `/guide-dashboard`
        });
      } catch (err) {
        logger.error("Failed to notify guide about schedule cancellation:", err);
      }
    }

    res.json({ success: true, message: "Schedule cancelled successfully. Affected bookings have been marked as refund pending." });
  } catch (error) {
    next(error);
  }
};

const updatePackageScheduleStatusAdmin = async (req, res, next) => {
  try {
    const { status } = req.body;
    const schedule = await PackageSchedule.findById(req.params.scheduleId);
    if (!schedule) throw new Error("Schedule not found");

    schedule.status = status;
    await schedule.save();

    res.json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPackageCatalog,
  getPackageById,
  getPackageSchedules,
  bookTravelPackage,
  createPackage,
  updatePackage,
  deletePackage,
  createPackageSchedule,
  updatePackageSchedule,
  deletePackageSchedule,
  getAllPackageSchedulesAdmin,
  cancelPackageScheduleAdmin,
  updatePackageScheduleStatusAdmin
};
