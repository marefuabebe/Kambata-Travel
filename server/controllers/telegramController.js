"use strict";

const User = require("../models/User");
const Booking = require("../models/Booking");
const PackageBooking = require("../models/PackageBooking");
const { validateTelegramAuth, processUpdate } = require("../services/telegramService");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken");
const Guide = require("../models/Guide");
const AuthHandoff = require("../models/AuthHandoff");
const logger = require("../utils/logger");

const GOOGLE_CLIENT_ID = "167884286246-pae6qdcf9u587i1i961asqkjodd4els7.apps.googleusercontent.com";

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

const initHandoff = async (req, res, next) => {
  try {
    const { telegramId } = req.body || {};
    const handoffId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");

    await AuthHandoff.create({
      handoffId,
      telegramId: telegramId ? String(telegramId) : undefined,
      status: "pending",
    });

    res.status(201).json({ handoffId });
  } catch (err) {
    next(err);
  }
};

const completeHandoff = async (req, res, next) => {
  try {
    const { handoffId, token, role } = req.body;
    if (!handoffId || !token) {
      return res.status(400).json({ message: "handoffId and Google token are required" });
    }

    const handoff = await AuthHandoff.findOne({ handoffId });
    if (!handoff) {
      return res.status(404).json({ message: "Login session expired or invalid. Please try again." });
    }

    const client = new OAuth2Client();
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: token,
        audience: GOOGLE_CLIENT_ID,
      });
    } catch (e) {
      logger.error("[Handoff] Google token verification failed: " + e.message);
      return res.status(401).json({ message: "Google authentication failed" });
    }

    const payload = ticket.getPayload();
    const { sub, email, name, picture, email_verified } = payload;

    if (!email_verified) {
      return res.status(400).json({ message: "Google email not verified" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: normalizedEmail });

    if (user) {
      if (user.isBlocked || (user.suspendedUntil && user.suspendedUntil > Date.now())) {
        return res.status(403).json({ message: "Account is suspended." });
      }
      if (!user.googleId) {
        user.googleId = sub;
      }
      if (handoff.telegramId && user.telegramId !== handoff.telegramId) {
        // Disassociate telegramId from any other account first to avoid E11000 duplicate key error
        await User.updateMany(
          { telegramId: handoff.telegramId, _id: { $ne: user._id } },
          { $unset: { telegramId: 1, telegramUsername: 1 } }
        );
        user.telegramId = handoff.telegramId;
      }
      await user.save();
    } else {
      // Check if this Telegram user already had a placeholder account (e.g. from 1-click Telegram login)
      let placeholderUser = null;
      if (handoff.telegramId) {
        placeholderUser = await User.findOne({ telegramId: handoff.telegramId });
      }

      const selectedRole = role && ["user", "guide"].includes(role) ? role : "user";

      if (placeholderUser && placeholderUser.email.endsWith("@telegram.kambata.local")) {
        // Seamlessly upgrade placeholder account with verified Google credentials
        placeholderUser.name = name || placeholderUser.name || "Explorer";
        placeholderUser.email = normalizedEmail;
        placeholderUser.googleId = sub;
        placeholderUser.authProvider = "google";
        placeholderUser.isEmailVerified = true;
        if (picture) placeholderUser.profilePicture = picture;
        if (selectedRole === "guide" && placeholderUser.role !== "guide") {
          placeholderUser.role = "guide";
          placeholderUser.guideStatus = "none";
          await Guide.create({ user: placeholderUser._id });
        }
        await placeholderUser.save();
        user = placeholderUser;
        logger.info("[Handoff] Upgraded placeholder Telegram user to Google: " + user.email);
      } else {
        // Clear any conflicting telegramId on other accounts before creation
        if (handoff.telegramId) {
          await User.updateMany(
            { telegramId: handoff.telegramId },
            { $unset: { telegramId: 1, telegramUsername: 1 } }
          );
        }

        const userPayload = {
          name: name || "Explorer",
          email: normalizedEmail,
          googleId: sub,
          authProvider: "google",
          role: selectedRole,
          isEmailVerified: true,
          profilePicture: picture,
        };
        if (handoff.telegramId) {
          userPayload.telegramId = handoff.telegramId;
        }
        if (selectedRole === "guide") {
          userPayload.guideStatus = "none";
        }

        user = await User.create(userPayload);
        if (selectedRole === "guide") {
          await Guide.create({ user: user._id });
        }
        logger.info("[Handoff] New user created via Google-Telegram: " + user.email);
      }
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    const safeUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      guideStatus: user.guideStatus,
      telegramId: user.telegramId,
    };

    handoff.status = "completed";
    handoff.user = safeUser;
    handoff.accessToken = accessToken;
    handoff.refreshToken = refreshToken;
    await handoff.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const botUrl = `https://t.me/KambataTravelBot?startapp=auth_${handoffId}`;
    return res.json({
      success: true,
      botUrl,
      handoffId,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
};

const getHandoffStatus = async (req, res, next) => {
  try {
    const { handoff } = req.query;
    if (!handoff) return res.status(400).json({ message: "handoff is required" });

    const record = await AuthHandoff.findOne({ handoffId: handoff });
    if (!record) {
      return res.status(404).json({ message: "Session expired or not found" });
    }

    if (record.status === "completed") {
      const responseData = {
        status: "completed",
        accessToken: record.accessToken,
        user: record.user,
      };

      // Strict single-use security: wipe credentials from database immediately
      record.status = "claimed";
      record.accessToken = null;
      record.refreshToken = null;
      await record.save();

      return res.json(responseData);
    }

    return res.json({ status: record.status });
  } catch (err) {
    next(err);
  }
};

const claimHandoff = async (req, res, next) => {
  try {
    const { handoffId } = req.body;
    if (!handoffId) return res.status(400).json({ message: "handoffId is required" });

    const record = await AuthHandoff.findOne({ handoffId });
    if (!record) {
      return res.status(404).json({ message: "Session not found or expired" });
    }

    if (record.status === "claimed") {
      return res.status(410).json({ message: "This authentication session has already been claimed." });
    }

    if (!record.accessToken || !record.user) {
      return res.status(400).json({ message: "Authentication not yet completed" });
    }

    const responseData = {
      accessToken: record.accessToken,
      user: record.user,
    };

    if (record.refreshToken) {
      res.cookie("refreshToken", record.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    // Strict single-use security: wipe credentials from database immediately
    record.status = "claimed";
    record.accessToken = null;
    record.refreshToken = null;
    await record.save();

    return res.json(responseData);
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
