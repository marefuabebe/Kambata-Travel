const express = require("express");
const router = express.Router();
const {
  addReview,
  addReviewReply,
  getTourReviews,
  getHotelReviews,
  getGuideReviews,
  getMyReviews,
  getAllReviewsAdmin,
  moderateReview
} = require("../controllers/reviewController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.route("/").post(protect, addReview);
router.route("/admin").get(protect, authorize("admin"), getAllReviewsAdmin);
router.route("/:id/moderate").patch(protect, authorize("admin"), moderateReview);

router.get("/guide/my-reviews", protect, authorize("guide"), getGuideReviews);
router.get("/my-reviews", protect, getMyReviews);
router.get("/hotel/:hotelId", getHotelReviews);
router.get("/tour/:tourId", getTourReviews);

// Legacy: GET /api/reviews/:tourId still works for tour reviews
router.get("/:tourId", getTourReviews);

router.route("/:id/reply").put(protect, authorize("guide"), addReviewReply);

module.exports = router;
