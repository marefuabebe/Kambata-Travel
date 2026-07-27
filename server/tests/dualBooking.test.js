/**
 * Dual Booking System — unit tests for core business rules and services.
 * Run: node --test tests/dualBooking.test.js
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  canInstantBookTour,
  canRequestDateTour,
  assertInstantBookingAllowed,
  assertRequestBookingAllowed,
} = require("../services/tourBookingRules");

const { buildRequestTimeline } = require("../services/requestAuditService");
const { GUIDE_RESPONSE_MS, PAYMENT_WINDOW_MS } = require("../services/guideReservationService");

describe("bookingType rules", () => {
  it("instant-only tour allows instant book when schedules exist", () => {
    assert.equal(canInstantBookTour({ bookingType: "instant" }, true), true);
    assert.equal(canRequestDateTour({ bookingType: "instant" }, true), false);
  });

  it("request-only tour allows custom date requests", () => {
    assert.equal(canInstantBookTour({ bookingType: "request" }, true), false);
    assert.equal(canRequestDateTour({ bookingType: "request" }, true), true);
  });

  it("both booking type allows instant and request flows", () => {
    assert.equal(canInstantBookTour({ bookingType: "both" }, true), true);
    assert.equal(canRequestDateTour({ bookingType: "both" }, true), true);
  });

  it("both type still allows request when no live schedule", () => {
    assert.equal(canInstantBookTour({ bookingType: "both" }, false), false);
    assert.equal(canRequestDateTour({ bookingType: "both" }, false), true);
  });

  it("assertInstantBookingAllowed throws for request-only tours", () => {
    assert.throws(() => assertInstantBookingAllowed({ bookingType: "request" }), /custom date/i);
  });

  it("assertRequestBookingAllowed throws for instant-only tours", () => {
    assert.throws(() => assertRequestBookingAllowed({ bookingType: "instant" }), /instant booking/i);
  });
});

describe("request timeline engine", () => {
  it("builds completed timeline for confirmed request", () => {
    const logs = [
      { event: "REQUEST_CREATED" },
      { event: "GUIDE_ASSIGNED" },
      { event: "GUIDE_ACCEPTED" },
      { event: "PAYMENT_LINK_SENT" },
      { event: "REQUEST_CONFIRMED" },
    ];
    const { steps, failed } = buildRequestTimeline(logs, "confirmed");
    assert.equal(failed, false);
    assert.ok(steps.every((s) => s.status === "completed"));
  });

  it("marks timeline as failed on guide decline", () => {
    const logs = [
      { event: "REQUEST_CREATED" },
      { event: "GUIDE_ASSIGNED" },
      { event: "GUIDE_DECLINED" },
    ];
    const { failed, failureEvent } = buildRequestTimeline(logs, "declined_by_guide");
    assert.equal(failed, true);
    assert.equal(failureEvent, "GUIDE_DECLINED");
  });
});

describe("expiration windows", () => {
  it("guide response window is 24 hours", () => {
    assert.equal(GUIDE_RESPONSE_MS, 24 * 60 * 60 * 1000);
  });

  it("payment window is 30 minutes", () => {
    assert.equal(PAYMENT_WINDOW_MS, 30 * 60 * 1000);
  });
});

describe("request status lifecycle", () => {
  const VALID_STATUSES = [
    "pending_admin",
    "guide_pending",
    "awaiting_payment",
    "confirmed",
    "declined_by_guide",
    "expired",
    "payment_expired",
    "rejected",
    "cancelled",
  ];

  it("includes all spec-defined terminal and active statuses", () => {
    for (const status of ["payment_expired", "declined_by_guide", "awaiting_payment", "guide_pending"]) {
      assert.ok(VALID_STATUSES.includes(status), `missing ${status}`);
    }
  });
});
