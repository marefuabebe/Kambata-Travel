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
      if (!user) return res.status(401).json({ message: "Invalid email or password" });
      if (!user.password) {
        if (user.authProvider === "google" || user.googleId) {
          return res.status(400).json({
            message: "This Kambata account was created with Google and has no password. Please link your account using the Google sign-in option."
          });
        }
        return res.status(400).json({
          message: "This account has no password set. Please use 'Forgot Password' or your connected social login."
        });
      }
      if (!(await user.matchPassword(linkPassword))) return res.status(401).json({ message: "Invalid email or password" });
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

    // 2. Get Telegram ID from validated handoff session
    const telegramId = handoff.telegramId ? String(handoff.telegramId) : null;

    // 3. Search for existing user by telegramId
    const tgUser = telegramId ? await User.findOne({ telegramId }) : null;

    // 4. Search for Google account by Google ID or email according to existing auth design
    const googleUser = await User.findOne({
      $or: [
        { googleId: sub },
        { email: normalizedEmail },
      ],
    });

    let user = null;

    // 5. If the Telegram user already exists AND represents the same account:
    //    - reuse existing User document
    //    - do NOT create another User
    //    - do NOT modify existing role unnecessarily
    //    - create normal Kambata auth session/JWT
    if (
      tgUser &&
      (
        (googleUser && tgUser._id.equals(googleUser._id)) ||
        tgUser.googleId === sub ||
        tgUser.email === normalizedEmail ||
        (tgUser.authProvider === "telegram" && tgUser.email.endsWith("@telegram.kambata.local") && !googleUser)
      )
    ) {
      user = tgUser;
      if (user.isBlocked || (user.suspendedUntil && user.suspendedUntil > Date.now())) {
        return res.status(403).json({ message: "Account is suspended." });
      }

      // Safe update of Google profile data on the existing user document
      if (!user.googleId) user.googleId = sub;
      if (!user.isEmailVerified) user.isEmailVerified = true;
      if (picture && !user.profilePicture) user.profilePicture = picture;

      // If user was a telegram placeholder, upgrade email and authProvider to verified Google
      if (user.authProvider === "telegram" && user.email.endsWith("@telegram.kambata.local")) {
        user.email = normalizedEmail;
        user.authProvider = "google";
        if (name && (!user.name || user.name === "Telegram User")) {
          user.name = name;
        }
      }

      await user.save();
      logger.info(`[Handoff] Reused existing Telegram user (${user._id}) for Google login: ${user.email}`);

    } else if (tgUser && googleUser && !tgUser._id.equals(googleUser._id)) {
      // If tgUser is an auto-generated Telegram bot placeholder (e.g. tg_<id>@telegram.kambata.local),
      // the user is logging in with their real Google account. We safely transfer the telegramId to the real Google account!
      if (tgUser.authProvider === "telegram" || tgUser.email.endsWith("@telegram.kambata.local")) {
        // Unlink telegramId from the placeholder first to maintain uniqueness
        await User.updateOne(
          { _id: tgUser._id },
          { $unset: { telegramId: 1, telegramUsername: 1 } }
        );

        user = googleUser;
        if (user.isBlocked || (user.suspendedUntil && user.suspendedUntil > Date.now())) {
          return res.status(403).json({ message: "Account is suspended." });
        }

        user.telegramId = telegramId;
        if (!user.googleId) user.googleId = sub;
        if (picture && !user.profilePicture) user.profilePicture = picture;
        await user.save();
        logger.info(`[Handoff] Successfully linked existing Google user (${user.email}) to Telegram ID: ${telegramId} (upgraded from bot placeholder)`);
      } else {
        // Both are separate real accounts with actual email addresses!
        logger.warn(`[Handoff] Separate accounts detected for Telegram ID ${telegramId} (${tgUser.email}) and Google (${googleUser.email})`);
        return res.status(409).json({
          message: "This Telegram account is already linked to another Kambata Travel account. Please unlink it or sign in with your linked account.",
          code: "ACCOUNT_ALREADY_LINKED",
          telegramId,
        });
      }

    } else if (tgUser && !googleUser && !tgUser.email.endsWith("@telegram.kambata.local")) {
      // tgUser has a different verified email already, and this is a different Google account
      logger.warn(`[Handoff] Telegram user ${telegramId} has email ${tgUser.email}, but attempted Google login with ${normalizedEmail}`);
      return res.status(409).json({
        message: "This Telegram account is already associated with an email address. Account linking required.",
        code: "ACCOUNT_LINKING_REQUIRED",
        telegramId,
      });

    } else if (!tgUser && googleUser) {
      // Google account exists, Telegram account is new (no user has this telegramId)
      user = googleUser;
      if (user.isBlocked || (user.suspendedUntil && user.suspendedUntil > Date.now())) {
        return res.status(403).json({ message: "Account is suspended." });
      }

      if (user.telegramId && user.telegramId !== telegramId) {
        return res.status(409).json({
          message: "This Kambata Travel account is already linked to a different Telegram account.",
          code: "ACCOUNT_ALREADY_LINKED",
        });
      }

      // Safely link telegramId since no user holds this telegramId
      if (telegramId && !user.telegramId) {
        user.telegramId = telegramId;
      }
      if (!user.googleId) user.googleId = sub;
      if (picture && !user.profilePicture) user.profilePicture = picture;

      await user.save();
      logger.info(`[Handoff] Linked Google user (${user._id}) to Telegram ID: ${telegramId}`);

    } else {
      // 7. If neither account exists:
      //    - require Explorer/Traveler or Local Guide selection
      //    - create exactly one User document
      //    - never attempt to create a second user with the same telegramId
      const selectedRole = role && ["user", "guide"].includes(role) ? role : "user";
      const userPayload = {
        name: name || "Explorer",
        email: normalizedEmail,
        googleId: sub,
        authProvider: "google",
        role: selectedRole,
        isEmailVerified: true,
        profilePicture: picture,
      };

      if (telegramId) {
        userPayload.telegramId = telegramId;
      }
      if (selectedRole === "guide") {
        userPayload.guideStatus = "none";
      }

      user = await User.create(userPayload);
      if (selectedRole === "guide") {
        await Guide.create({ user: user._id });
      }
      logger.info(`[Handoff] Created single new user (${user._id}) via Google-Telegram: ${user.email} as ${user.role}`);
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
