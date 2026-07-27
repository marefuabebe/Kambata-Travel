const mongoose = require("mongoose");
const Wallet = require("../models/Wallet");
const PayoutRequest = require("../models/PayoutRequest");
const AuditLog = require("../models/AuditLog");
const logger = require("../utils/logger");

// @desc    Get guide's wallet info
// @route   GET /api/wallets/me
// @access  Private (Guide)
const getMyWallet = async (req, res, next) => {
  try {
    // Atomic Upsert
    const wallet = await Wallet.findOneAndUpdate(
      { guide: req.user._id },
      { $setOnInsert: { guide: req.user._id } },
      { upsert: true, new: true }
    );

    const history = await PayoutRequest.find({ guide: req.user._id }).sort("-createdAt");

    res.json({
      success: true,
      wallet,
      history
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request a payout
// @route   POST /api/wallets/payout
// @access  Private (Guide)
const requestPayout = async (req, res, next) => {
  const IncidentReport = require("../models/IncidentReport");

  let useTransaction = false;
  let session = null;
  try {
    const topologyType = mongoose.connection.client?.topology?.s?.description?.type;
    if (topologyType && topologyType !== "Single" && topologyType !== "Unknown") {
      session = await mongoose.startSession();
      session.startTransaction();
      useTransaction = true;
    } else {
      logger.warn(`Transactions not supported on topology type: ${topologyType}, proceeding without transaction session in walletController.`);
    }
  } catch (e) {
    logger.warn("Error starting transaction, proceeding without transaction session.", e);
  }

  try {
    const { amount, bankName, accountNumber, accountHolder, telebirr } = req.body;
    
    // Strict validations
    if (amount < 500) {
      res.status(400);
      throw new Error("Minimum withdrawal amount is 500 ETB");
    }

    if (!req.user.isEmailVerified) {
      res.status(403);
      throw new Error("Your account must be verified to request payouts");
    }

    if (req.user.guideStatus !== "approved") {
      res.status(403);
      throw new Error("Your guide profile must be approved to request payouts");
    }

    // Check for existing pending/approved requests
    const existingRequest = await PayoutRequest.findOne({
      guide: req.user._id,
      status: { $in: ["pending", "approved"] }
    });

    if (existingRequest) {
      res.status(400);
      throw new Error("You already have a pending or approved payout request. Please wait for it to be processed.");
    }

    // Check for active disputes
    const activeDisputes = await IncidentReport.countDocuments({
      guide: req.user._id,
      status: { $in: ["open", "under_review"] }
    });

    if (activeDisputes > 0) {
      res.status(403);
      throw new Error("You have active incident reports. Payouts are paused until they are resolved.");
    }

    const sessionOpt = useTransaction ? { session } : {};

    // 1. Atomic Check and Deduction
    const wallet = await Wallet.findOneAndUpdate(
      { guide: req.user._id, balance: { $gte: amount } },
      { $inc: { balance: -amount, pendingPayout: amount } },
      { new: true, ...sessionOpt }
    );

    if (!wallet) {
      if (useTransaction) {
        await session.abortTransaction();
        session.endSession();
      }
      res.status(400);
      throw new Error("Insufficient balance or wallet not found for this payout request");
    }

    // 2. Create Request
    const payout = new PayoutRequest({
      guide: req.user._id,
      amount,
      bankInfo: {
        bankName,
        accountNumber,
        accountHolder,
        telebirr
      }
    });
    // save() does not take an object like `{ session }` in the same way if session is not passed. 
    // actually it takes `options`. 
    await payout.save(sessionOpt);

    // 3. Create Audit Log
    await AuditLog.create([{
      action: "WITHDRAWAL_REQUEST_CREATED",
      targetType: "PayoutRequest",
      targetId: payout._id,
      actor: req.user._id,
      metadata: { amount, bankName, accountNumber }
    }], sessionOpt);

    if (useTransaction) {
      await session.commitTransaction();
      session.endSession();
    }

    res.status(201).json({
      success: true,
      message: "Payout request submitted for approval",
      payout
    });
  } catch (error) {
    if (useTransaction) {
      await session.abortTransaction();
      session.endSession();
    }
    next(error);
  }
};

// @desc    Cancel a pending payout request
// @route   PATCH /api/wallets/payout/:id/cancel
// @access  Private (Guide)
const cancelPayoutRequest = async (req, res, next) => {
  let useTransaction = false;
  let session = null;
  try {
    const topologyType = mongoose.connection.client?.topology?.s?.description?.type;
    if (topologyType && topologyType !== "Single" && topologyType !== "Unknown") {
      session = await mongoose.startSession();
      session.startTransaction();
      useTransaction = true;
    }
  } catch (e) {
    logger.warn("Error starting transaction for cancelPayoutRequest, proceeding without transaction session in cancelPayoutRequest.");
  }

  try {
    const sessionOpt = useTransaction ? { session } : {};

    // Find the request that belongs to the user and is still 'pending'
    const payout = await PayoutRequest.findOneAndUpdate(
      { _id: req.params.id, guide: req.user._id, status: "pending" },
      { status: "cancelled", processedAt: Date.now() },
      { new: true, ...sessionOpt }
    );

    if (!payout) {
      if (useTransaction) {
        await session.abortTransaction();
        session.endSession();
      }
      res.status(404);
      throw new Error("Pending payout request not found");
    }

    // Refund the wallet
    const wallet = await Wallet.findOneAndUpdate(
      { guide: req.user._id },
      { $inc: { balance: payout.amount, pendingPayout: -payout.amount } },
      { new: true, ...sessionOpt }
    );

    // Create Audit Log
    const AuditLog = require("../models/AuditLog");
    await AuditLog.create([{
      action: "WITHDRAWAL_CANCELLED",
      targetType: "PayoutRequest",
      targetId: payout._id,
      actor: req.user._id,
      metadata: { amount: payout.amount }
    }], sessionOpt);

    if (useTransaction) {
      await session.commitTransaction();
      session.endSession();
    }

    res.json({ success: true, payout, wallet });
  } catch (error) {
    if (useTransaction) {
      await session.abortTransaction();
      session.endSession();
    }
    next(error);
  }
};

module.exports = {
  getMyWallet,
  requestPayout,
  cancelPayoutRequest,
};
