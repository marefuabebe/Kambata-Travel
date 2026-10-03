"use strict";

const User = require("../models/User");
const Booking = require("../models/Booking");
const PackageBooking = require("../models/PackageBooking");
const { validateTelegramAuth, processUpdate } = require("../services/telegramService");
const { generateAccessToken } = require("../utils/generateToken");
const Guide = require("../models/Guide");
const logger = require("../utils/logger");

const handleWebhook = async (req, res, next) => {
  try {
    await processUpdate(req.body);
    res.sendStatus(200);
  } catch (err) {
    logger.error("[Telegram] Webhook error:", err);
    res.sendStatus(200);
  }
};

const telegramAuth = async (req, res, next) => {
  try {
    const { initData } = req.body;
    if (!initData) return res.status(400).json({ message: "initData is required" });
    let tgUser;
    try { tgUser = validateTelegramAuth(initData); } catch (err) {
      return res.status(401).json({ message: "Invalid Telegram auth data" });
    }
    if (!tgUser) return res.status(401).json({ message: "Telegram auth validation failed" });
    const telegramId = String(tgUser.id);
    const existingUser = await User.findOne({ telegramId }).select("-password");
    if (existingUser) {
      if (existingUser.isBlocked || (existingUser.suspendedUntil && existingUser.suspendedUntil > Date.now())) {
        return res.status(403).json({ message: "Account is suspended." });
      }
      if (tgUser.username && existingUser.telegramUsername !== tgUser.username) {
        existingUser.telegramUsername = tgUser.username;
        await existingUser.save();
      }
      const accessToken = generateAccessToken(existingUser._id);
      return res.json({ accessToken, user: { _id: existingUser._id, name: existingUser.name, email: existingUser.email, role: existingUser.role, profilePicture: existingUser.profilePicture, guideStatus: existingUser.guideStatus, telegramId: existingUser.telegramId, telegramUsername: existingUser.telegramUsername } });
    }
    return res.status(200).json({ requireRoleSelection: true, telegramUser: { id: telegramId, firstName: tgUser.first_name, lastName: tgUser.last_name, username: tgUser.username, photoUrl: tgUser.photo_url } });
  } catch (err) { next(err); }
};

const completeTelegramAuth = async (req, res, next) => {
  try {
    const { initData, role, linkEmail, linkPassword } = req.body;
    if (!initData || !role) return res.status(400).json({ message: "initData and role are required" });
    if (!["user", "guide"].includes(role)) return res.status(400).json({ message: "Role must be user or guide" });
    let tgUser;
    try { tgUser = validateTelegramAuth(initData); } catch (err) { return res.status(401).json({ message: "Invalid Telegram auth data" }); }
    if (!tgUser) return res.status(401).json({ message: "Telegram auth validation failed" });
    const telegramId = String(tgUser.id);
    const telegramUsername = tgUser.username || null;
    const alreadyLinked = await User.findOne({ telegramId });
    if (alreadyLinked) {
      const accessToken = generateAccessToken(alreadyLinked._id);
      return res.json({ accessToken, user: { _id: alreadyLinked._id, name: alreadyLinked.name, email: alreadyLinked.email, role: alreadyLinked.role, profilePicture: alreadyLinked.profilePicture, guideStatus: alreadyLinked.guideStatus, telegramId: alreadyLinked.telegramId, telegramUsername: alreadyLinked.telegramUsername } });
    }
    let user;
    if (linkEmail && linkPassword) {
      const normalizedEmail = linkEmail.toLowerCase().trim();
      user = await User.findOne({ email: normalizedEmail });
      if (!user || !(await user.matchPassword(linkPassword))) return res.status(401).json({ message: "Invalid email or password" });
      if (user.telegramId && user.telegramId !== telegramId) return res.status(400).json({ message: "Kambata account already linked to different Telegram account" });
      user.telegramId = telegramId;
      user.telegramUsername = telegramUsername;
      await user.save();
      logger.info("[Telegram] Linked existing account: " + user.email);
    } else {
      const tgName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");
      const fakeTgEmail = "tg_" + telegramId + "@telegram.kambata.local";
      const emailExists = await User.findOne({ email: fakeTgEmail });
      if (emailExists) {
        emailExists.telegramId = telegramId;
        emailExists.telegramUsername = telegramUsername;
        await emailExists.save();
        user = emailExists;
      } else {
        const payload = { name: tgName || "Telegram User", email: fakeTgEmail, role, telegramId, telegramUsername, authProvider: "telegram", isEmailVerified: true };
        if (role === "guide") payload.guideStatus = "none";
        user = await User.create(payload);
        if (role === "guide") await Guide.create({ user: user._id });
        logger.info("[Telegram] New user: " + telegramId + " as " + role);
      }
    }
    const accessToken = generateAccessToken(user._id);
    return res.status(201).json({ accessToken, user: { _id: user._id, name: user.name, email: user.email, role: user.role, profilePicture: user.profilePicture, guideStatus: user.guideStatus, telegramId: user.telegramId, telegramUsername: user.telegramUsername } });
  } catch (err) { next(err); }
};

const linkTelegramAccount = async (req, res, next) => {
  try {
    const { initData } = req.body;
    if (!initData) return res.status(400).json({ message: "initData is required" });
    let tgUser;
    try { tgUser = validateTelegramAuth(initData); } catch (err) { return res.status(401).json({ message: "Invalid Telegram auth data" }); }
    if (!tgUser) return res.status(401).json({ message: "Telegram auth validation failed" });
    const telegramId = String(tgUser.id);
    const currentUserId = String(req.user._id);
    const existingLink = await User.findOne({ telegramId });
    if (existingLink && String(existingLink._id) !== currentUserId) return res.status(400).json({ message: "Telegram account already linked to another Kambata account" });
    req.user.telegramId = telegramId;
    req.user.telegramUsername = tgUser.username || null;
    await req.user.save();
    res.json({ message: "Telegram account linked successfully", telegramUsername: tgUser.username });
  } catch (err) { next(err); }
};

const unlinkTelegramAccount = async (req, res, next) => {
  try {
    req.user.telegramId = undefined;
    req.user.telegramUsername = undefined;
    await req.user.save();
    res.json({ message: "Telegram account unlinked successfully" });
  } catch (err) { next(err); }
};

const getTelegramBookings = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const [tourBookings, packageBookings] = await Promise.all([
      Booking.find({ user: userId }).populate("tour", "title images").sort({ createdAt: -1 }).limit(20).lean(),
      PackageBooking.find({ user: userId }).populate("package", "title images").sort({ createdAt: -1 }).limit(20).lean(),
    ]);
    res.json({ tourBookings, packageBookings });
  } catch (err) { next(err); }
};

module.exports = { handleWebhook, telegramAuth, completeTelegramAuth, linkTelegramAccount, unlinkTelegramAccount, getTelegramBookings };
