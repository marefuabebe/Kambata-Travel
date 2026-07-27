const Tour = require("../models/Tour");
const Booking = require("../models/Booking");
const BookingRequest = require("../models/BookingRequest");
const User = require("../models/User");
const Guide = require("../models/Guide");
const { sendNotification } = require("../services/notificationService");
const logger = require("../utils/logger");

const isProfileReadyForReview = (user, guide) => {
  const bio = guide?.bio?.en || guide?.bio || "";
  const hasBio = bio.trim().length >= 50;
  const hasContact = Boolean(user.phone && user.location);
  const hasSpecialties = Array.isArray(guide?.specialties) && guide.specialties.length >= 1;
  const hasLanguages = Array.isArray(guide?.languages) && guide.languages.length >= 1;
  const hasNationalId = Boolean(guide?.nationalId?.url);
  const hasLicense = Boolean(guide?.license?.url);
  return hasBio && hasContact && hasSpecialties && hasLanguages && hasNationalId && hasLicense;
};

// @desc    Get aggregated stats for the logged-in guide
// @route   GET /api/guides/stats
// @access  Private (Guide)
const getGuideStats = async (req, res, next) => {
  try {
    const guideId = req.user._id;
    const { getGuideScheduleIds } = require("../services/tourBookingRules");
    const scheduleIds = await getGuideScheduleIds(guideId);

    const totalTours = await Tour.countDocuments({ "schedules.guide": guideId });

    const totalBookings = await Booking.countDocuments({
      $or: [{ guide: guideId }, { scheduleId: { $in: scheduleIds } }],
      status: { $in: ["confirmed", "completed"] },
    });

    const pendingRequests = await BookingRequest.countDocuments({
      guide: guideId,
      status: "pending",
    });

    const earningsData = await Booking.aggregate([
      { 
        $match: { 
          $or: [{ guide: guideId }, { scheduleId: { $in: scheduleIds } }],
          status: { $in: ["confirmed", "completed"] },
          paymentStatus: "paid"
        } 
      },
      { 
        $group: { 
          _id: null, 
          totalEarnings: { $sum: "$totalPrice" } 
        } 
      }
    ]);

    const totalEarnings = earningsData.length > 0 ? earningsData[0].totalEarnings : 0;

    // 6. Monthly Earnings Trend (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Booking.aggregate([
      {
        $match: {
          $or: [{ guide: guideId }, { scheduleId: { $in: scheduleIds } }],
          status: { $in: ["confirmed", "completed"] },
          paymentStatus: "paid",
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { 
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          earnings: { $sum: "$totalPrice" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalTours,
        totalBookings,
        pendingRequests,
        totalEarnings,
        monthlyTrend
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get profile for the logged-in guide
// @route   GET /api/guides/profile
// @access  Private (Guide)
const getGuideProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select("-password -resetPasswordOTP");
    let guideProfile = await Guide.findOne({ user: userId });

    if (!guideProfile) {
      guideProfile = await Guide.create({ user: userId });
    }

    // Mask Financial Data
    const maskedBankDetails = user.bankDetails ? {
      ...user.bankDetails.toObject(),
      accountNumber: user.bankDetails.accountNumber ? 
        user.bankDetails.accountNumber.slice(-4).padStart(user.bankDetails.accountNumber.length || 8, '*') : ""
    } : undefined;

    const maskedMobileMoney = user.mobileMoney ? {
      ...user.mobileMoney.toObject(),
      phoneNumber: user.mobileMoney.phoneNumber ? 
        user.mobileMoney.phoneNumber.slice(-4).padStart(user.mobileMoney.phoneNumber.length || 8, '*') : ""
    } : undefined;

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        profilePicture: user.profilePicture,
        bankDetails: maskedBankDetails,
        mobileMoney: maskedMobileMoney,
        role: user.role,
        guideStatus: user.guideStatus,
        schedulingDisabled: user.schedulingDisabled,
        guideProfile,
        profileReadyForReview: isProfileReadyForReview(user, guideProfile),
      }
    });
  } catch (error) {
    logger.error(`Error fetching guide profile: ${error.message}`);
    next(error);
  }
};

// @desc    Update profile for the logged-in guide
// @route   PUT /api/guides/profile
// @access  Private (Guide)
const updateGuideProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { 
      name, email, phone, location, profilePicture, bio, experienceYears, specialties,
      bankDetails, mobileMoney, nationalIdUrl, licenseUrl, guideType, languages, age
    } = req.body;

    const currentUser = await User.findById(userId);
    if (!currentUser) throw new Error("User not found");

    // 1. Update User Record
    const userUpdate = {};
    if (name) userUpdate.name = name;
    if (email) userUpdate.email = email;
    if (phone) userUpdate.phone = phone;
    if (location) userUpdate.location = location;
    if (profilePicture) userUpdate.profilePicture = profilePicture;

    // Safely merge bank details and ignore if it contains masking stars
    if (bankDetails) {
      userUpdate.bankDetails = { ...currentUser.bankDetails?.toObject(), ...bankDetails };
      if (bankDetails.accountNumber && bankDetails.accountNumber.includes("*")) {
        userUpdate.bankDetails.accountNumber = currentUser.bankDetails.accountNumber;
      } else if (bankDetails.accountNumber) {
        logger.warn(`Financial modification: Guide ${userId} updated bank account number.`);
      }
    }

    if (mobileMoney) {
      userUpdate.mobileMoney = { ...currentUser.mobileMoney?.toObject(), ...mobileMoney };
      if (mobileMoney.phoneNumber && mobileMoney.phoneNumber.includes("*")) {
        userUpdate.mobileMoney.phoneNumber = currentUser.mobileMoney.phoneNumber;
      } else if (mobileMoney.phoneNumber) {
        logger.warn(`Financial modification: Guide ${userId} updated mobile money phone number.`);
      }
    }

    const user = await User.findByIdAndUpdate(userId, userUpdate, { new: true, runValidators: true });

    // 2. Update Guide Record
    const guideUpdate = {};
    if (bio) guideUpdate.bio = { en: bio };
    if (experienceYears !== undefined) guideUpdate.experienceYears = experienceYears;
    if (specialties) guideUpdate.specialties = specialties;
    if (guideType) guideUpdate.guideType = guideType;
    if (languages) guideUpdate.languages = languages;
    if (age !== undefined && age !== "") guideUpdate.age = Number(age);

    // Note: nationalIdUrl and licenseUrl from frontend are just legacy support for now,
    // if passed we'll wrap them in the new nested object structure.
    if (nationalIdUrl) {
      guideUpdate.nationalId = { url: nationalIdUrl, status: "pending" };
    }
    if (licenseUrl) {
      guideUpdate.license = { url: licenseUrl, status: "pending" };
    }

    const guide = await Guide.findOneAndUpdate(
      { user: userId },
      guideUpdate,
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      data: {
        user,
        guideProfile: guide
      }
    });
  } catch (error) {
    logger.error(`Error updating guide profile: ${error.message}`);
    next(error);
  }
};

