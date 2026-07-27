/**
 * paymentController.js
 *
 * ENTERPRISE WEBHOOK ARCHITECTURE
 *
 * handleWebhook() execution order:
 *  1. Verify Chapa signature                          → 401 if invalid
 *  2. Load Transaction by tx_ref                     → 404 if missing
 *  3. Global idempotency guard                        → 200 if already "success"
 *  4. Load Booking / PackageBooking                   → warn if not found
 *  5. Booking-level idempotency guard                 → 200 if already paid/confirmed
 *  6. MongoDB session — atomic business-critical state
 *     ├─ transaction status update
 *     ├─ booking status/paymentStatus
 *     ├─ confirmPaidBookingCore() [slots, chat, guide]
 *     ├─ transaction.save({ session })
 *     └─ commitTransaction()
 *  7. Post-commit processing via Promise.allSettled()
 *     ├─ invoice PDF + email
 *     ├─ traveler + guide notifications
 *     ├─ recommendation engine
 *     └─ audit log
 *
 * Golden Rule:
 *   Webhook is the source of truth.
 *   Verify endpoint is UI-sync only — never primary confirmation.
 *   Post-commit failures NEVER rollback payment.
 */

"use strict";

const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const PackageBooking = require("../models/PackageBooking");
const Transaction = require("../models/Transaction");
const { initializePayment, verifyTransaction } = require("../services/paymentService");
const { updateRemainingSlots, promoteNextInWaitlist } = require("../services/bookingService");
const {
  confirmPaidBookingCore,
  runBookingPostProcessing,
  confirmPaidBooking,
} = require("../services/bookingConfirmService");
const { sendNotification } = require("../services/notificationService");
const { recordAction } = require("../services/auditService");
const { generateInvoicePdf } = require("../services/invoicePdfService");
const { sendEmail } = require("../utils/mailService");
const { buildPremiumEmail } = require("../utils/emailTemplateBuilder");
const logger = require("../utils/logger");

// ─────────────────────────────────────────────────────────────────────────────
// Helper — resolve booking document from tx_ref
// Detects PackageBooking by "PKG" in the tx_ref prefix, falls back to Booking.
// ─────────────────────────────────────────────────────────────────────────────
const resolveBooking = async (tx_ref) => {
  if (tx_ref.includes("-PKG-")) {
    const pkgBooking = await PackageBooking.findOne({ tx_ref });
    if (pkgBooking) return { booking: pkgBooking, isPackage: true };
  }

  const tourBooking = await Booking.findOne({
    tx_ref,
    packageBookingId: { $exists: false },
  });
  if (tourBooking) return { booking: tourBooking, isPackage: false };

  // Last-resort: check PackageBooking even without PKG prefix
  const pkgFallback = await PackageBooking.findOne({ tx_ref });
  if (pkgFallback) return { booking: pkgFallback, isPackage: true };

  return { booking: null, isPackage: false };
};

