const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Tour = require("../models/Tour");

// @desc    Add a review (tour or guide)
// @route   POST /api/reviews
// @access  Private (User)
const addReview = async (req, res, next) => {
  try {
    const {
      reviewType = "tour",
      tourId,
      packageId,
      guideId,
      rating,
      detailedRatings,
      comment,
      bookingId,
    } = req.body;

    const PackageBooking = require("../models/PackageBooking");

    if (reviewType === "tour") {
      const bookingQuery = {
        user: req.user._id,
        tour: tourId,
        status: "completed",
        attendanceStatus: { $in: ["present", "late"] }
      };
      if (bookingId) bookingQuery._id = bookingId;

      const booking = await Booking.findOne(bookingQuery);
      if (!booking) {
        res.status(400);
        throw new Error("You can only review tours you have completed and attended");
      }

      const existingReview = await Review.findOne({
        reviewType: "tour",
        tour: tourId,
        user: req.user._id,
      });
      if (existingReview) {
        res.status(400);
        throw new Error("You have already reviewed this tour");
      }

      const review = await Review.create({
        reviewType: "tour",
        tour: tourId,
        user: req.user._id,
        booking: booking._id,
        rating,
        detailedRatings,
        comment,
        isVerifiedBooking: true,
      });

      booking.isReviewed = true;
      await booking.save();
      return res.status(201).json({ success: true, data: review });
    }

    if (reviewType === "package") {
      const bookingQuery = {
        user: req.user._id,
        packageId: packageId,
        bookingStatus: "completed",
        attendanceStatus: { $in: ["present", "late"] }
      };
      if (bookingId) bookingQuery._id = bookingId;

      const booking = await PackageBooking.findOne(bookingQuery);
      if (!booking) {
        res.status(400);
        throw new Error("You can only review packages you have completed and attended");
      }

      const existingReview = await Review.findOne({
        reviewType: "package",
        package: packageId,
        user: req.user._id,
      });
      if (existingReview) {
        res.status(400);
        throw new Error("You have already reviewed this package");
      }

      const review = await Review.create({
        reviewType: "package",
        package: packageId,
        user: req.user._id,
        rating,
        detailedRatings,
        comment,
        isVerifiedBooking: true,
      });

      booking.isReviewed = true;
      await booking.save();
      return res.status(201).json({ success: true, data: review });
    }

    if (reviewType === "guide") {
      // Find either a standalone tour booking or package booking
      const tourBookingQuery = {
        user: req.user._id,
        status: "completed",
        attendanceStatus: { $in: ["present", "late"] }
      };
      if (bookingId) tourBookingQuery._id = bookingId;
      if (tourId) tourBookingQuery.tour = tourId;

      let validGuideId = null;
      let associatedBookingId = null;
      let associatedTourId = tourId;

      const booking = await Booking.findOne(tourBookingQuery).populate("scheduleId");
      if (booking) {
        validGuideId = booking.guide || booking.scheduleId?.guide;
        associatedBookingId = booking._id;
      } else if (!booking && packageId) {
        // Not a direct tour booking, maybe a package booking
        const pkgBookingQuery = {
          user: req.user._id,
          packageId: packageId,
          bookingStatus: "completed",
          attendanceStatus: { $in: ["present", "late"] }
        };
        const pkgBooking = await PackageBooking.findOne(pkgBookingQuery).populate("packageScheduleId");
        if (pkgBooking && pkgBooking.packageScheduleId && pkgBooking.packageScheduleId.guide) {
           validGuideId = pkgBooking.packageScheduleId.guide;
           associatedBookingId = pkgBooking._id;
        }
      }

      if (!validGuideId) {
        res.status(400);
        throw new Error("You can only review guides from completed tours you attended");
      }

      const targetGuideId = guideId || validGuideId;
      if (targetGuideId.toString() !== validGuideId.toString()) {
        res.status(400);
        throw new Error("Guide does not match this booking");
      }

      const existingReview = await Review.findOne({
        reviewType: "guide",
        guide: targetGuideId,
        user: req.user._id,
        booking: associatedBookingId,
      });
      if (existingReview) {
        res.status(400);
        throw new Error("You have already reviewed this guide for this trip");
      }

      const review = await Review.create({
        reviewType: "guide",
        tour: associatedTourId,
        package: packageId,
        guide: targetGuideId,
        user: req.user._id,
        booking: associatedBookingId,
        rating,
        detailedRatings,
        comment,
        isVerifiedBooking: true,
      });

      return res.status(201).json({ success: true, data: review });
    }

    res.status(400);
    throw new Error("Invalid review type");
  } catch (error) {
    next(error);
  }
};