// @desc    Get all approved guides for landing/discovery
// @route   GET /api/guides/public
// @access  Public
const getPublicGuides = async (req, res, next) => {
  try {
    const approvedUsers = await User.find({
      role: "guide",
      guideStatus: "approved",
      schedulingDisabled: { $ne: true },
      isBlocked: { $ne: true },
    }).select("_id name profilePicture guideProfile");

    const guideProfiles = await Guide.find({
      user: { $in: approvedUsers.map((u) => u._id) },
    })
      .select("bio specialties stats languages isVerified user")
      .lean();

    const userMap = Object.fromEntries(approvedUsers.map((u) => [u._id.toString(), u]));

    const formattedGuides = guideProfiles.map((g) => {
      const u = userMap[g.user?.toString()];
      return {
        _id: g._id,
        userId: g.user,
        name: u?.name || "Local Expert",
        profilePicture: u?.profilePicture || "/images/default-avatar.png",
        bio: g.bio?.en || g.bio,
        specialties: g.specialties,
        languages: g.languages,
        stats: g.stats,
        isVerified: g.isVerified,
      };
    });

    res.json({
      success: true,
      data: formattedGuides
    });
  } catch (error) {
    logger.error(`Error fetching public guides: ${error.message}`);
    next(error);
  }
};

