const TourRequest = require("../models/TourRequest");

const ACTIVE_RESERVATION_STATUSES = ["guide_pending", "awaiting_payment"];

const getReservedGuideIds = async (excludeRequestId = null) => {
  const query = {
    status: { $in: ACTIVE_RESERVATION_STATUSES },
    assignedGuide: { $exists: true, $ne: null },
  };
  if (excludeRequestId) query._id = { $ne: excludeRequestId };

  const requests = await TourRequest.find(query).select("assignedGuide");
  return new Set(requests.map((r) => r.assignedGuide.toString()));
};

const isGuideReserved = async (guideId, excludeRequestId = null) => {
  const reserved = await getReservedGuideIds(excludeRequestId);
  return reserved.has(guideId.toString());
};

const releaseGuideReservation = async (request) => {
  request.assignedGuide = undefined;
  request.guideReservationExpiresAt = undefined;
  request.paymentExpiresAt = undefined;
  await request.save();
};

const GUIDE_RESPONSE_MS = 24 * 60 * 60 * 1000;
const PAYMENT_WINDOW_MS = 30 * 60 * 1000;

module.exports = {
  ACTIVE_RESERVATION_STATUSES,
  getReservedGuideIds,
  isGuideReserved,
  releaseGuideReservation,
  GUIDE_RESPONSE_MS,
  PAYMENT_WINDOW_MS,
};
