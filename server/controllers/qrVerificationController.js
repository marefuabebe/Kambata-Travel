"use strict";

const Booking = require("../models/Booking");
const PackageBooking = require("../models/PackageBooking");
const Tour = require("../models/Tour");
const User = require("../models/User");
const { hashToken, decryptToken } = require("../services/qrService");
const { sendNotification } = require("../services/notificationService");
const { recordAction } = require("../services/auditService");
const CheckInAuditLog = require("../models/CheckInAuditLog");
const { getDistanceInMeters } = require("../utils/geoUtils");
const logger = require("../utils/logger");
const { sendEmail } = require("../utils/mailService");
const { buildPremiumEmail } = require("../utils/emailTemplateBuilder");

/**
 * Retrieve the decrypted QR token for the Traveler Dashboard
 * GET /api/qr/pass/:bookingId?type=tour|package
 */
const getTravelPass = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { type } = req.query; // 'tour' or 'package'
    
    let booking;
    if (type === "package") {
      booking = await PackageBooking.findById(bookingId)
        .populate("packageId")
        .populate({ path: "packageScheduleId", populate: { path: "assignedGuide" } });
    } else {
      booking = await Booking.findById(bookingId).populate("tour guide");
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Authorization: only the traveler who owns the booking
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    // Business Logic: Only provide QR if paid, confirmed, and not completed
    if (booking.paymentStatus !== "paid") {
      let msg = "Pass unavailable: Payment not completed";
      if (booking.paymentStatus === "refunded") msg = "Pass unavailable: Payment has been refunded";
      if (booking.paymentStatus === "failed") msg = "Pass unavailable: Payment failed";
      return res.status(400).json({ success: false, message: msg });
    }
    
    const bStatus = type === "package" ? booking.bookingStatus : booking.status;
    if (bStatus !== "confirmed" && bStatus !== "completed") {
      let msg = "Pass unavailable: Booking is not confirmed";
      if (bStatus === "cancelled") msg = "Pass unavailable: Booking has been cancelled";
      if (bStatus === "refunded") msg = "Pass unavailable: Booking has been refunded";
      return res.status(400).json({ success: false, message: msg });
    }

    let token = null;
    let qrCodeImage = null;

    if (booking.tourStatus !== "completed") {
      // Reconstruct the token dynamically
      const { reconstructJWT } = require("../services/qrService");
      token = reconstructJWT(booking._id, type || "tour", booking.qrNonce, booking.qrGeneratedAt, booking.qrExpiresAt);

      if (!token) {
        return res.status(500).json({ success: false, message: "Failed to generate pass" });
      }

      // Log the viewing action
      booking.verificationLogs.push({
        action: "QR_VIEWED",
        travelerId: req.user._id,
        ipAddress: req.ip,
        deviceInfo: req.headers["user-agent"],
        status: "Success"
      });
      await booking.save();

      // Generate QR Code data URL containing JSON payload
      const QRCode = require("qrcode");
      const payload = JSON.stringify({
        bookingId: booking._id,
        bookingType: type || "tour",
        token: token
      });
      qrCodeImage = await QRCode.toDataURL(payload, { width: 300, margin: 1 });
    }

    let tourDate = null;
    let endDate = null;
    let meetingTime = null;
    let meetingPoint = null;
    let scheduleLocked = false;

    if (type === "package") {
      tourDate = booking.packageScheduleId?.date || booking.packageScheduleId?.startDate;
      endDate = booking.packageScheduleId?.endDate || tourDate;
      meetingTime = booking.packageScheduleId?.startTime;
      meetingPoint = booking.packageId?.hotel?.name || "TBA";
      scheduleLocked = (() => {
        const sch = booking.packageScheduleId;
        if (!sch) return false;
        if (sch.status === "completed" || sch.status === "cancelled") return false;
        if (sch.attendanceLocked) return true;
        const endDateObj = new Date(sch.endDate || sch.startDate || sch.date || new Date());
        if (sch.endTime && sch.endTime !== "—") {
          const [h, m] = sch.endTime.split(":");
          endDateObj.setHours(parseInt(h), parseInt(m), 0, 0);
        } else {
          endDateObj.setHours(23, 59, 59, 999);
        }
        return endDateObj < new Date();
      })();
    } else if (booking.tour && booking.scheduleId) {
      const schedule = booking.tour.schedules?.id ? booking.tour.schedules.id(booking.scheduleId) : booking.tour.schedules?.find(s => s._id.toString() === booking.scheduleId.toString());
      if (schedule) {
        tourDate = schedule.startDate || schedule.date;
        endDate = schedule.endDate || tourDate;
        meetingTime = schedule.startTime;
        meetingPoint = schedule.meetingPoint || booking.tour.meetingPoint?.en || "TBA";
        scheduleLocked = (() => {
          if (schedule.status === "completed" || schedule.status === "cancelled") return false;
          if (schedule.attendanceLocked) return true;
          const endDateObj = new Date(schedule.endDate || schedule.startDate || schedule.date || new Date());
          if (schedule.endTime && schedule.endTime !== "—") {
            const [h, m] = schedule.endTime.split(":");
            endDateObj.setHours(parseInt(h), parseInt(m), 0, 0);
          } else {
            endDateObj.setHours(23, 59, 59, 999);
          }
          return endDateObj < new Date();
        })();
      } else {
        tourDate = booking.createdAt;
        endDate = booking.createdAt;
        meetingTime = "TBD";
        meetingPoint = booking.tour.meetingPoint?.en || "See Itinerary";
      }
    }

    res.json({
      success: true,
      data: {
        qrCodeImage,
        referenceNumber: booking.referenceNumber || booking.tx_ref,
        status: bStatus,
        tourStatus: booking.tourStatus,
        checkedInAt: booking.verified ? booking.verifiedAt : null,
        travelerName: req.user.name,
        travelerEmail: req.user.email,
        travelerImage: req.user.profilePicture,
        tourName: type === "package" ? booking.packageId?.title : booking.tour?.title?.en || booking.tour?.title,
        tourImage: type === "package" ? booking.packageId?.images?.[0] : booking.tour?.images?.[0],
        guideName: type === "package" ? booking.packageScheduleId?.assignedGuide?.name : booking.guide?.name,
        guideEmail: type === "package" ? booking.packageScheduleId?.assignedGuide?.email : booking.guide?.email,
        guideImage: type === "package" ? booking.packageScheduleId?.assignedGuide?.profilePicture : booking.guide?.profilePicture,
        validUntil: booking.qrExpiresAt,
        completedAt: booking.tourStatus === 'completed' ? (booking.updatedAt || booking.scheduleId?.endDate || booking.createdAt) : null,
        tourDate,
        endDate,
        meetingTime,
        meetingPoint,
        isLocked: scheduleLocked
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Verify a scanned QR Token (Guide Scanner)
 * POST /api/qr/verify
 * Body: { bookingType: "tour"|"package", bookingId: "XYZ", token: "RAW_TOKEN" }
 */
const verifyQrBooking = async (req, res, next) => {
  try {
    const { bookingType, bookingId, token, latitude, longitude, overrideGps, pinCode } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "No QR token provided" });
    }

    const { hashToken, verifyJWTSignature } = require("../services/qrService");

    const decoded = verifyJWTSignature(token);
    if (!decoded) {
      recordAction(req, "QR_SCAN_FAILED", "Booking", bookingId, { status: "Invalid JWT Signature" });
      return res.status(400).json({ success: false, message: "Invalid or tampered Travel Pass" });
    }

    const hashedToken = hashToken(token);
    const model = bookingType === "package" ? PackageBooking : Booking;
    let booking = await model.findOne({ _id: bookingId, qrTokenHash: hashedToken }).populate(bookingType === "package" ? "packageScheduleId user" : "scheduleId user");

    if (!booking) {
      recordAction(req, "QR_SCAN_FAILED", "Booking", bookingId, { status: "Invalid Token Hash or Booking ID" });
      return res.status(400).json({ success: false, message: "Invalid or unrecognized Travel Pass" });
    }

    // PIN Verification
    if (booking.pinCode) {
      if (!pinCode) {
        return res.status(403).json({ success: false, requirePin: true, message: "A security PIN is required for this pass." });
      }
      if (booking.pinCode !== pinCode) {
        await CheckInAuditLog.create({
          bookingId: booking._id,
          bookingType,
          travelerId: booking.user._id,
          guideId: req.user._id,
          action: "PIN_FAILED",
          method: "QR",
          location: { latitude, longitude },
          deviceInfo: { userAgent: req.headers["user-agent"], ipAddress: req.ip },
          status: "Failed: Invalid PIN"
        });
        return res.status(400).json({ success: false, message: "Invalid PIN code provided." });
      }
    }

    if (booking.verified || booking.qrUsed) {
      await CheckInAuditLog.create({
        bookingId: booking._id,
        bookingType,
        travelerId: booking.user._id,
        guideId: req.user._id,
        action: "CHECKIN_REJECTED",
        method: "QR",
        location: { latitude, longitude },
        deviceInfo: { userAgent: req.headers["user-agent"], ipAddress: req.ip },
        status: "Already Verified"
      });
      return res.status(409).json({ success: false, message: "Traveler already checked in" });
    }

    const schedule = bookingType === "package" ? booking.packageScheduleId : booking.scheduleId;
    const assignedGuideId = bookingType === "package" ? schedule?.assignedGuide : (schedule?.guide || booking.guide);
    
    if (req.user.role !== "admin") {
      if (!assignedGuideId || assignedGuideId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "You are not authorized to verify this pass" });
      }
    }

    // Time Warning Logic
    let timeWarning = null;
    const tourDateStr = bookingType === "package" ? schedule?.date : schedule?.startDate;
    if (tourDateStr) {
      const tourDate = new Date(tourDateStr);
      const today = new Date();
      // If tour is more than 12 hours in the future
      if (tourDate.getTime() - today.getTime() > 12 * 60 * 60 * 1000 && !overrideGps) {
        timeWarning = `This tour is scheduled for ${tourDate.toLocaleDateString()}, which is in the future. Proceed with early check-in anyway?`;
        return res.status(403).json({ success: false, requiresOverride: true, message: timeWarning });
      }
    }

    // GPS Warning Logic
    let gpsWarning = null;
    if (latitude && longitude) {
      // Mock meeting point coordinates for Kambata region if schema lacks them
      const targetLat = schedule?.location?.coordinates?.[1] || 7.25; 
      const targetLng = schedule?.location?.coordinates?.[0] || 37.85;
      const distance = getDistanceInMeters(latitude, longitude, targetLat, targetLng);
      
      if (distance > 500 && !overrideGps) {
        gpsWarning = "You appear to be far from the meeting point. Proceed anyway?";
        return res.status(403).json({ success: false, requiresOverride: true, message: gpsWarning });
      }
    } else if (!overrideGps) {
      gpsWarning = "Location unavailable. Please enable GPS or confirm manual override.";
      return res.status(403).json({ success: false, requiresOverride: true, message: gpsWarning });
    }

    const now = new Date();
    const updatedBooking = await model.findOneAndUpdate(
      { _id: bookingId, verified: false },
      {
        $set: {
          verified: true,
          qrUsed: true,
          verifiedAt: now,
          checkedInAt: now,
          verifiedByGuide: req.user._id,
          tourStatus: "started",
          ...(bookingType === "package" ? { attendanceStatus: "present" } : {})
        }
      },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(409).json({ success: false, message: "Traveler already checked in" });
    }

    // Auto-start schedule if not started
    if (schedule && schedule.status !== "in_progress" && schedule.status !== "completed") {
      if (bookingType === "package") {
        const PackageSchedule = require("../models/PackageSchedule");
        await PackageSchedule.updateOne(
          { _id: schedule._id },
          { $set: { status: "in_progress", assignmentStatus: "accepted" } }
        );
      } else {
        const Tour = require("../models/Tour");
        await Tour.updateOne(
          { _id: booking.tour._id, "schedules._id": schedule._id },
          { $set: { "schedules.$.status": "in_progress", "schedules.$.assignmentStatus": "accepted" } }
        );
      }
    }

    await CheckInAuditLog.create({
      bookingId: booking._id,
      bookingType,
      travelerId: booking.user._id,
      guideId: req.user._id,
      action: "QR_SCANNED",
      method: "QR",
      location: { latitude, longitude },
      deviceInfo: { userAgent: req.headers["user-agent"], ipAddress: req.ip },
      status: "Success",
      notes: overrideGps ? "Admin/Guide Override Used for GPS" : ""
    });

    let tourName = bookingType === "package" ? (booking.packageScheduleId?.packageId?.title || "Package Tour") : (booking.scheduleId?.tour?.title?.en || booking.scheduleId?.tour?.title || "Tour");

    await sendNotification(booking.user._id, { type: "booking", priority: "NORMAL", message: `You are successfully checked in for ${tourName}.`, referenceId: booking._id });
    await sendNotification(req.user._id, { type: "booking", priority: "NORMAL", message: "Traveler checked in successfully.", referenceId: booking._id });

    const frontendUrl = process.env.FRONTEND_URL || "https://kambata.travel";

    if (booking.user.email) {
      try {
        const emailHtml = buildPremiumEmail({
          type: "ticket",
          title: "Check-in Successful",
          icon: "✅",
          accentColor: "#10B981",
          greeting: `Hello ${booking.user.name},`,
          bodyLines: [
            `You have successfully checked in for your tour. Enjoy your trip!`,
          ],
          infoCards: [
            { title: "Tour Name", value: tourName, iconEmoji: "📍" },
            { title: "Travelers", value: bookingType === "package" ? booking.travelersCount : booking.numPeople, iconEmoji: "👥" }
          ],
          statusBadge: { text: "CHECKED IN", color: "#10B981" },
          cta: {
            text: "View Dashboard",
            link: `${frontendUrl}/explorer-dashboard`,
            color: "#10B981"
          }
        });

        await sendEmail({
          to: booking.user.email,
          subject: "Check-in Successful - Kambata Travel",
          html: emailHtml
        });
      } catch (err) {
        console.error("Failed to send check-in email to traveler:", err);
      }
    }

    if (req.user.email) {
      try {
        const emailHtml = buildPremiumEmail({
          type: "default",
          title: "Traveler Checked In",
          icon: "✅",
          accentColor: "#10B981",
          greeting: `Hello ${req.user.name},`,
          bodyLines: [
            `Traveler ${booking.user.name} has successfully checked in for their tour.`
          ],
          infoCards: [
            { title: "Tour Name", value: tourName, iconEmoji: "📍" },
            { title: "Travelers", value: bookingType === "package" ? booking.travelersCount : booking.numPeople, iconEmoji: "👥" }
          ]
        });

        await sendEmail({
          to: req.user.email,
          subject: "Traveler Checked In - Kambata Travel",
          html: emailHtml
        });
      } catch (err) {
        console.error("Failed to send check-in email to guide:", err);
      }
    }

    res.json({
      success: true,
      message: "Traveler successfully checked in",
      data: { travelerName: booking.user.name, bookingRef: booking.referenceNumber || booking.tx_ref, seats: bookingType === "package" ? booking.travelersCount : booking.numPeople, tourStatus: updatedBooking.tourStatus, tourName }
    });

  } catch (err) {
    next(err);
  }
};