// @desc    Get full public profile for a single guide (by Guide._id or User._id)
// @route   GET /api/guides/public/:id
// @access  Public
const getPublicGuideProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const Review = require("../models/Review");

    // Try finding by guide profile ID first, then by user ID
    let guideProfile = await Guide.findById(id)
      .populate("user", "name profilePicture location phone guideStatus")
      .lean();

    if (!guideProfile) {
      guideProfile = await Guide.findOne({ user: id })
        .populate("user", "name profilePicture location phone guideStatus")
        .lean();
    }

    if (!guideProfile || guideProfile.user?.guideStatus !== "approved") {
      res.status(404);
      throw new Error("Guide not found or not yet approved");
    }

    const userId = guideProfile.user._id;

    // Fetch recent public reviews for this guide
    const reviews = await Review.find({
      guide: userId,
      reviewType: "guide",
      isHidden: { $ne: true },
    })
      .populate("user", "name profilePicture")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Fetch tours led by this guide (unique, with at least one completed schedule)
    const toursLed = await Tour.find({
      "schedules.guide": userId,
    })
      .select("title images duration difficulty rating destination")
      .populate("destination", "name location")
      .limit(8)
      .lean();

    // Build rating distribution
    const ratingCounts = await Review.aggregate([
      { $match: { guide: userId, reviewType: "guide", isHidden: { $ne: true } } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
      const found = ratingCounts.find((r) => r._id === star);
      return { star, count: found?.count || 0 };
    });

    res.json({
      success: true,
      data: {
        _id: guideProfile._id,
        userId,
        name: guideProfile.user.name,
        profilePicture: guideProfile.user.profilePicture,
        location: guideProfile.user.location,
        bio: guideProfile.bio?.en || guideProfile.bio || "",
        specialties: guideProfile.specialties || [],
        languages: guideProfile.languages || [],
        experienceYears: guideProfile.experienceYears || 0,
        badges: guideProfile.badges || [],
        isVerified: guideProfile.isVerified,
        stats: guideProfile.stats || { completedBookings: 0, averageRating: 0, totalReviews: 0 },
        ratingDistribution,
        reviews,
        toursLed,
      },
    });
  } catch (error) {
    logger.error(`Error fetching public guide profile: ${error.message}`);
    next(error);
  }
};



// @desc    Upload guide credential document
// @route   POST /api/guides/upload-document
// @access  Private (Guide)
const uploadGuideDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error("No document file provided");
    }

    const { documentType, documentName } = req.body; // "nationalId", "license", "certificates", or "verificationPdfs"
    if (!["nationalId", "license", "certificates", "verificationPdfs"].includes(documentType)) {
      res.status(400);
      throw new Error("Invalid document type.");
    }

    const { uploadImage } = require("../utils/cloudinary");
    const fs = require("fs");
    
    // Upload to Cloudinary using disk path
    const cloudinaryResult = await uploadImage(req.file.path, "kambata-travel/credentials");
    
    // Cleanup local temp file
    await fs.promises.unlink(req.file.path).catch(err => 
      logger.error(`Failed to delete temp file ${req.file.path}: ${err.message}`)
    );
    
    // Save to Guide profile
    const guide = await Guide.findOne({ user: req.user._id });
    if (!guide) {
      res.status(404);
      throw new Error("Guide profile not found");
    }
    
    const docData = {
      url: cloudinaryResult.url,
      public_id: cloudinaryResult.public_id,
      resource_type: cloudinaryResult.resource_type,
      status: "pending"
    };

    if (documentType === "nationalId") {
      guide.nationalId = docData;
    } else if (documentType === "license") {
      guide.license = docData;
    } else if (documentType === "certificates") {
      guide.certificates.push({ ...docData, name: documentName || "Certificate" });
    } else if (documentType === "verificationPdfs") {
      guide.verificationPdfs.push({ ...docData, name: documentName || "Verification Document" });
    }
    
    await guide.save();
    
    logger.info(`Document uploaded for guide: ${req.user._id}, Type: ${documentType}`);
    
    res.json({
      success: true,
      message: `${documentType} document uploaded successfully`,
      data: {
        [documentType]: guide[documentType]
      }
    });

  } catch (error) {
    const fs = require("fs");
    if (req.file && fs.existsSync(req.file.path)) {
      await fs.promises.unlink(req.file.path).catch(err => 
        logger.error(`Failed to delete temp file ${req.file.path}: ${err.message}`)
      );
    }
    logger.error(`Failed to upload document for ${req.user?._id}: ${error.message}`);
    next(error);
  }
};

