const express = require("express");
const router = express.Router();
const { applyForGuideRole, getUserProfile, updateUserProfile, uploadProfileImage, deleteMyAccount } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { profileRateLimiter } = require("../middleware/rateLimiter");
const upload = require("../middleware/uploadMiddleware");

router.route("/profile")
  .get(protect, getUserProfile)
  .put(protect, profileRateLimiter, updateUserProfile);

router.post("/profile-image", protect, profileRateLimiter, upload.single("image"), uploadProfileImage);

router.post("/apply-guide", protect, applyForGuideRole);

router.delete("/account", protect, deleteMyAccount);

module.exports = router;
