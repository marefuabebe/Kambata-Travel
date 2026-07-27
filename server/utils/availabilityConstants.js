const ACTIVE_SCHEDULE_STATUSES = [
  "published",
  "confirmed",
  "in_progress",
  "full"
];

const INACTIVE_SCHEDULE_STATUSES = [
  "completed",
  "cancelled",
  "expired",
  "payment_expired",
  "rejected",
  "draft"
];

module.exports = {
  ACTIVE_SCHEDULE_STATUSES,
  INACTIVE_SCHEDULE_STATUSES
};