// @desc    Stream sensitive guide verification document
// @route   GET /api/guides/documents?url=...
// @access  Private (Guide or Admin)
const streamGuideDocument = async (req, res, next) => {
  try {
    const fileUrl = req.query.url;
    if (!fileUrl) {
      res.status(400);
      throw new Error("No URL provided");
    }

    // Verify authorization: User must be a guide or admin. (Middlewares should already enforce 'guide' or 'admin', but let's be safe).
    // The protect middleware already checks if req.user exists.

    const axios = require("axios");
    const response = await axios({
      method: "GET",
      url: fileUrl,
      responseType: "stream",
    });

    res.setHeader("Content-Type", response.headers["content-type"]);
    res.setHeader("Content-Disposition", `inline`);

    response.data.pipe(res);
  } catch (error) {
    logger.error(`Failed to proxy document for ${req.user?._id}: ${error.message}`);
    res.status(500);
    next(new Error("Failed to stream document"));
  }
};

// @desc    Submit profile + documents for admin vetting
// @route   POST /api/guides/submit-for-review
const submitForReview = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const guide = await Guide.findOne({ user: req.user._id });

    if (!user || user.role !== "guide") {
      res.status(403);
      throw new Error("Only guides can submit for review");
    }

    if (!["none", "rejected"].includes(user.guideStatus)) {
      res.status(400);
      throw new Error(
        user.guideStatus === "pending"
          ? "Your application is already awaiting admin review."
          : "Your guide account is already approved."
      );
    }

    if (!isProfileReadyForReview(user, guide)) {
      res.status(400);
      throw new Error(
        "Complete your bio (50+ characters), contact info, languages, specialties, and upload both Government ID and Tour Guide License before submitting."
      );
    }

    user.guideStatus = "pending";
    if (guide) {
      guide.status = "pending";
      await guide.save();
    }
    await user.save();

    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      await sendNotification(admin._id, {
        type: "system",
        priority: "HIGH",
        message: `New guide application ready for vetting: ${user.name} (${user.email}).`,
        referenceId: user._id,
      });
    }

    res.json({
      success: true,
      message: "Application submitted. An admin will review your documents shortly.",
      data: { guideStatus: user.guideStatus },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Re-submit after rejection
// @route   POST /api/guides/resubmit
const resubmitApplication = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const guide = await Guide.findOne({ user: req.user._id });

    if (!user || user.guideStatus !== "rejected") {
      res.status(400);
      throw new Error("Only rejected applications can be resubmitted");
    }

    if (!isProfileReadyForReview(user, guide)) {
      res.status(400);
      throw new Error("Update your profile and re-upload documents before resubmitting.");
    }

    user.guideStatus = "pending";
    if (guide) {
      guide.status = "pending";
      if (guide.nationalId?.url) guide.nationalId.status = "pending";
      if (guide.license?.url) guide.license.status = "pending";
      await guide.save();
    }
    await user.save();

    res.json({
      success: true,
      message: "Application resubmitted for admin review.",
      data: { guideStatus: user.guideStatus },
    });
  } catch (error) {
    next(error);
  }
};

