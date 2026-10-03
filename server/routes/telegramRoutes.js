'use strict';

const express = require('express');
const router = express.Router();
const {
  handleWebhook,
  telegramAuth,
  completeTelegramAuth,
  linkTelegramAccount,
  unlinkTelegramAccount,
  getTelegramBookings,
  initHandoff,
  completeHandoff,
  getHandoffStatus,
  claimHandoff,
} = require('../controllers/telegramController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/securityMiddleware');

// Telegram Bot webhook endpoint -- no auth needed (Telegram calls this)
router.post('/webhook', handleWebhook);

// Mini App auth endpoints
router.post('/auth', authLimiter, telegramAuth);
router.post('/auth/complete', authLimiter, completeTelegramAuth);

// Google OAuth Handoff for Telegram
router.post('/handoff-init', authLimiter, initHandoff);
router.post('/handoff-complete', authLimiter, completeHandoff);
router.get('/handoff-status', authLimiter, getHandoffStatus);
router.post('/handoff-claim', authLimiter, claimHandoff);

// Authenticated endpoints (require JWT)
router.post('/auth/link', protect, linkTelegramAccount);
router.delete('/auth/unlink', protect, unlinkTelegramAccount);
router.get('/bookings', protect, getTelegramBookings);

module.exports = router;
