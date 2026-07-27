const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/guideController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { profileRateLimiter } = require("../middleware/rateLimiter");
const upload = require("../middleware/uploadMiddleware");

// Public listing
router.get("/public", getPublicGuides);
// Public single guide profile
router.get("/public/:id", getPublicGuideProfile);



// All following routes are globally protected by Guide-specific RBAC
router.use(protect);
router.use(authorize("guide"));

router.get("/stats", getGuideStats);
router.route("/profile")
  .get(getGuideProfile)
  .put(profileRateLimiter, updateGuideProfile);

router.post("/upload-document", profileRateLimiter, upload.single("document"), uploadGuideDocument);
router.get("/documents", streamGuideDocument);
router.post("/submit-for-review", profileRateLimiter, submitForReview);
router.post("/resubmit", profileRateLimiter, resubmitApplication);

// Assignments
router.get("/assignments/pending", getPendingAssignments);
router.patch("/assignments/respond", respondToAssignment);

module.exports = router;
