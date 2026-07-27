const express = require("express");
const router = express.Router();
const {
  initiatePayment,
  initiatePackagePayment,
  handleWebhook,
  verifyPaymentStatus,
  issueRefund,
  downloadInvoice,
  getMyTransactions
} = require("../controllers/paymentController");
const { protect, requireEmailVerified, requireAdmin } = require("../middleware/authMiddleware");

router.get("/my-transactions", protect, getMyTransactions);
router.post("/initiate/:bookingId", protect, requireEmailVerified, initiatePayment);
router.post("/initiate-package/:bookingId", protect, requireEmailVerified, initiatePackagePayment);
router.get("/verify/:tx_ref", protect, requireEmailVerified, verifyPaymentStatus);
router.post("/refund/:tx_ref", protect, requireAdmin, issueRefund);
router.get("/invoice/:tx_ref", protect, downloadInvoice);

// Webhook for Chapa (Public - signature verified in controller)
router.post("/webhook", handleWebhook);

module.exports = router;
