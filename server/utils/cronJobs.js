const cron = require("node-cron");
const { markToursAsCompleted, cleanupAbandonedPayments, cleanupExpiredInvitations } = require("../services/bookingService");
const logger = require("./logger");

/**
 * System Cron Jobs
 * Runs periodic maintenance tasks for booking lifecycle management.
 */

const initCronJobs = () => {
  // 1. Mark Tours as Completed (Every night at midnight)
  cron.schedule("0 0 * * *", () => {
    logger.info("CRON: Running markToursAsCompleted task...");
    markToursAsCompleted();
  });

  // 2. Cleanup Abandoned Payments (Every 15 minutes)
  cron.schedule("*/15 * * * *", () => {
    logger.info("CRON: Running cleanupAbandonedPayments task...");
    cleanupAbandonedPayments();
  });

  // 3. Cleanup Expired Waitlist Invitations (Every 10 minutes)
  cron.schedule("*/10 * * * *", () => {
    logger.info("CRON: Running cleanupExpiredInvitations task...");
    cleanupExpiredInvitations();
  });

  logger.info("System Cron Jobs Initialized Successfully.");
};

module.exports = initCronJobs;
