/**
 * packageBookingRoutes.js
 *
 * Routes for managing PackageBooking records.
 * Handles: my-bookings, single booking detail, cancellation.
 *
 * Package booking CREATION is handled via:
 *   POST /api/packages/:id/schedules/:scheduleId/book  (packageRoutes.js)
 * Package booking PAYMENT is handled via:
 *   POST /api/payments/package/:bookingId              (paymentRoutes.js)
 */

"use strict";

const express = require("express");
const router = express.Router();
const PackageBooking = require("../models/PackageBooking");
const { protect, requireAdmin } = require("../middleware/authMiddleware");
const logger = require("../utils/logger");

// ── GET /api/package-bookings/my-bookings ──────────────────────────────────
// Returns all package bookings for the logged-in user.
router.get("/my-bookings", protect, async (req, res, next) => {
  try {
    const bookings = await PackageBooking.find({ user: req.user._id })
      .populate({
        path: "packageId",
        select: "title images description",
        populate: [
          { path: "tour", select: "title images destination duration" },
          { path: "hotel", select: "name images location starRating" },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/package-bookings/:id ─────────────────────────────────────────
// Returns a single package booking (owner or admin only).
router.get("/:id", protect, async (req, res, next) => {
  try {
    const booking = await PackageBooking.findById(req.params.id)
      .populate({
        path: "packageId",
        populate: [
          { path: "tour", select: "title images destination duration difficulty" },
          { path: "hotel", select: "name images location starRating amenities" },
        ],
      })
      .lean();

    if (!booking) {
      res.status(404);
      throw new Error("Package booking not found");
    }

    // Authorization: owner or admin
    if (
      booking.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      res.status(403);
      throw new Error("Not authorized to view this booking");
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
});

// ── PATCH /api/package-bookings/:id/cancel ────────────────────────────────
// Allows the owner (or admin) to cancel an unpaid package booking.
router.patch("/:id/cancel", protect, async (req, res, next) => {
  try {
    const booking = await PackageBooking.findById(req.params.id);

    if (!booking) {
      res.status(404);
      throw new Error("Package booking not found");
    }

    // Authorization: owner or admin
    if (
      booking.user.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      res.status(403);
      throw new Error("Not authorized to cancel this booking");
    }

    // Cannot cancel a paid booking via this endpoint — use refund flow instead
    if (booking.paymentStatus === "paid") {
      res.status(400);
      throw new Error(
        "This booking has been paid. Please contact support to request a refund."
      );
    }

    if (booking.bookingStatus === "cancelled") {
      res.status(400);
      throw new Error("Booking is already cancelled");
    }

    booking.bookingStatus = "cancelled";
    await booking.save();

    logger.info(
      `PackageBooking ${booking._id} cancelled by user ${req.user._id}`
    );

    res.json({
      success: true,
      message: "Package booking cancelled",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/package-bookings (Admin only) ────────────────────────────────
// Returns all package bookings for admin management.
router.get("/", protect, requireAdmin, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.bookingStatus = status;

    const bookings = await PackageBooking.find(filter)
      .populate("user", "name email phone")
      .populate({
        path: "packageId",
        select: "title",
      })
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const total = await PackageBooking.countDocuments(filter);

    res.json({
      success: true,
      count: bookings.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
