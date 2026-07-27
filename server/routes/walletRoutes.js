const express = require("express");
const router = express.Router();
const { getMyWallet, requestPayout, cancelPayoutRequest } = require("../controllers/walletController");
const { requireVerifiedGuide } = require("../middleware/authMiddleware");

router.use(requireVerifiedGuide);

router.get("/me", getMyWallet);
router.post("/payout", requestPayout);
router.patch("/payout/:id/cancel", cancelPayoutRequest);

module.exports = router;
