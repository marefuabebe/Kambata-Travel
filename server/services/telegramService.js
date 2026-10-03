/**
 * telegramService.js
 *
 * Central Telegram Bot Service for Kambata Travel.
 * Handles bot initialization, webhook processing, and message sending.
 *
 * Architecture:
 *  - Bot runs in WEBHOOK mode in production (registered via /api/telegram/webhook)
 *  - Bot runs in POLLING mode in development for easy local testing
 *  - All bot token access is BACKEND ONLY -- never exposed to client
 */

'use strict';

const rawTelegramBot = require('node-telegram-bot-api');
const TelegramBot = typeof rawTelegramBot === 'function'
  ? rawTelegramBot
  : (rawTelegramBot && (rawTelegramBot.TelegramBot || rawTelegramBot.default)) || rawTelegramBot;
const crypto = require('crypto');
const logger = require('../utils/logger');

let bot = null;

/**
 * Initialize the Telegram bot.
 * Call this once after DB is connected.
 */
const initBot = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.warn('[Telegram] TELEGRAM_BOT_TOKEN not set -- Telegram integration disabled.');
    return null;
  }

  if (bot) return bot;

  const isProd = process.env.NODE_ENV === 'production';

  if (isProd && process.env.TELEGRAM_WEBHOOK_URL) {
    // Webhook mode: requests are forwarded from the /api/telegram/webhook route
    bot = new TelegramBot(token, { webHook: false }); // We handle webhook manually
    logger.info('[Telegram] Bot initialized in webhook mode.');
  } else {
    // Polling mode for local dev
    bot = new TelegramBot(token, { polling: true });
    logger.info('[Telegram] Bot initialized in polling mode (dev).');
    setupBotHandlers();
  }

  return bot;
};

/**
 * Get the bot instance.
 */
const getBot = () => {
  if (!bot) {
    logger.warn('[Telegram] Bot not initialized.');
  }
  return bot;
};

// Main Menu Keyboard - Points to the REAL Kambata Travel website
const getMainMenuKeyboard = (miniAppUrl) => ({
  keyboard: [
    [
      { text: '🌍 Open Kambata Travel', web_app: { url: miniAppUrl + '/' } },
    ],
    [
      { text: '🗺️ Explore', web_app: { url: miniAppUrl + '/explore' } },
      { text: '🏕️ Tours', web_app: { url: miniAppUrl + '/tours' } },
    ],
    [
      { text: '📋 My Bookings', web_app: { url: miniAppUrl + '/explorer-dashboard/bookings' } },
      { text: '👤 My Account', web_app: { url: miniAppUrl + '/explorer-dashboard' } },
    ],
  ],
  resize_keyboard: true,
  persistent: true,
});

const getInlineMenu = (miniAppUrl) => ({
  inline_keyboard: [
    [
      { text: '🌍 Open Kambata Travel', web_app: { url: miniAppUrl + '/' } },
    ],
    [
      { text: '🗺️ Explore', web_app: { url: miniAppUrl + '/explore' } },
      { text: '🏕️ Tours', web_app: { url: miniAppUrl + '/tours' } },
    ],
    [
      { text: '📋 My Bookings', web_app: { url: miniAppUrl + '/explorer-dashboard/bookings' } },
      { text: '👤 My Account', web_app: { url: miniAppUrl + '/explorer-dashboard' } },
    ],
  ],
});

// Bot command/message handlers (for polling mode in dev)
const setupBotHandlers = () => {
  if (!bot) return;
  const miniAppUrl = process.env.FRONTEND_URL || 'https://kambata-travel.vercel.app';

  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from && msg.from.first_name ? msg.from.first_name : 'Traveler';
    await bot.sendMessage(
      chatId,
      'Welcome to Kambata Travel, ' + firstName + '!\n\nDiscover the authentic beauty of Kambata - Ethiopia hidden gem. Explore tours, book experiences, and connect with local guides.\n\nUse the menu below to get started:',
      {
        reply_markup: getMainMenuKeyboard(miniAppUrl),
      }
    );
  });

  bot.onText(/\/menu/, async (msg) => {
    const chatId = msg.chat.id;
    await bot.sendMessage(chatId, 'Kambata Travel Menu', {
      reply_markup: getInlineMenu(miniAppUrl),
    });
  });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    if (!text || text.startsWith('/')) return;
    await bot.sendMessage(
      chatId,
      'Use the menu buttons below to navigate Kambata Travel. Type /menu to see options.',
      {
        reply_markup: getMainMenuKeyboard(miniAppUrl),
      }
    );
  });

  logger.info('[Telegram] Bot handlers registered.');
};

