const mongoose = require("mongoose");
const Wallet = require("../models/Wallet");
const logger = require("../utils/logger");
const AuditLog = require("../models/AuditLog");

/**
 * Calculates the platform commission and guide share based on configurable percentage.
 * Default is 70% Platform, 30% Guide.
 */
const getRevenueSplit = (amount) => {
  const platformPercent = process.env.PLATFORM_COMMISSION_PERCENTAGE 
    ? parseFloat(process.env.PLATFORM_COMMISSION_PERCENTAGE) 
    : 0.70;
  
  const platformFee = amount * platformPercent;
  const guideShare = amount * (1 - platformPercent);
  
  return { platformFee, guideShare };
};

/**
 * Stages earnings in the guide's wallet as pending after tour completion.
 *
 * @param {string} guideId - The ID of the guide
 * @param {number} amount - The total booking price (in ETB)
 * @param {object} session - Optional MongoDB session for transactions
 * @returns {Promise<{success: boolean, guideShare: number, platformFee: number}>}
 */
const stageGuideEarnings = async (guideId, amount, session = null) => {
  try {
    const { platformFee, guideShare } = getRevenueSplit(amount);

    // Atomic upsert with transactions
    const wallet = await Wallet.findOneAndUpdate(
      { guide: guideId },
      { 
        $inc: { pendingEarnings: guideShare },
        $setOnInsert: { guide: guideId }
      },
      { upsert: true, new: true, session }
    );

    logger.info(
      `Earnings staged: ${guideShare} ETB as pending for guide ${guideId}. Platform fee: ${platformFee} ETB.`
    );
    return { success: true, guideShare, platformFee, wallet };
  } catch (error) {
    logger.error("Error in stageGuideEarnings:", error);
    throw error;
  }
};

/**
 * Clears staged guide earnings for a specific booking, moving from pendingEarnings to balance.
 *
 * @param {string} bookingId - Booking._id
 * @returns {Promise<{success: boolean, alreadyCleared?: boolean}>}
 */
const clearGuideEarnings = async (bookingId) => {
  const Booking = require("../models/Booking");
  
  let useTransaction = false;
  let session = null;
  try {
    const topologyType = mongoose.connection.client?.topology?.s?.description?.type;
    // Only use transactions if we are definitely on a Replica Set or Sharded Cluster
    if (topologyType && topologyType !== "Single" && topologyType !== "Unknown") {
      session = await mongoose.startSession();
      session.startTransaction();
      useTransaction = true;
    } else {
      logger.warn(`Transactions not supported on topology type: ${topologyType}, proceeding without transaction session.`);
    }
  } catch (e) {
    logger.warn("Error starting transaction, proceeding without transaction session.", e);
  }

  try {
    const sessionOpt = useTransaction ? { session } : {};
    const booking = await Booking.findById(bookingId).populate("guide");
    if (!booking) throw new Error(`Booking ${bookingId} not found`);

    if (booking.payoutStatus === "cleared" || booking.payoutStatus === "paid_out") {
      if (useTransaction) {
        await session.abortTransaction();
        session.endSession();
      }
      logger.info(`Earnings already cleared for booking ${bookingId}, skipping.`);
      return { success: true, alreadyCleared: true };
    }

    if (booking.payoutStatus !== "pending_clearance") {
      throw new Error(`Cannot clear earnings for booking ${bookingId} with status ${booking.payoutStatus}`);
    }

    const guideId = booking.guide?._id || booking.guide;
    if (!guideId) throw new Error(`Booking ${bookingId} has no assigned guide`);

    const guideEarnings = booking.guideEarnings;

    // 1. Update wallet
    await Wallet.findOneAndUpdate(
      { guide: guideId },
      { 
        $inc: { 
          pendingEarnings: -guideEarnings,
          balance: guideEarnings,
          totalEarned: guideEarnings
        }
      },
      sessionOpt
    );

    // 2. Update booking
    booking.payoutStatus = "cleared";
    booking.earningsReleased = true; // legacy field update just in case
    await booking.save(sessionOpt);

    // 3. Create Audit Log
    await AuditLog.create([{
      action: "EARNINGS_CLEARED",
      targetType: "Booking",
      targetId: booking._id,
      actor: guideId, // System acting on behalf of guide
      metadata: {
        amount: booking.totalPrice,
        guideShare: guideEarnings,
        platformFee: booking.platformFee
      }
    }], sessionOpt);

    if (useTransaction) {
      await session.commitTransaction();
      session.endSession();
    }

    logger.info(`Earnings cleared for booking ${bookingId} -> guide ${guideId}`);
    return { success: true, guideShare: guideEarnings };
  } catch (error) {
    if (useTransaction) {
      await session.abortTransaction();
      session.endSession();
    }
    logger.error("Error in clearGuideEarnings:", error);
    throw error;
  }
};

module.exports = {
  stageGuideEarnings,
  clearGuideEarnings,
  getRevenueSplit
};