// @desc    Add a reply to a review (Guide Only)
// @route   PUT /api/reviews/:id/reply
// @access  Private (Guide)
const addReviewReply = async (req, res, next) => {
  try {
    const { reply } = req.body;
    const review = await Review.findById(req.params.id).populate("tour");

    if (!review) {
      res.status(404);
      throw new Error("Review not found");
    }

    const tour = await Tour.findById(review.tour?._id || review.tour);
    const isTourCreator = tour?.createdBy?.toString() === req.user._id.toString();
    const hostsTour = tour?.schedules?.some(
      (s) => s.guide?.toString() === req.user._id.toString()
    );
    const isGuideSubject =
      review.reviewType === "guide" && review.guide?.toString() === req.user._id.toString();

    if (!isTourCreator && !hostsTour && !isGuideSubject) {
      res.status(401);
      throw new Error("Only the assigned guide can reply to this review");
    }

    if (review.reply) {
      res.status(400);
      throw new Error("You have already replied to this review");
    }

    review.reply = reply;
    await review.save();

    res.json({ message: "Reply added", review });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a tour
// @route   GET /api/reviews/tour/:tourId
// @access  Public
const getTourReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      tour: req.params.tourId,
      isHidden: { $ne: true },
      $or: [{ reviewType: "tour" }, { reviewType: { $exists: false } }],
    })
      .populate("user", "name profilePicture")
      .sort("-createdAt");

    res.json({ count: reviews.length, reviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a hotel
// @route   GET /api/reviews/hotel/:hotelId
// @access  Public
const getHotelReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      hotel: req.params.hotelId,
      reviewType: "hotel",
      isHidden: { $ne: true },
    })
      .populate("user", "name profilePicture")
      .sort("-createdAt");

    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews strictly belonging to the logged-in Guide's tours
// @route   GET /api/reviews/guide/my-reviews
// @access  Private (Guide)
const getGuideReviews = async (req, res, next) => {
  try {
    const guideId = req.user._id;

    const tours = await Tour.find({ "schedules.guide": guideId }).select("_id");
    const tourIds = tours.map((t) => t._id);

    const reviews = await Review.find({
      $or: [{ tour: { $in: tourIds }, reviewType: "tour" }, { guide: guideId, reviewType: "guide" }],
    })
      .populate("user", "name profilePicture")
      .populate("tour", "title images")
      .populate("hotel", "name images")
      .sort("-createdAt");

    res.json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate("tour", "title images")
      .populate("package", "name images")
      .populate("hotel", "name images location")
      .populate("guide", "name profilePicture")
      .sort("-createdAt");
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews (Admin)
// @route   GET /api/reviews/admin
// @access  Private (Admin)
const getAllReviewsAdmin = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate("user", "name email")
      .populate("tour", "title")
      .populate("package", "name")
      .populate("guide", "name email")
      .sort("-createdAt");
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

// @desc    Update review visibility/moderation (Admin)
// @route   PATCH /api/reviews/:id/moderate
// @access  Private (Admin)
const moderateReview = async (req, res, next) => {
  try {
    const { isHidden, moderationNote } = req.body;
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      res.status(404);
      throw new Error("Review not found");
    }

    if (isHidden !== undefined) review.isHidden = isHidden;
    if (moderationNote !== undefined) review.moderationNote = moderationNote;
    
    await review.save(); // Will trigger re-calculation of average ratings
    
    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addReview,
  addReviewReply,
  getTourReviews,
  getHotelReviews,
  getGuideReviews,
  getMyReviews,
  getAllReviewsAdmin,
  moderateReview
};
