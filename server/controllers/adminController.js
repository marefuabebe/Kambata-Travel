const User = require("../models/User");
const Booking = require("../models/Booking");
const Tour = require("../models/Tour");
const Guide = require("../models/Guide");
const Transaction = require("../models/Transaction");
const { updateRemainingSlots } = require("../services/bookingService");
const { sendNotification } = require("../services/notificationService");
const { recordAction } = require("../services/auditService");
const { sendEmail } = require("../utils/mailService");
const { buildPremiumEmail } = require("../utils/emailTemplateBuilder");
const logger = require("../utils/logger");

const PackageBooking = require("../models/PackageBooking");
const { flattenGuideAssignments } = require("./guideOpsController");

// @desc    Get high-level dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
// @desc    Get comprehensive analytics for admin dashboard
// @route   GET /api/admin/analytics
// @access  Private (Admin)
const getAnalytics = async (req, res, next) => {
  try {
    // 1. Total Revenue (Completed Bookings only)
    const tourRevenueData = await Booking.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
    ]);
    const pkgRevenueData = await PackageBooking.aggregate([
      { $match: { bookingStatus: "completed" } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
    ]);
    const tourRevenue = tourRevenueData.length > 0 ? tourRevenueData[0].totalRevenue : 0;
    const pkgRevenue = pkgRevenueData.length > 0 ? pkgRevenueData[0].totalRevenue : 0;
    const totalRevenue = tourRevenue + pkgRevenue;

    // 2. Volume Counts
    const totalUsers = await User.countDocuments();
    const totalGuides = await User.countDocuments({ role: "guide" });
    const totalTourBookings = await Booking.countDocuments();
    const totalPackageBookings = await PackageBooking.countDocuments();
    const totalBookings = totalTourBookings + totalPackageBookings;

    // 3. Top 5 Popular Packages (Aggregation)
    const popularPackages = await PackageBooking.aggregate([
      { $match: { bookingStatus: "confirmed" } },
      { $group: { _id: "$packageId", bookingCount: { $sum: 1 } } },
      { $sort: { bookingCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "packages",
          localField: "_id",
          foreignField: "_id",
          as: "packageData",
        },
      },
      { $unwind: "$packageData" },
      {
        $project: {
          _id: 1,
          bookingCount: 1,
          title: "$packageData.name.en",
          image: { $arrayElemAt: ["$packageData.images", 0] },
          price: "$packageData.basePrice"
        },
      },
    ]);

    // Top 5 Popular Tours
    const popularTours = await Booking.aggregate([
      { $match: { status: "confirmed" } },
      { $group: { _id: "$tour", bookingCount: { $sum: 1 } } },
      { $sort: { bookingCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "tours",
          localField: "_id",
          foreignField: "_id",
          as: "tourData",
        },
      },
      { $unwind: "$tourData" },
      {
        $project: {
          _id: 1,
          bookingCount: 1,
          title: "$tourData.title.en",
          image: { $arrayElemAt: ["$tourData.images", 0] },
          price: "$tourData.price",
          duration: "$tourData.durationInHours"
        },
      },
    ]);

    res.json({
      total_users: totalUsers,
      total_guides: totalGuides,
      total_bookings: totalBookings,
      total_tour_bookings: totalTourBookings,
      total_package_bookings: totalPackageBookings,
      total_revenue: totalRevenue,
      tour_revenue: tourRevenue,
      package_revenue: pkgRevenue,
      top_5_popular_tours: popularTours,
      top_5_popular_packages: popularPackages,
      currency: "ETB",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const keyword = req.query.keyword
      ? {
          $or: [
            { name: { $regex: req.query.keyword, $options: "i" } },
            { email: { $regex: req.query.keyword, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find({ ...keyword })
      .select("-password")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ ...keyword });

    res.json({
      users,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all guides
// @route   GET /api/admin/guides
// @access  Private (Admin)
const getAllGuides = async (req, res, next) => {
  try {
    const guides = await User.find({ role: "guide" })
      .select("-password")
      .sort("-createdAt")
      .lean();

    const enriched = await Promise.all(
      guides.map(async (guide) => {
        const guideProfile = await require("../models/Guide").findOne({ user: guide._id }).lean();
        return { ...guide, guideProfile };
      })
    );

    res.json(enriched);
  } catch (error) {
    next(error);
  }
};

// @desc    Manage user status (Block/Unblock/Role)
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
const manageUserStatus = async (req, res, next) => {
  try {
    const { isBlocked, role, suspendedUntil, suspendDays } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    if (user.role === "admin" && req.user._id.toString() !== user._id.toString()) {
      res.status(400);
      throw new Error("Cannot modify another admin account");
    }

    if (isBlocked !== undefined) {
      user.isBlocked = isBlocked;
      if (!isBlocked) user.blockedUntil = undefined;
    }
    if (role) user.role = role;

    if (suspendedUntil === null) {
      user.suspendedUntil = undefined;
    } else if (suspendedUntil) {
      user.suspendedUntil = new Date(suspendedUntil);
    } else if (suspendDays) {
      user.suspendedUntil = new Date(Date.now() + Number(suspendDays) * 24 * 60 * 60 * 1000);
    }

    await user.save();

    if (role) recordAction(req, "ROLE_CHANGED", "User", user._id, { newRole: role });
    if (isBlocked === true) recordAction(req, "USER_BLOCKED", "User", user._id);
    if (isBlocked === false) recordAction(req, "USER_UNBLOCKED", "User", user._id);
    if (user.suspendedUntil && user.suspendedUntil > Date.now()) {
      recordAction(req, "USER_SUSPENDED", "User", user._id, { until: user.suspendedUntil });
    }

    res.json({ message: "User updated successfully", user });
  } catch (error) {
    next(error);
  }
};

// @desc    Revoke or restore guide scheduling privileges
// @route   PATCH /api/admin/users/:id/scheduling-privilege
const revokeSchedulingPrivilege = async (req, res, next) => {
  try {
    const { disabled, reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user || user.role !== "guide") {
      res.status(404);
      throw new Error("Guide account not found");
    }

    user.schedulingDisabled = Boolean(disabled);
    await user.save();

    recordAction(
      req,
      disabled ? "SCHEDULING_PRIVILEGE_REVOKED" : "SCHEDULING_PRIVILEGE_RESTORED",
      "User",
      user._id,
      { reason }
    );

    await sendNotification(user._id, {
      type: "system",
      priority: "HIGH",
      message: disabled
        ? `Your scheduling privileges have been revoked. ${reason || "Contact support for details."}`
        : "Your scheduling privileges have been restored. You may add tour schedules again.",
    });

    res.json({
      message: disabled ? "Scheduling disabled for guide" : "Scheduling restored for guide",
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record a manual/office transaction
// @route   POST /api/admin/manual-booking
// @access  Private (Admin)
const recordManualTransaction = async (req, res, next) => {
  try {
    const { userId, tourId, scheduleId, numPeople, amount, note } = req.body;

    // 1. Capacity Check
    const tour = await Tour.findById(tourId);
    const schedule = tour.schedules.id(scheduleId);

    if (schedule.remainingSlots < numPeople) {
      res.status(400);
      throw new Error("Not enough capacity for this manual booking");
    }

    // 2. Create Confirmed Booking
    const booking = await Booking.create({
      user: userId,
      tour: tourId,
      scheduleId,
      numPeople,
      totalPrice: amount,
      status: "confirmed",
      paymentStatus: "paid",
      paymentDate: new Date(),
      paymentMethod: "manual/cash",
    });

    // 3. Create Success Transaction for Audit
    await Transaction.create({
      booking: booking._id,
      user: userId,
      amount,
      status: "success",
      paymentMethod: "manual/cash",
      tx_ref: `MANUAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      rawPayload: { note, authorizer: req.user._id },
    });

    // 4. Update Capacity
    await updateRemainingSlots(tourId, scheduleId, -numPeople);

    // Audit Log
    recordAction(req, "MANUAL_BOOKING_CREATED", "Booking", booking._id, { tourId, numPeople, amount });

    res.status(201).json({ message: "Manual booking recorded", booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings with pagination
// @route   GET /api/admin/bookings
// @access  Private (Admin)
const getAllBookings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { status, startDate, endDate } = req.query;
    const query = {};

    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(query)
      .populate("user", "name email")
      .populate("tour", "title price schedules")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all package bookings with pagination
// @route   GET /api/admin/packages
// @access  Private (Admin)
const getAllPackageBookings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { status } = req.query;
    const query = {};

    if (status) query.status = status;

    const PackageBooking = require("../models/PackageBooking");
    const bookings = await PackageBooking.find(query)
      .populate("user", "name email")
      .populate({
        path: "packageId",
        select: "name basePrice"
      })
      .populate({
        path: "packageScheduleId",
        select: "date startTime assignedGuide"
      })
      .sort("-createdAt")
      .skip(skip)
      .limit(limit);

    const total = await PackageBooking.countDocuments(query);

    res.json({
      bookings,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all transactions (Master Ledger)
// @route   GET /api/admin/transactions
// @access  Private (Admin)
const getAllTransactions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find()
      .populate("user", "name email")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments();

    res.json({
      transactions,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Protection: Admins cannot delete other admins
    if (user.role === "admin") {
      res.status(400);
      throw new Error("Admins cannot be deleted via the dashboard");
    }

    await User.findByIdAndDelete(req.params.id);

    // Audit Log
    recordAction(req, "USER_DELETED", "User", user._id, { email: user.email, name: user.name });

    res.json({ message: "User account deleted permanently" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending guide applications
// @route   GET /api/admin/guides/applications
// @access  Private (Admin)
const getGuideApplications = async (req, res, next) => {
  try {
    const applications = await User.find({ guideStatus: "pending", role: "guide" })
      .select("-password")
      .sort("-createdAt")
      .lean();

    const enriched = await Promise.all(
      applications.map(async (app) => {
        const guideProfile = await Guide.findOne({ user: app._id }).lean();
        return { ...app, guideProfile };
      })
    );

    res.json(enriched);
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a guide application
// @route   POST /api/admin/guides/:id/approve
// @access  Private (Admin)
const approveGuide = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.guideStatus !== "pending") {
      res.status(404);
      throw new Error("Application not found");
    }

    user.guideStatus = "approved";

    let guide = await Guide.findOne({ user: user._id });
    if (!guide) {
      guide = await Guide.create({ user: user._id });
    }
    
    // Strict requirement: they must have uploaded documents to be verified
    if (!guide.nationalId?.url || !guide.license?.url) {
      res.status(400);
      throw new Error("Cannot verify guide without National ID and Tour Guide License on file.");
    }
    
    guide.status = "approved";
    guide.isVerified = true;
    if (guide.nationalId?.url) guide.nationalId.status = "verified";
    if (guide.license?.url) guide.license.status = "verified";
    await guide.save();
    user.guideProfile = guide._id;
    
    await user.save();

    // Audit Log
    recordAction(req, "GUIDE_APPROVED", "User", user._id);

    // Notify User via System
    await sendNotification(user._id, {
      type: "system",
      priority: "HIGH",
      message: "Congratulations! Your guide application has been approved. You can now start creating tours.",
    });

    // Real-Time Socket Push
    try {
      require("../utils/socketIO").getIO().to(user._id.toString()).emit("application_status_update", {
        status: "approved",
        title: "Application Approved! 🎉",
        message: "Your guide application for Kambata Travel has been officially approved."
      });
    } catch (err) {
      logger.warn("Socket broadcast failed for approveGuide", err);
    }

    // Notify User via Email
    const frontendUrl = process.env.FRONTEND_URL || "https://kambata.travel";
    const emailHtml = buildPremiumEmail({
      type: "default",
      title: "Application Approved! 🎉",
      icon: "🎉",
      accentColor: "#10B981",
      greeting: `Dear ${user.name},`,
      bodyLines: [
        "Congratulations! Your guide application for Kambata Travel has been officially approved.",
        "We are thrilled to welcome you to our community of expert guides. You can now log in and start creating your first tour experience!"
      ],
      infoCards: [
        { title: "Role", value: "Verified Guide", iconEmoji: "🏅" }
      ],
      statusBadge: { text: "APPROVED", color: "#10B981" },
      cta: {
        text: "Access Your Dashboard",
        link: `${frontendUrl}/login`,
        color: "#10B981"
      }
    });

    await sendEmail({
      to: user.email,
      subject: "Welcome to Kambata Travel - Guide Application Approved!",
      html: emailHtml
    });

    res.json({ message: "Guide approved", user });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a guide application
// @route   POST /api/admin/guides/:id/reject
// @access  Private (Admin)
const rejectGuide = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user || user.guideStatus !== "pending") {
      res.status(404);
      throw new Error("Application not found");
    }

    user.guideStatus = "rejected";
    await user.save();

    const guide = await Guide.findOne({ user: user._id });
    if (guide) {
      guide.status = "rejected";
      guide.isVerified = false;
      if (guide.nationalId?.url) guide.nationalId.status = "rejected";
      if (guide.license?.url) guide.license.status = "rejected";
      await guide.save();
    }

    // Audit Log
    recordAction(req, "GUIDE_REJECTED", "User", user._id, { reason });

    // Notify User via System
    await sendNotification(user._id, {
      type: "system",
      priority: "HIGH",
      message: `Your guide application was rejected. Reason: ${reason || "Please review your credentials."}`,
    });

    // Notify User via Email
    const frontendUrl = process.env.FRONTEND_URL || "https://kambata.travel";
    const emailHtml = buildPremiumEmail({
      type: "default",
      title: "Application Update",
      icon: "😔",
      accentColor: "#EF4444",
      greeting: `Dear ${user.name},`,
      bodyLines: [
        "Thank you for applying to be a guide with Kambata Travel. We have carefully reviewed your application.",
        "Unfortunately, we are unable to approve it at this time for the following reason:"
      ],
      infoCards: [
        { title: "Reason", value: reason || "Please ensure your certification images are clear and meet our quality standards.", iconEmoji: "⚠️" }
      ],
      statusBadge: { text: "NOT APPROVED", color: "#EF4444" },
      cta: {
        text: "Log in to Update Profile",
        link: `${frontendUrl}/login`,
        color: "#EF4444"
      }
    });

    await sendEmail({
      to: user.email,
      subject: "Kambata Travel - Guide Application Update",
      html: emailHtml
    });

    // Real-Time Socket Push
    try {
      require("../utils/socketIO").getIO().to(user._id.toString()).emit("application_status_update", {
        status: "rejected",
        title: "Application Update",
        message: `Your guide application was not approved. Reason: ${reason || "Please check your documents."}`
      });
    } catch (err) {
      logger.warn("Socket broadcast failed for rejectGuide", err);
    }

    res.json({ message: "Guide application rejected" });
  } catch (error) {
    next(error);
  }
};

// @desc    Request missing documents from a guide
// @route   POST /api/admin/guides/:id/request-documents
// @access  Private (Admin)
const requestGuideDocuments = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error("Guide not found");
    }

    const message = `Dear ${user.name}, we are currently reviewing your profile on Kambata Travel. To proceed with your verification, please log in to your dashboard and upload the required professional documents (National ID and Tour Guide License).`;

    // Notify User via System
    await sendNotification(user._id, {
      type: "system",
      priority: "HIGH",
      message: "Action Required: Please upload your National ID and Tour Guide License to proceed with your verification.",
    });

    // Notify User via Email
    const frontendUrl = process.env.FRONTEND_URL || "https://kambata.travel";
    const emailHtml = buildPremiumEmail({
      type: "default",
      title: "Verification Required",
      icon: "📄",
      accentColor: "#F59E0B",
      greeting: `Dear ${user.name},`,
      bodyLines: [
        "We are currently reviewing your profile on Kambata Travel. To officially earn your \"Verified Guide\" badge and increase your visibility, we need you to provide your professional credentials."
      ],
      infoCards: [
        { title: "Required Documents", value: "Valid National ID or Passport & Official Tour Guide License", iconEmoji: "📋" }
      ],
      statusBadge: { text: "ACTION REQUIRED", color: "#F59E0B" },
      cta: {
        text: "Upload Documents Now",
        link: `${frontendUrl}/`,
        color: "#F59E0B"
      }
    });

    await sendEmail({
      to: user.email,
      subject: "Action Required: Upload Verification Documents - Kambata Travel",
      html: emailHtml
    });

    // Audit Log
    recordAction(req, "GUIDE_DOCUMENTS_REQUESTED", "User", user._id);

    res.json({ message: "Document request sent successfully via email and system notification." });
  } catch (error) {
    next(error);
  }
};

// @desc    Get details of a single guide
// @route   GET /api/admin/guides/:id
// @access  Private (Admin)
const getGuideDetails = async (req, res, next) => {
  try {
    const guide = await User.findById(req.params.id).select("-password");

    if (!guide) {
      res.status(404);
      throw new Error("Guide not found");
    }

    res.json(guide);
  } catch (error) {
    next(error);
  }
};

// @desc    Get details of a single guide calendar
// @route   GET /api/admin/guides/:id/calendar
// @access  Private (Admin)
const getGuideCalendarAdmin = async (req, res, next) => {
  try {
    const guideId = req.params.id;
    const assignments = await flattenGuideAssignments(guideId);
    
    const GuideTimeOff = require("../models/GuideTimeOff");
    const timeOffs = await GuideTimeOff.find({ guide: guideId }).lean();
    
    const events = [];
    
    for (const a of assignments) {
      if (a.rawStatus === "cancelled") continue;
      
      const start = new Date(a.date);
      if (a.startTime && a.startTime !== "—") {
        const [h, m] = a.startTime.split(":");
        start.setHours(parseInt(h), parseInt(m), 0, 0);
      }
      
      const end = new Date(a.endDate || a.date);
      if (a.endTime && a.endTime !== "—") {
        const [h, m] = a.endTime.split(":");
        end.setHours(parseInt(h), parseInt(m), 0, 0);
      } else {
        end.setHours(start.getHours() + 2);
      }
      
      events.push({
        id: a.scheduleId,
        title: a.tourName,
        start,
        end,
        type: "assignment",
        status: a.rawStatus,
        assignmentStatus: a.assignmentStatus
      });
    }
    
    for (const t of timeOffs) {
      events.push({
        id: t._id,
        title: `Time Off (${t.reason})`,
        start: new Date(t.startDate),
        end: new Date(t.endDate),
        type: "timeOff",
        status: t.status,
        reason: t.reason
      });
    }
    
    res.json({ success: true, data: events });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Cancel a booking manually
// @route   PATCH /api/admin/bookings/:id/cancel
// @access  Private (Admin)
const cancelBookingAdmin = async (req, res, next) => {
  try {
    const { reason, issueRefund } = req.body;
    const { refundTransaction } = require("../services/paymentService");
    const booking = await Booking.findById(req.params.id).populate("tour", "title");

    if (!booking) {
      res.status(404);
      throw new Error("Booking not found");
    }

    if (booking.status === "cancelled") {
      res.status(400);
      throw new Error("Booking is already cancelled");
    }

    let refundResult = null;
    if (issueRefund && booking.paymentStatus === "paid" && booking.tx_ref) {
      try {
        refundResult = await refundTransaction(booking.tx_ref, {
          reason: reason || "Admin force-cancel",
          amount: booking.totalPrice,
          reference: `CNCL-${booking._id}`,
        });
      } catch (err) {
        console.error("Chapa Refund Error (Bypassing for local override):", err.message);
        refundResult = { status: "bypassed_locally", error: err.message };
      }
      booking.paymentStatus = "refunded";
    }

    await updateRemainingSlots(booking.tour._id || booking.tour, booking.scheduleId, booking.numPeople);

    booking.status = "cancelled";
    booking.updatedBy = req.user._id;
    await booking.save();

    recordAction(req, "BOOKING_FORCE_CANCELLED", "Booking", booking._id, {
      reason,
      issueRefund: Boolean(issueRefund),
      refundResult,
    });

    await sendNotification(booking.user, {
      type: "booking",
      priority: "HIGH",
      message: `Your booking has been force-cancelled by an administrator. ${reason || ""}`,
    });

    res.json({
      message: "Booking force-cancelled by admin",
      booking,
      refund: refundResult,
    });
  } catch (error) {
    next(error);
  }
};

const Wallet = require("../models/Wallet");
const PayoutRequest = require("../models/PayoutRequest");

// ... (existing code)

// @desc    Get all pending payout requests
// @route   GET /api/admin/payouts
// @access  Private (Admin)
const getPayoutRequests = async (req, res, next) => {
  try {
    const requests = await PayoutRequest.find({ status: "pending" })
      .populate("guide", "name email")
      .sort("-createdAt");

    res.json(requests);
  } catch (error) {
    next(error);
  }
};

// @desc    Process a payout request (Approve/Reject)
// @route   PATCH /api/admin/payouts/:id
// @access  Private (Admin)
  const processPayout = async (req, res, next) => {
  try {
    const { status, adminNote, transactionReference } = req.body; // 'approved', 'completed', or 'rejected'
    
    if (!["approved", "completed", "rejected"].includes(status)) {
      res.status(400);
      throw new Error("Invalid payout status. Use 'approved', 'completed', or 'rejected'");
    }

    if (status === "completed" && !transactionReference) {
      res.status(400);
      throw new Error("Transaction Reference is required when completing a payout");
    }

    // Determine what status we expect the request to be currently in
    // To approve or reject, it can be 'pending'. To complete, it MUST be 'approved'. 
    // To reject, it can also be 'approved'.
    let expectedStatus = "pending";
    if (status === "completed") {
      expectedStatus = "approved";
    } else if (status === "rejected") {
      expectedStatus = { $in: ["pending", "approved"] };
    }

    // Status-based optimistic locking: Atomically find the request and update it
    const payout = await PayoutRequest.findOneAndUpdate(
      { _id: req.params.id, status: expectedStatus },
      { 
        status, 
        adminNote: status === "rejected" ? adminNote : undefined,
        transactionReference: status === "completed" ? transactionReference : undefined,
        processedAt: (status === "completed" || status === "rejected") ? new Date() : undefined
      },
      { new: true }
    );

    if (!payout) {
      res.status(404);
      throw new Error("Payout request not found or invalid state transition");
    }

    let walletUpdate = null;
    if (status === "completed") {
      walletUpdate = { $inc: { pendingPayout: -payout.amount } };
    } else if (status === "rejected") {
      // Refund back to balance
      walletUpdate = { $inc: { pendingPayout: -payout.amount, balance: payout.amount } };
    }

    if (walletUpdate) {
      const wallet = await Wallet.findOneAndUpdate(
        { guide: payout.guide },
        walletUpdate,
        { new: true }
      );

      if (!wallet) {
        res.status(404);
        throw new Error("Wallet not found for this guide");
      }
    }

    // Audit Log
    const AuditLog = require("../models/AuditLog");
    let actionName = "PAYOUT_APPROVED";
    if (status === "completed") actionName = "WITHDRAWAL_COMPLETED";
    if (status === "rejected") actionName = "PAYOUT_REJECTED";
    if (status === "approved") actionName = "WITHDRAWAL_APPROVED";

    await AuditLog.create([{
      action: actionName,
      targetType: "PayoutRequest",
      targetId: payout._id,
      actor: req.user._id, // Admin processing
      metadata: { status, amount: payout.amount, adminNote, transactionReference }
    }]);

    res.json({ message: `Payout request ${status}`, payout });
  } catch (error) {
    next(error);
  }
};

const AuditLog = require("../models/AuditLog");

// ... (existing code)

// @desc    Get all audit logs (History Trail)
// @route   GET /api/admin/audit-logs
// @access  Private (Admin)
const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find()
      .populate("actor", "name email")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments();

    res.json({
      logs,
      page,
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify a guide and assign a badge
// @route   PATCH /api/admin/guides/:id/verify
// @access  Private (Admin)
const verifyGuide = async (req, res, next) => {
  try {
    const { isVerified, badge, badgeIcon } = req.body;
    const guide = await Guide.findOne({ user: req.params.id });

    if (!guide) {
      res.status(404);
      throw new Error("Guide profile not found");
    }

    // STRICT TRUST RULES
    const user = await User.findById(req.params.id);

    if (isVerified) {
      if (!user || user.guideStatus !== "approved") {
        res.status(400);
        throw new Error("Guide must be approved before receiving a verified badge");
      }
      if (!guide.nationalId?.url || !guide.license?.url) {
        res.status(400);
        throw new Error("Cannot verify guide without National ID and Tour Guide License on file");
      }
    }

    guide.isVerified = Boolean(isVerified);
    if (badge) {
      guide.badges.push({ 
        name: badge, 
        iconUrl: badgeIcon || "", 
        issuedAt: new Date() 
      });
    }

    await guide.save();

    if (isVerified) {
      const emailHtml = buildPremiumEmail({
        type: "default",
        title: "You are now a Verified Guide!",
        icon: "🏅",
        accentColor: "#10B981",
        greeting: `Hello ${user.name},`,
        bodyLines: [
          "High quality trust markers have been added to your profile.",
          "Travelers will now see the 'Verified' badge on all your tours, helping you stand out and get more bookings."
        ],
        statusBadge: { text: "VERIFIED", color: "#10B981" }
      });

      await sendEmail({
        to: user.email,
        subject: "Professional Vetting Update - Kambata Travel",
        html: emailHtml
      });
    }

    // Audit Log
    recordAction(req, "GUIDE_VERIFIED", "User", guide.user, { isVerified, badge });

    res.json({ message: `Guide verification status: ${isVerified}`, guide });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Force reset a user's password (Override)
// @route   PATCH /api/admin/users/:id/reset-password
// @access  Private (Admin)
const resetUserPasswordAdmin = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      res.status(400);
      throw new Error("Password must be at least 6 characters");
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const bcrypt = require("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    recordAction(req, "PASSWORD_OVERRIDE", "User", user._id);
    res.json({ message: "User password reset successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Override payment status (Refund/Manual Fix)
// @route   PATCH /api/admin/bookings/:id/payment-override
// @access  Private (Admin)
const overridePaymentStatus = async (req, res, next) => {
  try {
    const { paymentStatus, reason } = req.body;
    const { refundTransaction } = require("../services/paymentService");

    if (!["paid", "refunded", "failed"].includes(paymentStatus)) {
      res.status(400);
      throw new Error("Invalid payment status override");
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      throw new Error("Booking not found");
    }

    let refundResult = null;
    if (paymentStatus === "refunded") {
      if (!booking.tx_ref) {
        res.status(400);
        throw new Error("No Chapa transaction reference on this booking");
      }
      if (booking.paymentStatus !== "paid") {
        res.status(400);
        throw new Error("Only paid bookings can be refunded");
      }
      try {
        refundResult = await refundTransaction(booking.tx_ref, {
          reason: reason || "Admin manual refund",
          amount: booking.totalPrice,
          reference: `RFND-${booking._id}`,
        });
      } catch (err) {
        console.error("Chapa Refund Error (Bypassing for local override):", err.message);
        refundResult = { status: "bypassed_locally", error: err.message };
      }
    }

    booking.paymentStatus = paymentStatus;
    booking.updatedBy = req.user._id;
    await booking.save();

    recordAction(
      req,
      paymentStatus === "refunded" ? "MANUAL_REFUND_ISSUED" : "PAYMENT_OVERRIDE",
      "Booking",
      booking._id,
      { newStatus: paymentStatus, reason, refundResult }
    );

    res.json({
      message:
        paymentStatus === "refunded"
          ? "Manual refund issued via Chapa"
          : `Payment status overridden to ${paymentStatus}`,
      booking,
      refund: refundResult,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Hide or restore a review (moderation layer 2)
// @route   PATCH /api/admin/reviews/:id/moderate
const moderateReview = async (req, res, next) => {
  try {
    const Review = require("../models/Review");
    const { isHidden, moderationNote } = req.body;
    const review = await Review.findById(req.params.id);

    if (!review) {
      res.status(404);
      throw new Error("Review not found");
    }

    review.isHidden = Boolean(isHidden);
    if (moderationNote) review.moderationNote = moderationNote;
    await review.save();
    await Review.calcAverageRatings(review.tour);

    recordAction(
      req,
      isHidden ? "REVIEW_HIDDEN" : "REVIEW_RESTORED",
      "Review",
      review._id,
      { tourId: review.tour, moderationNote }
    );

    res.json({ message: isHidden ? "Review hidden from public" : "Review restored", review });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete a review (Moderation)
// @route   DELETE /api/admin/reviews/:id
// @access  Private (Admin)
const deleteReviewAdmin = async (req, res, next) => {
  try {
    const Review = require("../models/Review");
    const review = await Review.findById(req.params.id);
    if (!review) {
      res.status(404);
      throw new Error("Review not found");
    }

    await review.deleteOne();
    recordAction(req, "REVIEW_DELETED", "Review", req.params.id, { tourId: review.tour });
    res.json({ message: "Review removed by moderator" });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: View all on-demand booking requests (Dispute Management)
// @route   GET /api/admin/requests
// @access  Private (Admin)
const getAllBookingRequests = async (req, res, next) => {
  try {
    const BookingRequest = require("../models/BookingRequest");
    const requests = await BookingRequest.find()
      .populate("traveler", "name email")
      .populate("guide", "name email")
      .populate("tour", "title")
      .sort("-createdAt");

    res.json(requests);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: View all reviews (Global List)
// @route   GET /api/admin/reviews/all
// @access  Private (Admin)
const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const Review = require("../models/Review");
    const reviews = await Review.find()
      .populate("user", "name email")
      .populate("tour", "title")
      .sort("-createdAt");

    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Send a system-wide announcement
// @route   POST /api/admin/announcements
// @access  Private (Admin)
const sendGlobalAnnouncement = async (req, res, next) => {
  try {
    const { title, message, priority } = req.body;
    const User = require("../models/User");
    const { sendNotification } = require("../services/notificationService");

    const users = await User.find().select("_id");
    
    // Broadcast to all users
    const notificationPromises = users.map(user => 
      sendNotification(user._id, {
        type: "system",
        priority: priority || "NORMAL",
        message: `${title}: ${message}`
      })
    );

    await Promise.all(notificationPromises);
    recordAction(req, "GLOBAL_ANNOUNCEMENT_SENT", "System", null, { title });

    res.json({ message: `Announcement broadcasted to ${users.length} users` });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get unified view of all tour schedules (Attendance Monitor)
// @route   GET /api/admin/attendance
// @access  Private (Admin)
const getAttendanceSchedules = async (req, res, next) => {
  try {
    const tours = await Tour.aggregate([
      { $unwind: "$schedules" },
      {
        $lookup: {
          from: "users",
          localField: "schedules.guide",
          foreignField: "_id",
          as: "guideData",
        },
      },
      { $unwind: { path: "$guideData", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          tourTitle: "$title.en",
          scheduleId: "$schedules._id",
          startDate: "$schedules.startDate",
          endDate: "$schedules.endDate",
          status: "$schedules.status",
          remainingSlots: "$schedules.remainingSlots",
          maxCapacity: "$maxCapacity",
          guideId: "$guideData._id",
          guideName: { $ifNull: ["$guideData.name", "Unassigned"] },
          guideEmail: { $ifNull: ["$guideData.email", "N/A"] },
          guideProfilePicture: "$guideData.profilePicture",
        },
      },
      { $sort: { startDate: 1 } },
    ]);

    res.json({ success: true, count: tours.length, data: tours });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get all incident reports from tour schedules
// @route   GET /api/admin/incidents
// @access  Private (Admin)
const getIncidentReports = async (req, res, next) => {
  try {
    const incidents = await Tour.aggregate([
      { $unwind: "$schedules" },
      { 
        $match: { 
          "schedules.incidentReport": { $exists: true, $ne: "" },
          "schedules.incidentReport": { $ne: null }
        } 
      },
      {
        $lookup: {
          from: "users",
          localField: "schedules.guide",
          foreignField: "_id",
          as: "guideData",
        },
      },
      { $unwind: { path: "$guideData", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          tourTitle: "$title.en",
          scheduleId: "$schedules._id",
          startDate: "$schedules.startDate",
          endDate: "$schedules.endDate",
          status: "$schedules.status",
          incidentReport: "$schedules.incidentReport",
          guideId: "$guideData._id",
          guideName: { $ifNull: ["$guideData.name", "Unassigned"] },
          guideEmail: { $ifNull: ["$guideData.email", "N/A"] },
        },
      },
      { $sort: { startDate: -1 } }, // Sort newest incidents first
    ]);

    res.json({ success: true, count: incidents.length, data: incidents });
  } catch (error) {
    next(error);
  }
};

// @desc    Auto clear earnings for completed tours > 24 hours
// @route   POST /api/admin/payouts/auto-clear-earnings
// @access  Public (Webhook/Ping) or Private (Admin)
const autoClearEarnings = async (req, res, next) => {
  const { clearGuideEarnings } = require("../services/walletService");
  const IncidentReport = require("../models/IncidentReport");
  const AuditLog = require("../models/AuditLog");

  try {
    // 1. Verify Webhook Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401);
      throw new Error("Unauthorized: Missing or invalid Bearer token");
    }

    const token = authHeader.split(" ")[1];
    if (token !== process.env.CRON_SECRET) {
      res.status(401);
      throw new Error("Unauthorized: Invalid CRON_SECRET");
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const bookingsToClear = await Booking.find({
      status: "completed",
      payoutStatus: "pending_clearance",
      completedAt: { $lte: twentyFourHoursAgo },
      hasDispute: false
    });

    let clearedCount = 0;
    let failedCount = 0;

    for (const booking of bookingsToClear) {
      // Double check active disputes for this booking's guide and tour
      const activeDisputes = await IncidentReport.countDocuments({
        scheduleId: booking.scheduleId,
        status: { $in: ["open", "under_review"] }
      });

      if (activeDisputes > 0 || booking.hasDispute) {
        // Skip clearance
        failedCount++;
        continue;
      }

      try {
        await clearGuideEarnings(booking._id);
        clearedCount++;
      } catch (err) {
        logger.error(`Failed to auto-clear earnings for booking ${booking._id}: ${err.message}`);
        failedCount++;
      }
    }

    // Add Audit Log
    await AuditLog.create([{
      action: "AUTO_CLEAR_EARNINGS_RAN",
      targetType: "System",
      targetId: req.user?._id || "640a34b2f15a6b001f3e5c9a", // A dummy user ID or system ID (actor requires ObjectId, but targetId is conditionally required. For System, targetId is not required)
      actor: "000000000000000000000000", // "System" actor. Actor MUST be an ObjectId. We'll use a zero ObjectId.
      metadata: { clearedCount, failedCount, totalProcessed: bookingsToClear.length }
    }]);

    res.json({
      success: true,
      message: `Auto-clear process completed`,
      cleared: clearedCount,
      failed: failedCount,
      totalProcessed: bookingsToClear.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin resolves a booking dispute
// @route   PATCH /api/admin/bookings/:id/resolve-dispute
// @access  Private (Admin)
const resolveDispute = async (req, res, next) => {
  const { resolution } = req.body; // 'guide_favor' or 'traveler_favor'
  const { clearGuideEarnings } = require("../services/walletService");

  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      res.status(404);
      throw new Error("Booking not found");
    }

    if (!booking.hasDispute) {
      res.status(400);
      throw new Error("This booking is not under dispute");
    }

    if (resolution === "guide_favor") {
      // Clear earnings to guide
      if (booking.payoutStatus === "pending_clearance") {
        await clearGuideEarnings(booking._id);
      }
      booking.hasDispute = false; // Resolved
    } else if (resolution === "traveler_favor") {
      // Keep it pending_clearance but maybe marked refunded?
      // For now, let's just mark it as refunded
      booking.payoutStatus = "refunded";
      booking.hasDispute = false;
    } else {
      res.status(400);
      throw new Error("Invalid resolution. Use 'guide_favor' or 'traveler_favor'");
    }

    await booking.save();

    // Audit Log
    const AuditLog = require("../models/AuditLog");
    await AuditLog.create([{
      action: "DISPUTE_RESOLVED",
      targetType: "Booking",
      targetId: booking._id,
      actor: req.user._id,
      metadata: { resolution, amount: booking.totalPrice }
    }]);

    res.json({ success: true, message: `Dispute resolved in ${resolution}`, data: booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Accounting Reports
// @route   GET /api/admin/accounting
// @access  Private (Admin)
const getAccountingReports = async (req, res, next) => {
  const Wallet = require("../models/Wallet");
  const PayoutRequest = require("../models/PayoutRequest");

  try {
    const { startDate, endDate } = req.query;
    
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const matchQuery = {
      status: "completed",
      completedAt: { $gte: start, $lte: end }
    };

    const bookings = await Booking.aggregate([
      { $match: matchQuery },
      { $group: {
          _id: null,
          totalGrossRevenue: { $sum: "$totalPrice" },
          totalPlatformFees: { $sum: { $ifNull: ["$platformFee", { $multiply: ["$totalPrice", 0.15] }] } },
          totalGuideEarnings: { $sum: { $subtract: ["$totalPrice", { $ifNull: ["$platformFee", { $multiply: ["$totalPrice", 0.15] }] }] } }
      }}
    ]);

    const payouts = await PayoutRequest.aggregate([
      { $match: { status: "completed", processedAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, totalPaidOut: { $sum: "$amount" } } }
    ]);

    const wallets = await Wallet.aggregate([
      { $group: { _id: null, totalPending: { $sum: "$pendingEarnings" }, totalAvailable: { $sum: "$balance" }, totalProcessing: { $sum: "$pendingPayout" } } }
    ]);

    const stats = {
      period: { start, end },
      grossRevenue: bookings[0]?.totalGrossRevenue || 0,
      platformFees: bookings[0]?.totalPlatformFees || 0,
      guideEarnings: bookings[0]?.totalGuideEarnings || 0,
      paidOut: payouts[0]?.totalPaidOut || 0,
      outstandingBalances: {
        pendingClearance: wallets[0]?.totalPending || 0,
        availableToWithdraw: wallets[0]?.totalAvailable || 0,
        withdrawalProcessing: wallets[0]?.totalProcessing || 0,
      }
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// @desc    Export Accounting Reports as CSV
// @route   GET /api/admin/accounting/export
// @access  Private (Admin)
const exportAccountingCSV = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(0);

    const bookings = await Booking.find({
      status: "completed",
      completedAt: { $gte: start, $lte: end }
    }).populate("guide", "name email").populate("tour", "title");

    let csv = "Booking ID,Completed At,Tour Title,Guide Name,Gross Revenue,Platform Fee,Guide Earnings\n";

    bookings.forEach(b => {
      const gross = b.totalPrice || 0;
      const fee = b.platformFee || (gross * 0.15);
      const earnings = gross - fee;
      const date = b.completedAt ? new Date(b.completedAt).toISOString() : "";
      
      let tourTitle = b.tour?.title?.en || b.tour?.title || "Unknown Tour";
      if (typeof tourTitle === "string") tourTitle = tourTitle.replace(/,/g, "");

      const guideName = b.guide?.name?.replace(/,/g, "") || "Unknown Guide";

      csv += `${b._id},${date},${tourTitle},${guideName},${gross},${fee},${earnings}\n`;
    });

    res.header("Content-Type", "text/csv");
    res.attachment(`accounting_report_${start.toISOString().split("T")[0]}_to_${end.toISOString().split("T")[0]}.csv`);
    return res.send(csv);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics,
  getAllUsers,
  getAllGuides,
  getGuideDetails,
  getGuideApplications,
  approveGuide,
  rejectGuide,
  requestGuideDocuments,
  manageUserStatus,
  deleteUser,
  recordManualTransaction,
  getAllBookings,
  getAllPackageBookings,
  cancelBookingAdmin,
  getPayoutRequests,
  processPayout,
  getAllTransactions,
  getAuditLogs,
  verifyGuide,
  resetUserPasswordAdmin,
  overridePaymentStatus,
  deleteReviewAdmin,
  getAllBookingRequests,
  getAllReviewsAdmin,
  sendGlobalAnnouncement,
  moderateReview,
  revokeSchedulingPrivilege,
  getAttendanceSchedules,
  getIncidentReports,
  getGuideCalendarAdmin,
  autoClearEarnings,
  resolveDispute,
  getAccountingReports,
  exportAccountingCSV,
};
