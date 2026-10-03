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
} = require('../controllers/telegramController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/securityMiddleware');

// Telegram Bot webhook endpoint -- no auth needed (Telegram calls this)
router.post('/webhook', handleWebhook);

// Mini App auth endpoints
router.post('/auth', authLimiter, telegramAuth);
router.post('/auth/complete', authLimiter, completeTelegramAuth);

// Authenticated endpoints (require JWT)
router.post('/auth/link', protect, linkTelegramAccount);
router.delete('/auth/unlink', protect, unlinkTelegramAccount);
router.get('/bookings', protect, getTelegramBookings);

module.exports = router;