// Process webhook update (called by the webhook route controller)
const processUpdate = async (update) => {
  if (!bot) {
    logger.warn('[Telegram] processUpdate called but bot not initialized.');
    return;
  }
  const miniAppUrl = process.env.FRONTEND_URL || 'https://kambata-travel.vercel.app';
  // Register handlers for webhook mode too
  if (!bot._events || !bot._events.message) {
    setupBotHandlers();
  }
  bot.processUpdate(update);
};

// Register webhook with Telegram servers
const registerWebhook = async () => {
  if (!bot) return;
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.warn('[Telegram] TELEGRAM_WEBHOOK_URL not set -- skipping webhook registration.');
    return;
  }
  try {
    await bot.setWebHook(webhookUrl + '/api/telegram/webhook');
    logger.info('[Telegram] Webhook registered: ' + webhookUrl + '/api/telegram/webhook');
  } catch (err) {
    logger.error('[Telegram] Failed to register webhook:', err.message);
  }
};

// Secure Telegram Auth Validation (HMAC-SHA256)
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
const validateTelegramAuth = (initData) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN not configured');

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  params.delete('hash');

  // Sort params alphabetically and build check string
  const checkString = Array.from(params.entries())
    .sort(function(a, b) { return a[0].localeCompare(b[0]); })
    .map(function(pair) { return pair[0] + '=' + pair[1]; })
    .join('\n');

  // HMAC key = HMAC-SHA256("WebAppData", bot_token)
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

  if (computedHash !== hash) return null;

  // Check auth_date freshness (max 1 hour old)
  const authDate = parseInt(params.get('auth_date') || '0', 10);
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > 3600) return null;

  const userStr = params.get('user');
  if (!userStr) return null;

  return JSON.parse(userStr);
};

// Notification Senders
const sendTelegramMessage = async (telegramId, text, options) => {
  if (!bot || !telegramId) return;
  try {
    await bot.sendMessage(telegramId, text, Object.assign({ parse_mode: 'Markdown' }, options || {}));
    logger.info('[Telegram] Message sent to ' + telegramId);
  } catch (err) {
    logger.warn('[Telegram] Failed to send message to ' + telegramId + ': ' + err.message);
  }
};

const notifyBookingConfirmed = async (user, booking, tourTitle) => {
  if (!user || !user.telegramId) return;
  const frontendUrl = process.env.FRONTEND_URL || 'https://kambata-travel.vercel.app';
  const text = 'Booking Confirmed!\n\nTour: ' + tourTitle + '\nRef: ' + booking.referenceNumber + '\nStatus: Paid\n\nView: ' + frontendUrl + '/explorer-dashboard/bookings';
  await sendTelegramMessage(user.telegramId, text);
};

const notifyPaymentSuccess = async (user, booking, amount) => {
  if (!user || !user.telegramId) return;
  const text = 'Payment Successful!\n\nAmount: ETB ' + (amount || 0).toLocaleString() + '\nRef: ' + booking.referenceNumber + '\n\nYour booking is now confirmed. Have a great trip!';
  await sendTelegramMessage(user.telegramId, text);
};

const notifyBookingCancelled = async (user, booking, tourTitle) => {
  if (!user || !user.telegramId) return;
  const text = 'Booking Cancelled\n\nTour: ' + tourTitle + '\nRef: ' + booking.referenceNumber + '\n\nIf you have questions, contact our support team.';
  await sendTelegramMessage(user.telegramId, text);
};

const notifyTourReminder = async (user, reminderType, tourTitle, startDate, meetingPoint) => {
  if (!user || !user.telegramId) return;
  var timeMap = { '7d': '7 days', '1d': 'tomorrow', '2h': '2 hours' };
  var timeStr = timeMap[reminderType] || reminderType;
  var text = 'Tour Reminder\n\nYour tour ' + tourTitle + ' starts in ' + timeStr + '!\nDate: ' + new Date(startDate).toDateString();
  if (meetingPoint) text += '\nMeeting Point: ' + meetingPoint;
  text += '\n\nHave a wonderful experience!';
  await sendTelegramMessage(user.telegramId, text);
};

const notifyGuideAssignment = async (guide, tourTitle, startDate) => {
  if (!guide || !guide.telegramId) return;
  const frontendUrl = process.env.FRONTEND_URL || 'https://kambata-travel.vercel.app';
  const text = 'New Tour Assignment!\n\nTour: ' + tourTitle + '\nDate: ' + new Date(startDate).toDateString() + '\n\nPlease review and respond: ' + frontendUrl + '/guide-dashboard/assignments';
  await sendTelegramMessage(guide.telegramId, text);
};

module.exports = {
  initBot,
  getBot,
  processUpdate,
  registerWebhook,
  validateTelegramAuth,
  sendTelegramMessage,
  notifyBookingConfirmed,
  notifyPaymentSuccess,
  notifyBookingCancelled,
  notifyTourReminder,
  notifyGuideAssignment,
  getMainMenuKeyboard,
  getInlineMenu,
  setupBotHandlers,
};