// ─────────────────────────────────────────────────────────────────────────────
// initiatePayment
// ─────────────────────────────────────────────────────────────────────────────
const initiatePayment = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking || booking.user.toString() !== req.user._id.toString()) {
      res.status(404);
      throw new Error("Booking not found");
    }

    if (booking.paymentStatus === "paid") {
      res.status(400);
      throw new Error("Booking is already paid");
    }

    // Re-use existing tx_ref if booking already has one (retry-safe)
    const tx_ref = booking.tx_ref || `KT-${Date.now()}-${booking._id}`;

    // Idempotent transaction record upsert
    let transaction = await Transaction.findOne({ tx_ref });
    if (!transaction) {
      transaction = await Transaction.create({
        booking: booking._id,
        user: req.user._id,
        amount: booking.totalPrice,
        tx_ref,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
    }

    if (!booking.tx_ref) booking.tx_ref = tx_ref;
    if (!booking.paymentExpiresAt) {
      booking.paymentExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    }
    await booking.save();

    const paymentData = await initializePayment(booking, req.user);

    recordAction(req, "PAYMENT_INITIATED", "Transaction", transaction._id, {
      amount: booking.totalPrice,
      tx_ref,
    });

    res.json(paymentData);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// handleWebhook — ENTERPRISE GRADE
// ─────────────────────────────────────────────────────────────────────────────
const handleWebhook = async (req, res) => {
  // ── STEP 1: Verify Chapa Signature ───────────────────────────────────────
  const hash = req.headers["x-chapa-signature"] || req.headers["chapa-signature"];
  const secretHash = process.env.CHAPA_WEBHOOK_HASH;

  if (hash !== secretHash) {
    logger.warn("Webhook: Unauthorized attempt — signature mismatch.");
    return res.status(401).json({ message: "Invalid signature" });
  }

  const { tx_ref, status, transaction_id, method } = req.body;

  if (!tx_ref || !status) {
    logger.warn("Webhook: Missing tx_ref or status in payload.");
    return res.status(400).json({ message: "Invalid webhook payload" });
  }

  logger.info(`Webhook received: tx_ref=${tx_ref} status=${status}`);

  // ── STEP 2: Load Transaction ──────────────────────────────────────────────
  const transaction = await Transaction.findOne({ tx_ref });
  if (!transaction) {
    logger.warn(`Webhook: No Transaction record for tx_ref=${tx_ref}`);
    // Return 200 so Chapa stops retrying for a tx_ref we have no record of.
    // This can happen if initializePayment succeeded but Transaction.create failed.
    return res.status(200).json({ received: true, message: "Transaction not found — acknowledged" });
  }

  // ── STEP 3: Global Idempotency Guard ─────────────────────────────────────
  // If the transaction is already in the terminal "success" state, this webhook
  // is a duplicate. Return 200 immediately — do NOT re-run any business logic.
  if (transaction.status === "success" && status === "success") {
    logger.info(`Webhook: Idempotency — tx_ref=${tx_ref} already fully processed.`);
    return res.status(200).json({ received: true, message: "Already processed" });
  }

  // ── STEP 4: Load Booking ──────────────────────────────────────────────────
  const { booking, isPackage } = await resolveBooking(tx_ref);

  if (!booking) {
    logger.warn(`Webhook: No booking found for tx_ref=${tx_ref}. Transaction record exists.`);
    // Still process transaction status update, but skip booking logic.
  }

  // ── STEP 5: Booking-Level Idempotency Guard ───────────────────────────────
  // If the booking is already in a paid/confirmed terminal state, the webhook
  // has already been applied (possibly by the verify endpoint). Return 200.
  if (
    status === "success" &&
    booking &&
    (booking.paymentStatus === "paid" || booking.status === "confirmed")
  ) {
    logger.info(`Webhook: Booking ${booking._id} already confirmed — idempotency guard.`);
    // Ensure the transaction record is also marked success if somehow out of sync
    if (transaction.status !== "success") {
      transaction.status = "success";
      transaction.providerTransactionId = transaction_id;
      transaction.paymentMethod = method || "chapa";
      transaction.rawPayload = req.body;
      await transaction.save();
    }
    return res.status(200).json({ received: true, message: "Already confirmed" });
  }

  // ── STEP 6: MongoDB Session — Atomic Business-Critical State ─────────────
  // CRITICAL BOUNDARY:
  //   ✓ INSIDE session: all DB mutations that affect business integrity
  //   ✗ OUTSIDE session: email, PDF, notifications, analytics, audit
  //
  // post-commit data collected here and used in Step 7.
  let postCommitPayload = null;

  const topologyType = mongoose.connection.client?.topology?.s?.description?.type;
  const useTransaction = topologyType && topologyType !== "Single" && topologyType !== "Unknown";
  const session = useTransaction ? await mongoose.startSession() : undefined;

  try {
    const action = async () => {
      // Attach payment metadata to transaction
      transaction.rawPayload = req.body;
      transaction.providerTransactionId = transaction_id;
      transaction.paymentMethod = method || "chapa";

      // ── SUCCESS flow ───────────────────────────────────────────────────
      if (status === "success") {
        transaction.status = "success";

        if (booking) {
          booking.transactionId = transaction_id;
          booking.paymentMethod = method || "chapa";

          // confirmPaidBookingCore handles:
          //   - paymentStatus → "paid"
          //   - status → "confirmed"
          //   - slot decrement (idempotent via slotsReserved flag)
          //   - chat room creation (idempotent)
          //   - guide assignment
          //   - booking.save({ session })
          //   - Tour.bookingsCount increment
          const { committed, tourDoc, scheduleDoc } = await confirmPaidBookingCore(booking, session);

          postCommitPayload = {
            booking,
            isPackage,
            tourDoc,
            scheduleDoc,
            committed,
            tx_ref,
            transaction_id,
            transactionDbId: transaction._id,
          };
        }

        await transaction.save({ session });
        return;
      }

      // ── FAILED flow ────────────────────────────────────────────────────
      if (status === "failed") {
        transaction.status = "failed";

        if (booking) {
          // Guard: never cancel an already-confirmed booking via a "failed" event
          if (booking.status === "cancelled" || booking.paymentStatus === "paid") {
            logger.warn(`Webhook: FAILED event for already-paid booking ${booking._id} — skipping.`);
          } else {
            if (booking.slotsReserved) {
              await updateRemainingSlots(booking.tour, booking.scheduleId, booking.numPeople);
              booking.slotsReserved = false;
            }
            booking.status = "cancelled";
            booking.paymentStatus = "failed";
            booking.paymentExpiresAt = undefined;
            await booking.save({ session });

            // Queue post-commit: promote waitlist + notify traveler
            postCommitPayload = {
              booking,
              isPackage,
              tourDoc: null,
              scheduleDoc: null,
              committed: false,
              tx_ref,
              transaction_id,
              transactionDbId: transaction._id,
              isFailed: true,
            };
          }
        }

        await transaction.save({ session });
        return;
      }

      // ── REFUNDED flow ──────────────────────────────────────────────────
      if (status === "refunded") {
        transaction.status = "refunded";

        if (booking) {
          if (booking.paymentStatus === "refunded") {
            logger.info(`Webhook: Booking ${booking._id} already refunded — idempotency.`);
          } else {
            booking.paymentStatus = "refunded";
            booking.status = "cancelled";
            if (booking.slotsReserved) {
              await updateRemainingSlots(booking.tour, booking.scheduleId, booking.numPeople);
              booking.slotsReserved = false;
            }
            await booking.save({ session });

            postCommitPayload = {
              booking,
              isPackage,
              tourDoc: null,
              scheduleDoc: null,
              committed: false,
              tx_ref,
              transaction_id,
              transactionDbId: transaction._id,
              isRefunded: true,
            };
          }
        }

        await transaction.save({ session });
        return;
      }

      // ── Unrecognized status ────────────────────────────────────────────
      logger.warn(`Webhook: Unrecognized status="${status}" for tx_ref=${tx_ref}`);
      // Still save the raw payload for debugging
      await transaction.save({ session });
    };

    if (useTransaction) {
      await session.withTransaction(action);
    } else {
      await action();
    }

    logger.info(`Webhook: Session committed for tx_ref=${tx_ref} status=${status}`);

  } catch (sessionError) {
    // session.withTransaction() handles abort automatically on throw.
    logger.error(
      `Webhook: Session aborted for tx_ref=${tx_ref} — ${sessionError.message}`,
      sessionError
    );
    return res.status(500).json({ message: "Webhook processing failed" });
  } finally {
    if (session) session.endSession();
  }

  // ── STEP 7: Post-Commit Processing ───────────────────────────────────────
  // The session is committed. Business state is durable.
  // Now run all non-critical side effects in parallel.
  // CRITICAL RULE: Failures here must NEVER affect HTTP response or rollback.

  if (postCommitPayload) {
    const {
      booking: b,
      tourDoc,
      scheduleDoc,
      committed,
      isFailed,
      isRefunded,
      transactionDbId,
    } = postCommitPayload;

    const mockReq = {
      user: { _id: transaction.user },
      ip: transaction.ipAddress,
      headers: { "user-agent": transaction.userAgent || "" },
    };

    if (status === "success" && committed) {
      // Run all success side effects — isolated failures via Promise.allSettled
      await runBookingPostProcessing(b, {
        tourDoc,
        scheduleDoc,
        isPackage,
        tx_ref,
        transaction_id,
        transactionDbId,
        mockReq,
      });

    } else if (isFailed) {
      // Failed-payment post-commit: notify traveler + promote waitlist
      await Promise.allSettled([
        (async () => {
          if (b.tour) await promoteNextInWaitlist(b.tour, b.scheduleId);
        })(),
        sendNotification(b.user, {
          type: "payment",
          priority: "NORMAL",
          message: `Payment failed. Your reserved slots have been released. Please try booking again.`,
          referenceId: b._id,
        }),
        recordAction(mockReq, "PAYMENT_FAILED", "Transaction", transactionDbId, {
          tx_ref,
          bookingId: b._id,
        }),
      ]).then((results) => {
        results.forEach((r, i) => {
          if (r.status === "rejected") {
            logger.error(`Post-commit [failed][task${i}] error: ${r.reason?.message}`);
          }
        });
      });

    } else if (isRefunded) {
      // Refund post-commit: notify traveler
      await Promise.allSettled([
        sendNotification(b.user, {
          type: "payment",
          priority: "HIGH",
          message: `Your booking has been refunded and cancelled. The funds will be returned to your account.`,
          referenceId: b._id,
        }),
        recordAction(mockReq, "PAYMENT_REFUNDED", "Transaction", transactionDbId, {
          tx_ref,
          bookingId: b._id,
        }),
      ]).then((results) => {
        results.forEach((r, i) => {
          if (r.status === "rejected") {
            logger.error(`Post-commit [refunded][task${i}] error: ${r.reason?.message}`);
          }
        });
      });
    }
  }

  return res.status(200).json({ received: true });
};

// ─────────────────────────────────────────────────────────────────────────────
// verifyPaymentStatus — UI SYNC ONLY
//
// Golden Rule: VERIFY = UI SYNC ONLY
//   - First, check our own DB. If webhook already ran → return state, nothing else.
//   - If webhook has NOT run yet → query Chapa → call confirmPaidBookingCore()
//     (via the legacy confirmPaidBooking shim which sequences both phases).
//   - NEVER: decrement slots twice, create chat twice, send duplicate invoices.
// ─────────────────────────────────────────────────────────────────────────────
const verifyPaymentStatus = async (req, res, next) => {
  try {
    const { tx_ref } = req.params;

    // Non-blocking audit — record that verify was called
    recordAction(
      req,
      "PAYMENT_VERIFY_CALLED",
      "Transaction",
      null,
      { tx_ref, userId: req.user?._id }
    ).catch(() => {});

    // ── Check our own records first ─────────────────────────────────────────
    const transaction = await Transaction.findOne({ tx_ref });
    const { booking } = await resolveBooking(tx_ref);

    // If webhook already ran and confirmed the booking, return state only.
    // Do NOT re-run any business logic — idempotency.
    if (
      transaction?.status === "success" &&
      (booking?.paymentStatus === "paid" || booking?.status === "confirmed")
    ) {
      logger.info(`Verify (safe): ${tx_ref} already confirmed by webhook.`);
      return res.json({
        status: "success",
        message: "Payment already confirmed",
        alreadyProcessed: true,
        data: {
          tx_ref,
          bookingId: booking?._id,
          bookingStatus: booking?.status,
          paymentStatus: booking?.paymentStatus,
        },
      });
    }

    // ── Fallback: query Chapa directly ──────────────────────────────────────
    // This path executes only when the webhook has NOT yet been received.
    const verificationData = await verifyTransaction(tx_ref);
    const paymentStatus = verificationData.data?.status;

    if (verificationData.status === "success" && paymentStatus === "success") {
      if (booking && booking.paymentStatus !== "paid") {
        logger.info(`Verify (fallback): Confirming booking ${booking._id} — webhook not yet received.`);
        booking.transactionId = verificationData.data?.reference;

        // confirmPaidBooking (shim) calls core + post-processing sequentially.
        // It has its own idempotency guard — safe to call.
        await confirmPaidBooking(booking);
      }

      if (transaction && transaction.status !== "success") {
        transaction.status = "success";
        transaction.providerTransactionId = verificationData.data?.reference;
        transaction.rawPayload = verificationData;
        await transaction.save();
      }
    } else if (verificationData.status === "success" && paymentStatus !== "success") {
      if (transaction && transaction.status === "pending") {
        transaction.status = "failed";
        transaction.rawPayload = verificationData;
        await transaction.save();
      }
    }

    return res.json({
      status: paymentStatus === "success" ? "success" : "failed",
      message: paymentStatus === "success" ? "Payment confirmed" : "Payment failed or cancelled",
      data: verificationData.data,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// initiatePackagePayment
// ─────────────────────────────────────────────────────────────────────────────
const initiatePackagePayment = async (req, res, next) => {
  try {
    const booking = await PackageBooking.findById(req.params.bookingId);
    if (!booking || booking.user.toString() !== req.user._id.toString()) {
      res.status(404);
      throw new Error("Booking not found");
    }
    if (booking.bookingStatus === "confirmed") {
      res.status(400);
      throw new Error("Package is already paid");
    }

    const tx_ref = booking.tx_ref || `KT-PKG-${Date.now()}-${booking._id}`;

    let transaction = await Transaction.findOne({ tx_ref });
    if (!transaction) {
      transaction = await Transaction.create({
        booking: booking._id,
        user: req.user._id,
        amount: booking.totalPrice,
        tx_ref,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
    }

    if (!booking.tx_ref) {
      booking.tx_ref = tx_ref;
      await booking.save();
    }

    const paymentData = await initializePayment(booking, req.user);

    recordAction(req, "PAYMENT_INITIATED", "Transaction", transaction._id, {
      amount: booking.totalPrice,
      tx_ref,
    });

    res.json(paymentData);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// getMyTransactions
// ─────────────────────────────────────────────────────────────────────────────
const getMyTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id }).lean().sort("-createdAt");

    for (let tx of transactions) {
      if (tx.tx_ref && tx.tx_ref.includes("-PKG-")) {
        const PackageBooking = require("../models/PackageBooking");
        tx.booking = await PackageBooking.findById(tx.booking)
          .populate("packageId", "name")
          .populate("packageScheduleId", "date endDate")
          .lean();
        if (tx.booking && tx.booking.packageId) {
          tx.booking.tour = { title: tx.booking.packageId.name };
          tx.booking.scheduleStartDate = tx.booking.packageScheduleId?.date;
          tx.booking.scheduleEndDate = tx.booking.packageScheduleId?.endDate;
        }
      } else {
        const Booking = require("../models/Booking");
        tx.booking = await Booking.findById(tx.booking).populate("tour", "title schedules").lean();
        if (tx.booking && tx.booking.tour && tx.booking.tour.schedules) {
          const schedule = tx.booking.tour.schedules.find(s => s._id.toString() === tx.booking.scheduleId?.toString());
          tx.booking.scheduleStartDate = schedule?.startDate;
          tx.booking.scheduleEndDate = schedule?.endDate;
        }
      }
    }

    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// issueRefund — Admin only
// ─────────────────────────────────────────────────────────────────────────────
const issueRefund = async (req, res, next) => {
  try {
    const { tx_ref } = req.params;
    const { amount, reason } = req.body;

    const transaction = await Transaction.findOne({ tx_ref });
    if (!transaction) {
      res.status(404);
      throw new Error("Transaction not found");
    }

    if (transaction.status !== "success") {
      res.status(400);
      throw new Error("Can only refund successful transactions");
    }

    const { refundTransaction } = require("../services/paymentService");
    await refundTransaction(tx_ref, { amount, reason });

    // Atomic refund state update inside a session
    // Atomic refund state update inside a session
    const topologyType = mongoose.connection.client?.topology?.s?.description?.type;
    const useTransaction = topologyType && topologyType !== "Single" && topologyType !== "Unknown";
    const session = useTransaction ? await mongoose.startSession() : undefined;
    try {
      const action = async () => {
        transaction.status = "refunded";
        transaction.refundAmount = amount || transaction.amount;
        transaction.refundReason = reason;
        await transaction.save({ session });

        const tourBookings = await Booking.find({ tx_ref });
        for (const b of tourBookings) {
          b.status = "cancelled";
          b.paymentStatus = "refunded";
          if (b.slotsReserved) {
            await updateRemainingSlots(b.tour, b.scheduleId, b.numPeople);
            b.slotsReserved = false;
          }
          await b.save({ session });
        }

        const pkgBookings = await PackageBooking.find({ tx_ref });
        for (const pb of pkgBookings) {
          pb.bookingStatus = "cancelled";
          pb.paymentStatus = "refunded";
          await pb.save({ session });
        }
      };

      if (useTransaction) {
        await session.withTransaction(action);
      } else {
        await action();
      }
    } finally {
      if (session) session.endSession();
    }

    // Post-commit: email + audit (non-fatal)
    await Promise.allSettled([
      (async () => {
        const User = require("../models/User");
        const tUser = await User.findById(transaction.user);
        if (tUser?.email) {
          const frontendUrl = process.env.FRONTEND_URL || "https://kambata.travel";
          const emailHtml = buildPremiumEmail({
            type: "default",
            title: "Refund Processed",
            icon: "💸",
            accentColor: "#3B82F6",
            greeting: `Hello ${tUser.name},`,
            bodyLines: [
              "We have successfully processed a refund for your recent transaction.",
              "The funds have been returned to your original payment method. Please allow a few business days for the amount to reflect in your account."
            ],
            infoCards: [
              { title: "Transaction Reference", value: tx_ref, iconEmoji: "#️⃣" },
              { title: "Refund Amount", value: `ETB ${transaction.refundAmount}`, iconEmoji: "💰" },
              { title: "Reason", value: reason || "N/A", iconEmoji: "📝" }
            ],
            statusBadge: { text: "REFUNDED", color: "#3B82F6" },
            cta: {
              text: "View Payment History",
              link: `${frontendUrl}/explorer-dashboard/payments`,
              color: "#3B82F6"
            }
          });

          await sendEmail({
            to: tUser.email,
            subject: `Refund Approved - Kambata Travel`,
            html: emailHtml,
          });
        }
      })(),
      recordAction(req, "REFUND_ISSUED", "Transaction", transaction._id, {
        amount: transaction.refundAmount,
        reason,
        tx_ref,
      }),
    ]).then((results) => {
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          logger.error(`issueRefund post-commit task[${i}] failed: ${r.reason?.message}`);
        }
      });
    });

    res.json({
      success: true,
      message: "Refund processed successfully",
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// downloadInvoice — User (owner) or Admin
// ─────────────────────────────────────────────────────────────────────────────
const downloadInvoice = async (req, res, next) => {
  try {
    const { tx_ref } = req.params;
    const transaction = await Transaction.findOne({ tx_ref });

    if (!transaction || transaction.status !== "success") {
      res.status(404);
      throw new Error("Valid paid transaction not found");
    }

    if (
      req.user.role !== "admin" &&
      transaction.user.toString() !== req.user._id.toString()
    ) {
      res.status(403);
      throw new Error("Not authorized");
    }

    const isPackage = tx_ref.includes("-PKG-");
    let record;
    if (isPackage) {
      record = await PackageBooking.findOne({ tx_ref }).populate({
        path: "packageId",
        populate: { path: "tour hotel" },
      });
    } else {
      record = await Booking.findOne({ tx_ref })
        .populate("tour user guide");
    }

    if (!record) {
      res.status(404);
      throw new Error("Booking record not found");
    }

    const User = require("../models/User");
    const bUser = await User.findById(transaction.user);

    const pdfBuffer = await generateInvoicePdf({
      invoiceNumber: tx_ref,
      issuedAt: transaction.createdAt,
      customer: { name: bUser?.name, email: bUser?.email },
      type: isPackage ? "package" : "tour",
      record,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=receipt-${tx_ref}.pdf`
    );
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiatePayment,
  initiatePackagePayment,
  handleWebhook,
  verifyPaymentStatus,
  issueRefund,
  downloadInvoice,
  getMyTransactions,
};