/**
 * Verify a booking manually by Reference Number (Backup verification)
 * POST /api/qr/manual-verify
 * Body: { referenceNumber: "KT-XXXXX" }
 */
const manualVerifyQrBooking = async (req, res, next) => {
  try {
    const { referenceNumber, pinCode, latitude, longitude, overrideGps } = req.body;
    if (!referenceNumber) {
      return res.status(400).json({ success: false, message: "No reference number provided" });
    }

    let bookingType = "tour";
    let booking = await Booking.findOne({ referenceNumber }).populate("scheduleId user");
    
    if (!booking) {
      booking = await PackageBooking.findOne({ referenceNumber }).populate("packageScheduleId user");
      bookingType = "package";
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found with that reference" });
    }

    if (booking.pinCode) {
      if (!pinCode) {
        return res.status(403).json({ success: false, requirePin: true, message: "A security PIN is required for this pass." });
      }
      if (booking.pinCode !== pinCode) {
        await CheckInAuditLog.create({
          bookingId: booking._id, bookingType, travelerId: booking.user._id, guideId: req.user._id,
          action: "PIN_FAILED", method: "MANUAL", location: { latitude, longitude },
          deviceInfo: { userAgent: req.headers["user-agent"], ipAddress: req.ip }, status: "Failed: Invalid PIN"
        });
        return res.status(400).json({ success: false, message: "Invalid PIN code provided." });
      }
    }

    if (booking.verified || booking.qrUsed) {
      return res.status(409).json({ success: false, message: "Traveler already checked in" });
    }

    const schedule = bookingType === "package" ? booking.packageScheduleId : booking.scheduleId;
    const assignedGuideId = bookingType === "package" ? schedule?.assignedGuide : (schedule?.guide || booking.guide);
    
    if (req.user.role !== "admin" && (!assignedGuideId || assignedGuideId.toString() !== req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "You are not authorized to verify this booking" });
    }

    // Time Warning Logic
    let timeWarning = null;
    const tourDateStr = bookingType === "package" ? schedule?.date : schedule?.startDate;
    if (tourDateStr) {
      const tourDate = new Date(tourDateStr);
      const today = new Date();
      // If tour is more than 12 hours in the future
      if (tourDate.getTime() - today.getTime() > 12 * 60 * 60 * 1000 && !overrideGps) {
        timeWarning = `This tour is scheduled for ${tourDate.toLocaleDateString()}, which is in the future. Proceed with early check-in anyway?`;
        return res.status(403).json({ success: false, requiresOverride: true, message: timeWarning });
      }
    }

    // GPS Warning Logic
    let gpsWarning = null;
    if (latitude && longitude) {
      const targetLat = schedule?.location?.coordinates?.[1] || 7.25; 
      const targetLng = schedule?.location?.coordinates?.[0] || 37.85;
      const distance = getDistanceInMeters(latitude, longitude, targetLat, targetLng);
      if (distance > 500 && !overrideGps) {
        gpsWarning = "You appear to be far from the meeting point. Proceed anyway?";
        return res.status(403).json({ success: false, requiresOverride: true, message: gpsWarning });
      }
    } else if (!overrideGps) {
      gpsWarning = "Location unavailable. Please enable GPS or confirm manual override.";
      return res.status(403).json({ success: false, requiresOverride: true, message: gpsWarning });
    }

    const now = new Date();
    const model = bookingType === "package" ? PackageBooking : Booking;
    const updatedBooking = await model.findOneAndUpdate(
      { _id: booking._id, verified: false },
      {
        $set: {
          verified: true,
          qrUsed: true,
          verifiedAt: now,
          checkedInAt: now,
          verifiedByGuide: req.user._id,
          tourStatus: "started",
          ...(bookingType === "package" ? { attendanceStatus: "present" } : {})
        }
      },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(409).json({ success: false, message: "Traveler already checked in" });
    }

    // Auto-start schedule if not started
    if (schedule && schedule.status !== "in_progress" && schedule.status !== "completed") {
      if (bookingType === "package") {
        const PackageSchedule = require("../models/PackageSchedule");
        await PackageSchedule.updateOne(
          { _id: schedule._id },
          { $set: { status: "in_progress", assignmentStatus: "accepted" } }
        );
      } else {
        const Tour = require("../models/Tour");
        await Tour.updateOne(
          { _id: booking.tour._id, "schedules._id": schedule._id },
          { $set: { "schedules.$.status": "in_progress", "schedules.$.assignmentStatus": "accepted" } }
        );
      }
    }

    await CheckInAuditLog.create({
      bookingId: booking._id, bookingType, travelerId: booking.user._id, guideId: req.user._id,
      action: "MANUAL_VERIFIED", method: "MANUAL", location: { latitude, longitude },
      deviceInfo: { userAgent: req.headers["user-agent"], ipAddress: req.ip }, status: "Success",
      notes: overrideGps ? "Admin/Guide Override Used for GPS" : ""
    });

    let tourName = bookingType === "package" ? (booking.packageScheduleId?.packageId?.title || "Package Tour") : (booking.scheduleId?.tour?.title?.en || booking.scheduleId?.tour?.title || "Tour");
    await sendNotification(booking.user._id, { type: "booking", priority: "NORMAL", message: `You are successfully checked in for ${tourName}.`, referenceId: booking._id });

    res.json({
      success: true,
      message: "Traveler manually checked in",
      data: { travelerName: booking.user.name, bookingRef: booking.referenceNumber || booking.tx_ref, seats: bookingType === "package" ? booking.travelersCount : booking.numPeople, tourStatus: updatedBooking.tourStatus, tourName }
    });

  } catch (err) {
    next(err);
  }
};
/**
 * @desc    Get all check-in audit logs (Admin only)
 * @route   GET /api/qr/audit
 * @access  Private/Admin
 */
const getCheckInAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    const query = {};
    
    if (status) query.status = new RegExp(status, "i");
    if (search) {
      query.$or = [
        { action: new RegExp(search, "i") },
        { method: new RegExp(search, "i") }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const logs = await CheckInAuditLog.find(query)
      .populate("travelerId", "name email")
      .populate("guideId", "name")
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CheckInAuditLog.countDocuments(query);

    res.json({
      success: true,
      data: logs,
      meta: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Get Audit Logs Error:", error);
    res.status(500).json({ success: false, message: "Server error fetching audit logs" });
  }
};


/**
 * @desc    Sync offline QR scans in bulk
 * @route   POST /api/qr/sync-offline
 * @access  Private/Guide
 */
const syncOfflineScans = async (req, res, next) => {
  try {
    const { scans } = req.body;
    if (!Array.isArray(scans) || scans.length === 0) {
      return res.status(400).json({ success: false, message: "No scans provided" });
    }

    const { hashToken, verifyJWTSignature } = require("../services/qrService");
    const results = [];

    for (const scan of scans) {
      const { bookingType, bookingId, token, latitude, longitude, overrideGps, pinCode, scannedAt } = scan;
      
      try {
        const decoded = verifyJWTSignature(token);
        if (!decoded) {
          results.push({ bookingId, status: "Failed", message: "Invalid token signature" });
          continue;
        }

        const hashedToken = hashToken(token);
        const model = bookingType === "package" ? PackageBooking : Booking;
        const booking = await model.findOne({ _id: bookingId, qrTokenHash: hashedToken }).populate(bookingType === "package" ? "packageScheduleId user" : "scheduleId user");

        if (!booking) {
          results.push({ bookingId, status: "Failed", message: "Invalid Token Hash or Booking ID" });
          continue;
        }

        // Already checked in? Just mark success since they scanned it offline
        if (booking.verified || booking.qrUsed) {
          results.push({ bookingId, status: "Success", message: "Already checked in previously" });
          continue;
        }

        // Guide authorization check
        const schedule = bookingType === "package" ? booking.packageScheduleId : booking.scheduleId;
        const assignedGuideId = bookingType === "package" ? schedule?.assignedGuide : (schedule?.guide || booking.guide);
        
        if (req.user.role !== "admin") {
          if (!assignedGuideId || assignedGuideId.toString() !== req.user._id.toString()) {
            results.push({ bookingId, status: "Failed", message: "Not authorized to verify this pass" });
            continue;
          }
        }

        // Update the booking
        const now = scannedAt ? new Date(scannedAt) : new Date();
        const updatedBooking = await model.findOneAndUpdate(
          { _id: bookingId, verified: false },
          {
            $set: {
              verified: true,
              qrUsed: true,
              verifiedAt: now,
              checkedInAt: now,
              verifiedByGuide: req.user._id,
              tourStatus: "started",
              ...(bookingType === "package" ? { attendanceStatus: "present" } : {})
            }
          },
          { new: true }
        );

        if (updatedBooking) {
          await CheckInAuditLog.create({
            bookingId: booking._id,
            bookingType,
            travelerId: booking.user._id,
            guideId: req.user._id,
            action: "QR_SCANNED",
            method: "OFFLINE_SYNC",
            location: { latitude, longitude },
            deviceInfo: { userAgent: req.headers["user-agent"], ipAddress: req.ip },
            status: "Success",
            notes: "Synced from offline mode"
          });

          let tourName = bookingType === "package" ? (booking.packageScheduleId?.packageId?.title || "Package Tour") : (booking.scheduleId?.tour?.title?.en || booking.scheduleId?.tour?.title || "Tour");
          await sendNotification(booking.user._id, { type: "booking", priority: "NORMAL", message: `You are successfully checked in for ${tourName} (Offline Sync).`, referenceId: booking._id });
          
          results.push({ bookingId, status: "Success", message: "Traveler successfully checked in" });
        } else {
           results.push({ bookingId, status: "Failed", message: "Update failed or already checked in" });
        }

      } catch (err) {
        results.push({ bookingId, status: "Error", message: err.message });
      }
    }

    res.json({
      success: true,
      message: `Processed ${scans.length} offline scans`,
      data: results
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTravelPass,
  verifyQrBooking,
  manualVerifyQrBooking,
  getCheckInAuditLogs,
  syncOfflineScans
};
