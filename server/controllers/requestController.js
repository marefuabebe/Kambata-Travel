const Guide = require("../models/Guide");
const TourRequest = require("../models/TourRequest");
const Tour = require("../models/Tour");
const Package = require("../models/Package");
const RequestAuditLog = require("../models/RequestAuditLog");
const { logRequestEvent, buildRequestTimeline } = require("../services/requestAuditService");
const {
  isGuideReserved,
  GUIDE_RESPONSE_MS,
  PAYMENT_WINDOW_MS,
  releaseGuideReservation,
} = require("../services/guideReservationService");
const { initiateRequestPayment } = require("../services/requestPaymentService");
const { getRankedGuides } = require("../services/smartRankingService");

// @desc    Create a new tour request (Custom Date, Waitlist, Private)
// @route   POST /api/requests
// @access  Private (Traveler)
const createRequest = async (req, res, next) => {
  try {
    const { tourId, packageId, requestType, preferredDate, preferredTime, travelers, notes, preferredGuide } = req.body;

    if (!tourId && !packageId) {
      res.status(400);
      throw new Error("You must specify either a tourId or packageId");
    }

    // Hoist to outer scope so they are accessible below for the chat room title
    let tourExists = null;
    let pkgExists = null;

    if (tourId) {
      tourExists = await Tour.findById(tourId);
      if (!tourExists) {
        res.status(404);
        throw new Error("Tour not found");
      }
    }

    if (packageId) {
      pkgExists = await Package.findById(packageId);
      if (!pkgExists) {
        res.status(404);
        throw new Error("Package not found");
      }
    }

    const request = await TourRequest.create({
      user: req.user._id,
      tourId,
      packageId,
      requestType,
      preferredDate,
      preferredTime,
      travelers,
      notes,
      preferredGuide,
      status: "pending_admin",
    });

    const { createRoomForContext } = require("./chatController");
    const itemTitle = tourExists?.title?.en || pkgExists?.name?.en || "Custom Request";
    
    await createRoomForContext({
      participants: [req.user._id],
      title: `${itemTitle} Request - ${req.user.name}`,
      contextType: "request",
      customRequestId: request._id
    });

    await logRequestEvent({
      requestId: request._id,
      userId: req.user._id,
      role: "traveler",
      event: "REQUEST_CREATED",
      ipAddress: req.ip,
      metadata: { requestType, preferredDate, travelers },
    });

    try {
      const { sendNotification } = require("../services/notificationService");
      
      // Notify the user
      await sendNotification(req.user._id, {
        type: "system",
        priority: "NORMAL",
        message: "Your custom date request has been submitted. Our team will review it shortly.",
        referenceId: request._id,
      });

      // Notify all admins
      const User = require("../models/User");
      const admins = await User.find({ role: "admin" }).select("_id").lean();
      const adminMessage = `New custom request from ${req.user.name} for ${itemTitle}.`;
      
      for (const admin of admins) {
        await sendNotification(admin._id, {
          type: "system",
          priority: "HIGH",
          message: adminMessage,
          referenceId: request._id,
        });
      }
    } catch (err) {
      console.error("Failed to send custom request notifications:", err);
    }

    res.status(201).json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's requests
// @route   GET /api/requests/my-requests
// @access  Private (Traveler)
const getMyRequests = async (req, res, next) => {
  try {
    const requests = await TourRequest.find({ user: req.user._id })
      .populate("tourId", "title images destination duration durationInHours")
      .populate("packageId", "title tour hotel price duration")
      .sort("-createdAt");

    const now = new Date();
    for (const req of requests) {
      let changed = false;

      // Check payment expiration (either by 30-minute window or if the tour date arrives while still unpaid)
      if (req.status === "awaiting_payment" && (
        (req.paymentExpiresAt && new Date(req.paymentExpiresAt) < now) ||
        (req.preferredDate && new Date(req.preferredDate) < now)
      )) {
        req.status = "payment_expired";
        req.assignedGuide = undefined;
        req.paymentExpiresAt = undefined;
        req.guideReservationExpiresAt = undefined;
        changed = true;
      }
      // Check preferred date expiration for requests that haven't reached the payment stage
      else if (["pending_admin", "guide_pending"].includes(req.status) && req.preferredDate && new Date(req.preferredDate) < now) {
        req.status = "expired";
        changed = true;
      }

      if (changed) {
        await req.save();
      }
    }

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all requests (Admin)
// @route   GET /api/requests
// @access  Private (Admin)
const getAllRequests = async (req, res, next) => {
  try {
    const requests = await TourRequest.find()
      .populate("user", "name email")
      .populate("tourId", "title")
      .populate("packageId", "name title")
      .populate("assignedGuide", "name email phone profilePicture")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a request (Traveler)
// @route   PATCH /api/requests/:id/cancel
// @access  Private (Traveler)
const cancelRequest = async (req, res, next) => {
  try {
    const request = await TourRequest.findOne({ _id: req.params.id, user: req.user._id });

    if (!request) {
      res.status(404);
      throw new Error("Request not found");
    }

    if (["confirmed", "completed", "cancelled", "rejected", "declined_by_guide"].includes(request.status)) {
      res.status(400);
      throw new Error("This request cannot be cancelled at this stage");
    }

    if (request.assignedGuide || request.assignedSchedule) {
      const { releaseGuideReservation } = require("../services/guideReservationService");
      await releaseGuideReservation(request);
    }

    request.status = "cancelled";
    await request.save();

    await logRequestEvent({
      requestId: request._id,
      userId: req.user._id,
      role: "traveler",
      event: "REQUEST_CANCELLED",
      ipAddress: req.ip,
      metadata: { reason: "Cancelled by traveler" },
    });

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update request status
// @route   PATCH /api/requests/:id/status
// @access  Private (Admin)
const updateRequestStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const request = await TourRequest.findById(req.params.id).populate("user");

    if (!request) {
      res.status(404);
      throw new Error("Request not found");
    }

    // Fix legacy documents that might be missing newly required fields
    if (!request.travelers) request.travelers = 1;
    if (!request.requestType) request.requestType = "custom_date";

    // CRITICAL: Save status first — side effects must never block this
    request.status = status;
    await request.save();

    // NON-CRITICAL: Send notifications after save — failures are swallowed
    if (status === "approved" || status === "rejected") {
      const isApproved = status === "approved";

      try {
        const { sendNotification } = require("../services/notificationService");
        await sendNotification(request.user._id, {
          type: "system",
          priority: "NORMAL",
          message: isApproved
            ? "Your custom tour request has been approved! We are now preparing a private schedule for you."
            : "Unfortunately, your custom tour request has been rejected. Please contact support for more details.",
        });
      } catch (notifErr) {
        // Non-blocking — log and continue
        const logger = require("../utils/logger");
        logger.warn(`Failed to send in-app notification for request ${request._id}: ${notifErr.message}`);
      }

      try {
        const { sendEmail } = require("../utils/mailService");
        const { buildPremiumEmail } = require("../utils/emailTemplateBuilder");
        const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

        let emailHtml;

        if (isApproved) {
          emailHtml = buildPremiumEmail({
            type: "default",
            title: "Your Request is Approved!",
            icon: "🎉",
            accentColor: "#10B981",
            greeting: `Hello ${request.user.name},`,
            bodyLines: [
              "Great news! Your custom tour request has been approved by our team.",
              "We are now preparing a private schedule with one of our expert guides, tailored just for you."
            ],
            infoCards: [
              { title: "Status", value: "Approved", iconEmoji: "✅" },
              { title: "Preferred Date", value: request.preferredDate ? new Date(request.preferredDate).toLocaleDateString() : "To be confirmed", iconEmoji: "📅" },
              { title: "Travelers", value: `${request.travelers || 1} person(s)`, iconEmoji: "👥" }
            ],
            statusBadge: { text: "IN PROGRESS", color: "#10B981" },
            cta: {
              text: "View My Requests",
              link: `${FRONTEND_URL}/requests`,
              color: "#10B981"
            }
          });
        } else {
          emailHtml = buildPremiumEmail({
            type: "default",
            title: "Update on Your Request",
            icon: "😔",
            accentColor: "#EF4444",
            greeting: `Hello ${request.user.name},`,
            bodyLines: [
              "Thank you for choosing Kambata Travel. Unfortunately, we are unable to fulfill your custom tour request at this time.",
              "This may be due to guide availability, date constraints, or capacity limitations. We'd love to still help you explore the beautiful Kembata region."
            ],
            infoCards: [
              { title: "Status", value: "Declined", iconEmoji: "❌" }
            ],
            statusBadge: { text: "DECLINED", color: "#EF4444" },
            cta: {
              text: "Browse Public Tours",
              link: `${FRONTEND_URL}/tours`,
              color: "#EF4444"
            }
          });
        }

        await sendEmail({
          to: request.user.email,
          subject: isApproved
            ? "🎉 Your Tour Request Has Been Approved — Kambata Travel"
            : "Update on Your Tour Request — Kambata Travel",
          html: emailHtml,
        });
      } catch (emailErr) {
        const logger = require("../utils/logger");
        logger.warn(`Failed to send email for request ${request._id}: ${emailErr.message}`);
      }
    }

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Convert request to schedule
// @route   POST /api/requests/:id/convert
// @access  Private (Admin)
const convertRequestToSchedule = async (req, res, next) => {
  try {
    const { guideId, adminNotes, customPrice, startDate, endDate, startTime, endTime, meetingPoint, specialNotes } = req.body;
    const request = await TourRequest.findById(req.params.id).populate("user");

    if (!request) {
      res.status(404);
      throw new Error("Request not found");
    }

    if (!guideId || !startDate || !endDate || !startTime || !endTime || !meetingPoint) {
      res.status(400);
      throw new Error("Guide ID, startDate, endDate, startTime, endTime, and meetingPoint are required to create a schedule");
    }

    const { checkGuideAvailability } = require("../services/scheduleService");
    await checkGuideAvailability(guideId, startDate, endDate, startTime, endTime);

    let createdScheduleId;

    // ─── TOUR REQUEST ─────────────────────────────────────────────────────────
    if (request.tourId) {
      const tour = await Tour.findById(request.tourId);
      if (!tour) {
        res.status(404);
        throw new Error("Associated tour not found");
      }

      const newSchedule = {
        guide: guideId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startTime,
        endTime,
        meetingPoint,
        priceOverride: customPrice || undefined,
        specialNotes,
        remainingSlots: request.travelers || tour.maxCapacity,
        status: "published",        // valid Tour schedule enum
        scheduleType: "private",
        requestedBy: request.user._id,
        linkedRequestId: request._id,
      };

      // Use $push via updateOne to bypass full-document re-validation.
      // The Tour document may contain legacy schedules with invalid enum values
      // (e.g. status: "upcoming") that would fail Mongoose validation on save().
      const updatedTour = await Tour.findByIdAndUpdate(
        request.tourId,
        { $push: { schedules: newSchedule } },
        { new: true, runValidators: false }
      );
      createdScheduleId = updatedTour.schedules[updatedTour.schedules.length - 1]._id;

    // ─── PACKAGE REQUEST ──────────────────────────────────────────────────────
    } else if (request.packageId) {
      const PackageSchedule = require("../models/PackageSchedule");
      const pkg = await Package.findById(request.packageId);
      if (!pkg) {
        res.status(404);
        throw new Error("Associated package not found");
      }

      const pkgSchedule = await PackageSchedule.create({
        packageId: request.packageId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startTime,
        endTime,
        meetingPoint,
        priceOverride: customPrice || undefined,
        specialNotes,
        capacity: request.travelers || 1,
        availableSeats: request.travelers || 1,
        assignedGuide: guideId,
        status: "published",        // valid PackageSchedule enum
        scheduleType: "private",
        requestedBy: request.user._id,
        linkedRequestId: request._id,
      });
      createdScheduleId = pkgSchedule._id;

    } else {
      res.status(400);
      throw new Error("Request must be linked to a Tour or Package");
    }

    // ─── UPDATE REQUEST ───────────────────────────────────────────────────────
    // Fix legacy documents that might be missing newly required fields
    if (!request.travelers) request.travelers = 1;
    if (!request.requestType) request.requestType = "custom_date";

    request.status = "converted_to_schedule";
    request.assignedSchedule = createdScheduleId;
    request.assignedGuide = guideId;
    if (adminNotes) request.adminNotes = adminNotes;
    if (customPrice) request.customPrice = Number(customPrice);
    await request.save();

    // ─── NON-CRITICAL SIDE EFFECTS ────────────────────────────────────────────
    try {
      const { sendNotification } = require("../services/notificationService");
      await sendNotification(request.user._id, {
        type: "booking",
        priority: "NORMAL",
        message: `Your request has been approved! We are assigning an expert guide for you. You will be notified once the schedule is confirmed.`,
      });
    } catch (e) {
      const logger = require("../utils/logger");
      logger.warn(`Notification failed for convert request ${request._id}: ${e.message}`);
    }

    try {
      const { createRoomForContext } = require("./chatController");
      const Guide = require("../models/Guide");
      const guideDoc = await Guide.findById(guideId);
      if (guideDoc) {
        const itemTitle = request.tourId
          ? (await Tour.findById(request.tourId))?.title?.en
          : (await Package.findById(request.packageId))?.name?.en;
        await createRoomForContext({
          participants: [request.user._id, guideDoc.user],
          title: `${itemTitle || "Custom"} - ${request.user.name}`,
          contextType: "request",
          customRequestId: request._id,
        });
      }
    } catch (e) {
      const logger = require("../utils/logger");
      logger.warn(`ChatRoom creation failed for request ${request._id}: ${e.message}`);
    }

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Ranked Guides for a specific request
// @route   GET /api/requests/:id/ranked-guides
// @access  Private (Admin)
const getRankedGuidesForRequest = async (req, res, next) => {
  try {
    const { getRankedGuides } = require("../services/smartRankingService");
    
    const request = await TourRequest.findById(req.params.id);
    if (!request) {
      res.status(404);
      throw new Error("Request not found");
    }
    
    let duration = 8;
    if (request.tourId) {
      const tour = await Tour.findById(request.tourId);
      if (tour && tour.durationInHours) duration = tour.durationInHours;
    }
    
    const rankedGuides = await getRankedGuides(request.preferredDate, duration, request._id);
    
    res.status(200).json({ success: true, data: rankedGuides });
  } catch (error) {
    next(error);
  }
};

// @desc    Assign a guide to a request (reserves guide, no schedule until payment)
// @route   POST /api/requests/:id/assign-guide
// @access  Private (Admin)
const assignGuide = async (req, res, next) => {
  try {
    const { guideId, customPrice } = req.body;
    const request = await TourRequest.findById(req.params.id).populate("user", "name email");
    if (!request) {
      res.status(404);
      throw new Error("Request not found");
    }

    if (!["pending_admin", "declined_by_guide", "expired", "payment_expired"].includes(request.status)) {
      res.status(400);
      throw new Error(`Cannot assign guide when request status is ${request.status}`);
    }

    const reserved = await isGuideReserved(guideId, request._id);
    if (reserved) {
      res.status(409);
      throw new Error("This guide is temporarily reserved for another request");
    }

    const guideDoc = await Guide.findOne({ user: guideId, status: "approved" });
    if (!guideDoc) {
      res.status(400);
      throw new Error("Guide not found or not approved");
    }

    let tour = null;
    if (request.tourId) {
      tour = await Tour.findById(request.tourId);
      if (!tour) {
        res.status(404);
        throw new Error("Associated tour not found");
      }
    }

    request.assignedGuide = guideId;
    request.status = "guide_pending";
    request.guideReservationExpiresAt = new Date(Date.now() + GUIDE_RESPONSE_MS);
    request.assignedSchedule = undefined;
    if (customPrice != null) request.customPrice = Number(customPrice);
    if (tour) {
      request.finalPrice = (request.customPrice || tour.price) * request.travelers;
    }
    await request.save();

    await logRequestEvent({
      requestId: request._id,
      userId: req.user._id,
      role: "admin",
      event: "GUIDE_ASSIGNED",
      ipAddress: req.ip,
      metadata: { guideId, customPrice: request.customPrice },
    });

    try {
      const { sendNotification } = require("../services/notificationService");
      const { sendEmail } = require("../utils/mailService");
      const { buildPremiumEmail } = require("../utils/emailTemplateBuilder");
      await sendNotification(guideId, {
        type: "system",
        priority: "HIGH",
        message: "You have a new custom tour request assignment. Please accept or decline within 24 hours.",
        referenceId: request._id,
      });
      const guideUser = await require("../models/User").findById(guideId);
      if (guideUser?.email) {
        const frontendUrl = process.env.FRONTEND_URL || "https://kambata.travel";
        const emailHtml = buildPremiumEmail({
          type: "default",
          title: "New Tour Assignment",
          icon: "👨‍💼",
          accentColor: "#F59E0B",
          greeting: `Hello ${guideUser.name},`,
          bodyLines: [
            "You have been assigned a new custom tour request.",
            "Please review the details and respond (accept or decline) within 24 hours to secure this booking."
          ],
          statusBadge: { text: "ACTION REQUIRED", color: "#F59E0B" },
          cta: {
            text: "View Dashboard",
            link: `${frontendUrl}/guide-dashboard/schedule`,
            color: "#F59E0B"
          }
        });
        await sendEmail({
          to: guideUser.email,
          subject: "New Custom Tour Assignment — Kambata Travel",
          html: emailHtml,
        });
      }
      if (request.user) {
        await sendNotification(request.user._id, {
          type: "system",
          priority: "NORMAL",
          message: "A guide has been assigned to your request. Waiting for guide confirmation.",
          referenceId: request._id,
        });
      }
    } catch (e) {
      console.error("Notif error:", e);
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

// @desc    Guide responds to request assignment
// @route   POST /api/requests/:id/guide-response
// @access  Private (Guide)
const guideResponse = async (req, res, next) => {
  try {
    const { action } = req.body;
    const request = await TourRequest.findById(req.params.id).populate("user", "name email");
    
    if (!request) { res.status(404); throw new Error("Request not found"); }
    if (request.status !== "guide_pending") {
      res.status(400); throw new Error("Request not awaiting guide response");
    }
    if (request.assignedGuide?.toString() !== req.user._id.toString()) {
      res.status(403); throw new Error("You are not the assigned guide for this request");
    }

    if (action === "accept") {
      const tour = request.tourId ? await Tour.findById(request.tourId) : null;
      const pricePerPerson = request.customPrice || tour?.price || 0;
      request.finalPrice = pricePerPerson * request.travelers;
      request.status = "awaiting_payment";
      request.paymentExpiresAt = new Date(Date.now() + PAYMENT_WINDOW_MS);
      request.guideReservationExpiresAt = undefined;

      await request.save();

      await logRequestEvent({
        requestId: request._id,
        userId: req.user._id,
        role: "guide",
        event: "GUIDE_ACCEPTED",
        ipAddress: req.ip,
      });
      await logRequestEvent({
        requestId: request._id,
        userId: req.user._id,
        role: "guide",
        event: "PAYMENT_LINK_SENT",
        ipAddress: req.ip,
        metadata: { finalPrice: request.finalPrice, expiresAt: request.paymentExpiresAt },
      });

      try {
        const { sendNotification } = require("../services/notificationService");
        const { sendEmail } = require("../utils/mailService");
        const { buildPremiumEmail } = require("../utils/emailTemplateBuilder");
        const FRONTEND_URL = process.env.FRONTEND_URL || process.env.APP_FRONTEND_URL || "http://localhost:3000";
        await sendNotification(request.user._id, {
          type: "system",
          priority: "HIGH",
          message: `Your guide accepted! Complete payment within 30 minutes (ETB ${request.finalPrice.toLocaleString()}).`,
          referenceId: request._id,
        });
        if (request.user?.email) {
          const emailHtml = buildPremiumEmail({
            type: "default",
            title: "Guide Accepted!",
            icon: "✅",
            accentColor: "#10B981",
            greeting: `Hello ${request.user.name},`,
            bodyLines: [
              "Great news! Your guide has accepted your custom tour request.",
              "Please complete your payment within 30 minutes to finalize the booking."
            ],
            infoCards: [
              { title: "Amount Due", value: `ETB ${request.finalPrice.toLocaleString()}`, iconEmoji: "💰" },
              { title: "Status", value: "Awaiting Payment", iconEmoji: "⏳" }
            ],
            cta: {
              text: "Pay Now",
              link: `${FRONTEND_URL}/explorer-dashboard/my-requests`,
              color: "#10B981"
            }
          });
          await sendEmail({
            to: request.user.email,
            subject: "Guide Accepted — Complete Payment — Kambata Travel",
            html: emailHtml,
          });
        }
      } catch (e) { /* non-blocking */ }

    } else if (action === "decline") {
      request.status = "declined_by_guide";
      await request.save();

      await logRequestEvent({
        requestId: request._id,
        userId: req.user._id,
        role: "guide",
        event: "GUIDE_DECLINED",
        ipAddress: req.ip,
      });

      const guideId = request.assignedGuide;
      await releaseGuideReservation(request);

      let suggestedGuides = [];
      try {
        suggestedGuides = await getRankedGuides(request.preferredDate, 8, request._id);
      } catch (_) { /* non-blocking */ }

      try {
        const User = require("../models/User");
        const admins = await User.find({ role: "admin" }).select("_id");
        const { sendNotification } = require("../services/notificationService");
        for (const admin of admins) {
          await sendNotification(admin._id, {
            type: "system",
            priority: "HIGH",
            message: `Guide declined request ${request._id}. ${suggestedGuides.length} alternative guides available.`,
            referenceId: request._id,
          });
        }
      } catch (e) { /* non-blocking */ }

      return res.status(200).json({
        success: true,
        data: request,
        hasAvailableGuides: suggestedGuides.length > 0,
        suggestedGuides: suggestedGuides.slice(0, 5),
      });
    } else {
      res.status(400); throw new Error("Invalid action");
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

// @desc    Get request timeline from audit history
// @route   GET /api/requests/:id/timeline
// @access  Private
const getRequestTimeline = async (req, res, next) => {
  try {
    const request = await TourRequest.findById(req.params.id);
    if (!request) {
      res.status(404);
      throw new Error("Request not found");
    }
    const isOwner = request.user.toString() === req.user._id.toString();
    const isAssignedGuide = request.assignedGuide?.toString() === req.user._id.toString();
    if (!isOwner && !isAssignedGuide && req.user.role !== "admin") {
      res.status(403);
      throw new Error("Not authorized");
    }
    const logs = await RequestAuditLog.find({ requestId: request._id }).sort("createdAt");
    const timeline = buildRequestTimeline(logs, request.status);
    res.status(200).json({ success: true, data: { timeline, auditLogs: logs, status: request.status } });
  } catch (error) {
    next(error);
  }
};

// @desc    Initiate payment for awaiting_payment request
// @route   POST /api/requests/:id/initiate-payment
// @access  Private (Traveler)
const initiatePayment = async (req, res, next) => {
  try {
    const request = await TourRequest.findById(req.params.id);
    if (!request) {
      res.status(404);
      throw new Error("Request not found");
    }
    const result = await initiateRequestPayment(request, req.user, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });
    res.status(200).json({
      success: true,
      data: result.booking,
      checkoutUrl: result.checkoutUrl,
    });
  } catch (error) {
    if (error.statusCode) res.status(error.statusCode);
    next(error);
  }
};

// @desc    Admin adjusts price before payment
// @route   PATCH /api/requests/:id/price
// @access  Private (Admin)
const adjustRequestPrice = async (req, res, next) => {
  try {
    const { customPrice } = req.body;
    const request = await TourRequest.findById(req.params.id);
    if (!request) {
      res.status(404);
      throw new Error("Request not found");
    }
    if (!["pending_admin", "guide_pending", "awaiting_payment"].includes(request.status)) {
      res.status(400);
      throw new Error("Price can only be adjusted before payment is completed");
    }
    const tour = request.tourId ? await Tour.findById(request.tourId) : null;
    request.customPrice = Number(customPrice);
    request.finalPrice = Number(customPrice) * request.travelers;
    await request.save();

    await logRequestEvent({
      requestId: request._id,
      userId: req.user._id,
      role: "admin",
      event: "PRICE_ADJUSTED",
      ipAddress: req.ip,
      metadata: { customPrice, finalPrice: request.finalPrice, tourBasePrice: tour?.price },
    });

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    next(error);
  }
};

// @desc    Get suggested guides for reassignment
// @route   GET /api/requests/:id/suggested-guides
// @access  Private (Admin)
const getSuggestedGuides = async (req, res, next) => {
  try {
    const request = await TourRequest.findById(req.params.id);
    if (!request) {
      res.status(404);
      throw new Error("Request not found");
    }
    let duration = 8;
    if (request.tourId) {
      const tour = await Tour.findById(request.tourId);
      if (tour?.durationInHours) duration = tour.durationInHours;
    }
    const suggestedGuides = await getRankedGuides(request.preferredDate, duration, request._id);
    res.status(200).json({
      success: true,
      hasAvailableGuides: suggestedGuides.length > 0,
      suggestedGuides,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getAllRequests,
  updateRequestStatus,
  convertRequestToSchedule,
  getRankedGuidesForRequest,
  assignGuide,
  guideResponse,
  getRequestTimeline,
  initiatePayment,
  adjustRequestPrice,
  getSuggestedGuides,
  cancelRequest,
};