const getPendingAssignments = async (req, res, next) => {
  try {
    const guideId = req.user._id;
    
    // Find Tours with pending schedules for this guide
    const tours = await Tour.find({
      "schedules": {
        $elemMatch: {
          guide: guideId,
          assignmentStatus: "pending"
        }
      }
    }).select("title duration difficulty images schedules");

    // Extract only the pending schedules
    const pendingAssignments = [];
    tours.forEach(tour => {
      tour.schedules.forEach(schedule => {
        if (schedule.guide.toString() === guideId.toString() && schedule.assignmentStatus === "pending") {
          pendingAssignments.push({
            tourId: tour._id,
            tourTitle: tour.title,
            scheduleId: schedule._id,
            startDate: schedule.startDate,
            endDate: schedule.endDate,
            remainingSlots: schedule.remainingSlots,
            requestedBy: schedule.requestedBy,
            linkedRequestId: schedule.linkedRequestId
          });
        }
      });
    });

    res.json({
      success: true,
      data: pendingAssignments
    });
  } catch (error) {
    next(error);
  }
};

const respondToAssignment = async (req, res, next) => {
  try {
    const { tourId, scheduleId, status } = req.body; // status can be "accepted" or "rejected"
    const guideId = req.user._id;

    if (!["accepted", "rejected"].includes(status)) {
      res.status(400);
      throw new Error("Invalid status");
    }

    const tour = await Tour.findById(tourId);
    if (!tour) {
      res.status(404);
      throw new Error("Tour not found");
    }

    const schedule = tour.schedules.id(scheduleId);
    if (!schedule) {
      res.status(404);
      throw new Error("Schedule not found");
    }

    if (schedule.guide.toString() !== guideId.toString()) {
      res.status(403);
      throw new Error("Not authorized to respond to this assignment");
    }

    schedule.assignmentStatus = status;
    await tour.save();

    // If accepted, notify traveler
    if (status === "accepted" && schedule.linkedRequestId) {
      const TourRequest = require("../models/TourRequest");
      const request = await TourRequest.findById(schedule.linkedRequestId).populate("user");
      
      if (request && request.user) {
        const { sendNotification } = require("../services/notificationService");
        const { sendEmail } = require("../utils/mailService");
        const { buildPremiumEmail } = require("../utils/emailTemplateBuilder");
        
        // 1. In-App Notification
        await sendNotification(request.user._id, {
          type: "booking",
          priority: "HIGH",
          message: `Your guide has accepted the schedule! Please complete your payment to confirm the booking.`,
        });

        // 2. Email Notification
        const checkoutLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/checkout/${tour._id}?scheduleId=${schedule._id}`;
        const emailHtml = buildPremiumEmail({
          type: "default",
          title: "Your Guide is Ready!",
          icon: "👨‍💼",
          accentColor: "#F59E0B",
          greeting: `Dear ${request.user.name},`,
          bodyLines: [
            "An expert guide has just accepted your private schedule.",
            "Please complete your payment to confirm your booking and secure the guide's time."
          ],
          infoCards: [
            { title: "Date", value: new Date(schedule.startDate).toLocaleDateString(), iconEmoji: "📅" }
          ],
          statusBadge: { text: "AWAITING PAYMENT", color: "#F59E0B" },
          cta: {
            text: "Pay Now",
            link: checkoutLink,
            color: "#F59E0B"
          }
        });

        await sendEmail({
          to: request.user.email,
          subject: "Guide Assigned - Complete Your Payment",
          html: emailHtml
        });
      }
    }

    res.json({
      success: true,
      message: `Assignment ${status}`,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGuideStats,
  getGuideProfile,
  updateGuideProfile,
  getPublicGuides,
  getPublicGuideProfile,
  uploadGuideDocument,
  submitForReview,
  resubmitApplication,
  getPendingAssignments,
  respondToAssignment,
  streamGuideDocument,
};
