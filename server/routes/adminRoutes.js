const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/adminController");

const {
  createTourTemplate,
  updateTourTemplate,
  deleteTourTemplate,
  createDestination,
  updateDestination,
  deleteDestination,
  adminAddTourSchedule,
} = require("../controllers/tourManagementController");

const { issueRefund } = require("../controllers/paymentController");

const { requireAdmin } = require("../middleware/authMiddleware");
const { adminLogin } = require("../controllers/authController");

router.post("/auth/login", adminLogin);

// Webhook endpoint for external scheduler
router.post("/payouts/auto-clear-earnings", autoClearEarnings);

router.use(requireAdmin);

// Content studio — admin-owned supply
const { getTours, getAllGuidesWithConflictStatus, createSchedule, deleteScheduleAdmin, reassignGuideAdmin } = require("../controllers/tourController");
const { getDestinations } = require("../controllers/destinationController");

router.route("/tours").get(getTours).post(createTourTemplate);
router.route("/tours/guides/availability").post(getAllGuidesWithConflictStatus);
router.route("/tours/:id").put(updateTourTemplate).delete(deleteTourTemplate);
router.route("/tours/:id/schedules").post(createSchedule);
router.route("/tours/:tourId/schedules/:scheduleId").delete(deleteScheduleAdmin).patch(reassignGuideAdmin);
router.route("/destinations").get(getDestinations).post(createDestination);
router.route("/destinations/:id").put(updateDestination).delete(deleteDestination);
const { getNotifications, markAsRead, markAllAsRead } = require("../controllers/notificationController");

router.get("/notifications", getNotifications);
router.put("/notifications/read-all", markAllAsRead);
router.put("/notifications/:id/read", markAsRead);

const {
  getOverviewAnalytics,
  getRevenueAnalytics,
  getBookingAnalytics,
  getPerformanceAnalytics,
  getQRAnalytics,
  getRequestFunnelAnalytics,
} = require("../controllers/analyticsController");

router.get("/analytics", getAnalytics);
router.get("/analytics/overview", getOverviewAnalytics);
router.get("/analytics/revenue", getRevenueAnalytics);
router.get("/analytics/bookings", getBookingAnalytics);
router.get("/analytics/performance", getPerformanceAnalytics);
router.get("/analytics/qr-attendance", getQRAnalytics);
router.get("/analytics/request-funnel", getRequestFunnelAnalytics);

router.get("/users", getAllUsers);
router.put("/users/:id", manageUserStatus);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/reset-password", resetUserPasswordAdmin);
router.patch("/users/:id/scheduling-privilege", revokeSchedulingPrivilege);

router.get("/guides", getAllGuides);
router.get("/guides/applications", getGuideApplications);
router.get("/guides/:id", getGuideDetails);
router.get("/guides/:id/calendar", getGuideCalendarAdmin);
router.post("/guides/:id/approve", approveGuide);
router.post("/guides/:id/reject", rejectGuide);
router.post("/guides/:id/request-documents", requestGuideDocuments);
router.patch("/guides/:id/verify", verifyGuide);

router.get("/bookings", getAllBookings);
router.get("/packages", getAllPackageBookings);
router.patch("/bookings/:id/cancel", cancelBookingAdmin);
router.patch("/bookings/:id/payment-override", overridePaymentStatus);
router.patch("/bookings/:id/resolve-dispute", resolveDispute);

router.post("/manual-booking", recordManualTransaction);

router.get("/accounting", getAccountingReports);
router.get("/accounting/export", exportAccountingCSV);

router.get("/payouts", getPayoutRequests);
router.patch("/payouts/:id", processPayout);

router.get("/transactions", getAllTransactions);

router.get("/audit-logs", getAuditLogs);
router.get("/attendance", getAttendanceSchedules);
router.get("/incidents", getIncidentReports);
const { getAllRequests, updateRequestStatus, convertRequestToSchedule, getRankedGuidesForRequest, assignGuide, adjustRequestPrice, getSuggestedGuides, getRequestTimeline } = require("../controllers/requestController");
router.get("/requests", getAllRequests);
router.patch("/requests/:id/status", updateRequestStatus);
router.post("/requests/:id/convert", convertRequestToSchedule);
router.get("/requests/:id/ranked-guides", getRankedGuidesForRequest);
router.get("/requests/:id/suggested-guides", getSuggestedGuides);
router.post("/requests/:id/assign-guide", assignGuide);
router.patch("/requests/:id/price", adjustRequestPrice);
router.get("/requests/:id/timeline", getRequestTimeline);
router.get("/reviews/all", getAllReviewsAdmin);
router.patch("/reviews/:id/moderate", moderateReview);
router.delete("/reviews/:id", deleteReviewAdmin);

router.post("/announcements", sendGlobalAnnouncement);

const { getAllTickets, respondToTicket } = require("../controllers/supportController");
router.get("/support", getAllTickets);
router.patch("/support/:id/respond", respondToTicket);

router.post("/payments/refund/:tx_ref", issueRefund);

module.exports = router;
