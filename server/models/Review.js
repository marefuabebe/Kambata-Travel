const mongoose = require("mongoose");

/**
 * Review Model — tours, hotels, and guides (verified via completed bookings).
 */
const reviewSchema = mongoose.Schema(
  {
    reviewType: {
      type: String,
      enum: ["tour", "package", "hotel", "guide"],
      default: "tour",
      required: true,
      index: true,
    },
    tour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      index: true,
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      index: true,
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      index: true,
    },
    guide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, "Please add a rating between 1 and 5"],
      min: 1,
      max: 5,
    },
    detailedRatings: {
      overallExperience: { type: Number, min: 1, max: 5 },
      valueForMoney: { type: Number, min: 1, max: 5 },
      organization: { type: Number, min: 1, max: 5 },
      accommodation: { type: Number, min: 1, max: 5 },
      knowledge: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      professionalism: { type: Number, min: 1, max: 5 },
      friendliness: { type: Number, min: 1, max: 5 },
    },
    comment: {
      type: String,
      required: [true, "Please add a comment"],
      trim: true,
    },
    reply: {
      type: String,
      trim: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    isVerifiedBooking: {
      type: Boolean,
      default: false,
    },
    isHidden: {
      type: Boolean,
      default: false,
      index: true,
    },
    moderationNote: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index(
  { tour: 1, user: 1 },
  { unique: true, partialFilterExpression: { reviewType: "tour", tour: { $type: "objectId" } } }
);
reviewSchema.index(
  { package: 1, user: 1 },
  { unique: true, partialFilterExpression: { reviewType: "package", package: { $type: "objectId" } } }
);
reviewSchema.index(
  { hotel: 1, user: 1 },
  { unique: true, partialFilterExpression: { reviewType: "hotel", hotel: { $type: "objectId" } } }
);
reviewSchema.index(
  { guide: 1, user: 1, booking: 1 },
  { unique: true, partialFilterExpression: { reviewType: "guide", guide: { $type: "objectId" } } }
);

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId, isHidden: { $ne: true }, $or: [{ reviewType: "tour" }, { reviewType: { $exists: false } }] } },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model("Tour").findByIdAndUpdate(tourId, {
      "rating.numReviews": stats[0].nRating,
      "rating.average": Math.round(stats[0].avgRating * 10) / 10,
    });
  } else {
    await mongoose.model("Tour").findByIdAndUpdate(tourId, {
      "rating.numReviews": 0,
      "rating.average": 0,
    });
  }
};

reviewSchema.statics.calcAveragePackageRatings = async function (packageId) {
  const stats = await this.aggregate([
    { $match: { package: packageId, reviewType: "package", isHidden: { $ne: true } } },
    {
      $group: {
        _id: "$package",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model("Package").findByIdAndUpdate(packageId, {
      "rating.numReviews": stats[0].nRating,
      "rating.average": Math.round(stats[0].avgRating * 10) / 10,
    });
  } else {
    await mongoose.model("Package").findByIdAndUpdate(packageId, {
      "rating.numReviews": 0,
      "rating.average": 0,
    });
  }
};

reviewSchema.statics.calcAverageHotelRatings = async function (hotelId) {
  const stats = await this.aggregate([
    { $match: { hotel: hotelId, reviewType: "hotel", isHidden: { $ne: true } } },
    {
      $group: {
        _id: "$hotel",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model("Hotel").findByIdAndUpdate(hotelId, {
      "rating.numReviews": stats[0].nRating,
      "rating.average": Math.round(stats[0].avgRating * 10) / 10,
    });
  } else {
    await mongoose.model("Hotel").findByIdAndUpdate(hotelId, {
      "rating.numReviews": 0,
      "rating.average": 0,
    });
  }
};

reviewSchema.statics.calcGuideRatings = async function (guideId) {
  const stats = await this.aggregate([
    { $match: { guide: guideId, reviewType: "guide", isHidden: { $ne: true } } },
    {
      $group: {
        _id: "$guide",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model("User").findByIdAndUpdate(guideId, {
      "rating.numReviews": stats[0].nRating,
      "rating.average": Math.round(stats[0].avgRating * 10) / 10,
    });
  } else {
    await mongoose.model("User").findByIdAndUpdate(guideId, {
      "rating.numReviews": 0,
      "rating.average": 0,
    });
  }
};

reviewSchema.post("save", function () {
  if (this.reviewType === "tour" && this.tour) {
    this.constructor.calcAverageRatings(this.tour);
  }
  if (this.reviewType === "package" && this.package) {
    this.constructor.calcAveragePackageRatings(this.package);
  }
  if (this.reviewType === "hotel" && this.hotel) {
    this.constructor.calcAverageHotelRatings(this.hotel);
  }
  if (this.reviewType === "guide" && this.guide) {
    this.constructor.calcGuideRatings(this.guide);
  }
});

reviewSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;
  if (doc.reviewType === "tour" && doc.tour) {
    await doc.constructor.calcAverageRatings(doc.tour);
  }
  if (doc.reviewType === "package" && doc.package) {
    await doc.constructor.calcAveragePackageRatings(doc.package);
  }
  if (doc.reviewType === "hotel" && doc.hotel) {
    await doc.constructor.calcAverageHotelRatings(doc.hotel);
  }
  if (doc.reviewType === "guide" && doc.guide) {
    await doc.constructor.calcGuideRatings(doc.guide);
  }
});

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
