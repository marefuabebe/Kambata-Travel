const User = require("../models/User");
const Guide = require("../models/Guide");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/mailService");
const { buildPremiumEmail } = require("../utils/emailTemplateBuilder");
const { incrementIPFailure, resetIPFailure } = require("../middleware/blockMiddleware");
const BlacklistedIP = require("../models/BlacklistedIP");
const { sendNotification } = require("../services/notificationService");
const logger = require("../utils/logger");

// Helper to check if user is blocked
const checkUserBlock = (user) => {
  if (user.isBlocked) return true;
  if (user.suspendedUntil && user.suspendedUntil > Date.now()) return true;
  if (user.blockedUntil && user.blockedUntil > Date.now()) return true;
  return false;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, password, role } = req.body;
    const email = req.body.email ? req.body.email.toLowerCase().trim() : "";

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error("Invalid registration details"); // Generic
    }

    // Role validation: Only allow user and guide roles during registration
    const finalRole = ["user", "guide"].includes(role) ? role : "user";

    // Generate Verification OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const bcrypt = require("bcryptjs");
    const hashedOTP = await bcrypt.hash(otp, 10);

    // Development Helper: Log OTP to terminal for easy local testing
    if (process.env.NODE_ENV !== "production") {
       console.log(`\n\n================================`);
       console.log(`[LOCAL DEV] Verification OTP for ${email}: ${otp}`);
       console.log(`================================\n\n`);
    }

    const userPayload = {
      name,
      email,
      password,
      role: finalRole,
      isEmailVerified: false,
      emailVerificationOTP: hashedOTP,
      emailVerificationExpires: Date.now() + 15 * 60 * 1000, // 15 mins expiry
    };

    if (finalRole === "guide") {
      userPayload.guideStatus = "none";
    }

    const user = await User.create(userPayload);

    if (user) {
      if (finalRole === "guide") {
        await Guide.create({ user: user._id });
      }
      logger.info(`User registered, verification pending: ${email} as ${finalRole}`, {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        eventType: "REGISTRATION_PENDING",
      });

      // Send Verification Email
      try {
        const frontendUrl = process.env.FRONTEND_URL || "https://kambata.travel";
        const emailHtml = buildPremiumEmail({
          type: "welcome",
          title: "Welcome to Kambata Travel!",
          icon: "🎉",
          accentColor: "#10B981",
          greeting: `Hello ${user.name},`,
          bodyLines: [
            "We are thrilled to have you join our community! Your gateway to exploring the authentic heart of Ethiopia is now open.",
            "To get started and unlock all features, please verify your email address using the secure code below."
          ],
          infoCards: [
            { title: "Verification Code", value: otp, iconEmoji: "🔐" }
          ],
          cta: {
            text: "Verify Your Email Now",
            link: `${frontendUrl}/verify-email?email=${encodeURIComponent(user.email)}`,
            color: "#10B981"
          }
        });

        sendEmail({
          to: user.email,
          subject: "Welcome to Kambata Travel - Verify Your Email",
          html: emailHtml,
        }).catch(err => logger.error(`Background email failed: ${err.message}`));
      } catch (emailError) {
        logger.error(`Failed to send verification email to ${email}: ${emailError.message}`);
        // We still return success but maybe log the error.
      }

      // STRICT BLOCK: Do not generate tokens or log the user in.
      res.status(201).json({
        success: true,
        message: "Registration successful. Please check your email to verify your account.",
        data: {
          email: user.email,
        }
      });
    } else {
      res.status(400);
      throw new Error("Invalid user data");
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { password } = req.body;
    const email = req.body.email ? req.body.email.toLowerCase().trim() : "";
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const user = await User.findOne({ email });

    if (!user) {
      incrementIPFailure(ip);
      logger.warn(`Failed login attempt: User not found (${email})`, { ip, userAgent, eventType: "LOGIN_FAILURE" });
      res.status(401);
      throw new Error("Invalid credentials");
    }

    // Check if user is blocked
    if (checkUserBlock(user)) {
      logger.warn(`Blocked login attempt for account: ${email}`, { ip, userAgent, eventType: "BLOCKED_LOGIN_ATTEMPT" });
      res.status(403);
      throw new Error("Account is temporarily locked. Please try again after 30 minutes.");
    }

    // STRICT BLOCK: Check Email Verification
    if (!user.isEmailVerified) {
      logger.warn(`Login blocked: Unverified email (${email})`, { ip, userAgent, eventType: "UNVERIFIED_LOGIN_ATTEMPT" });
      res.status(403);
      throw new Error("Please verify your email before accessing your account.");
    }

    if (await user.matchPassword(password)) {
      // Success: Reset tracking fields
      user.loginAttempts = 0;
      user.isBlocked = false;
      user.blockedUntil = undefined;
      await user.save();
      resetIPFailure(ip);

      logger.info(`User logged in: ${email}`, { ip, userAgent, eventType: "LOGIN_SUCCESS" });

      // Device Binding Logic for Guides
      if (user.role === "guide") {
        const deviceId = req.headers["x-device-id"] || "unknown_device_" + Date.now();
        const existingDevice = user.trustedDevices?.find(d => d.deviceId === deviceId);
        
        if (!existingDevice) {
          user.trustedDevices.push({
            deviceId,
            userAgent,
            deviceName: "Guide Device",
            lastSeenAt: Date.now(),
            ipHistory: [ip]
          });
          user.lastScannerDevice = deviceId;
          await user.save();
          
          await sendNotification(user._id, {
            type: "system",
            priority: "HIGH",
            message: "New guide device detected. If this wasn't you, reset your password.",
          });
          logger.info(`New device detected for guide ${email}: ${deviceId}`);
        } else {
          // Known device, just update history
          existingDevice.lastSeenAt = Date.now();
          if (!existingDevice.ipHistory.includes(ip)) {
            existingDevice.ipHistory.push(ip);
          }
          user.lastScannerDevice = deviceId;
          await user.save();
        }
      }

      const refreshToken = generateRefreshToken(user._id);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        guideStatus: user.guideStatus,
        schedulingDisabled: user.schedulingDisabled,
        accessToken: generateAccessToken(user._id),
      });
    } else {
      // Failure: Track attempts
      user.loginAttempts += 1;
      
      if (user.loginAttempts >= 5) {
        user.isBlocked = true;
        user.blockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min account lock
        
        // TRIGGER 24H IP BLACKLIST (Professional Sentinel Logic)
        const blockPeriod = 24 * 60 * 60 * 1000;
        await BlacklistedIP.create({
          ip,
          reason: `Brute force attempt on account: ${email}`,
          blockedUntil: new Date(Date.now() + blockPeriod)
        }).catch(err => logger.error(`Blacklist record creation failed for ${ip}: ${err.message}`));

        // Notify Admins
        const admins = await User.find({ role: "admin" });
        for (const admin of admins) {
          await sendNotification(admin._id, {
            type: "system",
            priority: "HIGH",
            message: `SECURITY ALERT: IP ${ip} has been auto-blacklisted for 24h after 5 failed logins on ${email}.`,
          });
        }

        logger.error(`Account locked & IP Blacklisted: ${email}`, { ip, userAgent, eventType: "ACCOUNT_LOCK_IP_BAN" });
      } else {
        logger.warn(`Failed login attempt for ${email}`, { ip, userAgent, eventType: "LOGIN_FAILURE", attempts: user.loginAttempts });
      }
      
      await user.save();
      incrementIPFailure(ip);

      res.status(401);
      throw new Error("Invalid credentials");
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshAccessToken = async (req, res, next) => {
  console.log(`[AUTH] refreshAccessToken invoked.`);
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      console.warn(`[AUTH] refreshAccessToken: No refreshToken cookie found.`);
      res.status(401);
      throw new Error("Not authorized");
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      console.warn(`[AUTH] refreshAccessToken: User not found.`);
      res.status(401);
      throw new Error("Not authorized");
    }

    const accessToken = generateAccessToken(user._id);
    console.log(`[AUTH] refreshAccessToken: Success.`);
    res.json({ accessToken });
  } catch (error) {
    console.error(`[AUTH] refreshAccessToken error.`);
    res.status(401);
    next(new Error("Not authorized"));
  }
};

// @desc    Forgot password - Generate OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const email = req.body.email ? req.body.email.toLowerCase().trim() : "";
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const user = await User.findOne({ email });

    if (!user) {
      res.status(200).json({ success: true, message: "If your email is registered, you will receive an OTP" });
      return;
    }

    // Check Cooldown (2 mins)
    if (user.lastOtpRequest && (Date.now() - user.lastOtpRequest < 2 * 60 * 1000)) {
      logger.warn(`OTP frequency limit: ${email}`, { ip, userAgent, eventType: "OTP_COOLDOWN_ACTIVE" });
      res.status(429);
      throw new Error("Please wait 2 minutes before requesting a new OTP");
    }

    // Check Window (3 requests per 15 mins)
    const windowElapsed = Date.now() - (user.otpRequestWindowStart || 0);
    if (windowElapsed > 15 * 60 * 1000) {
      user.otpRequestWindowStart = Date.now();
      user.otpRequestCount = 1;
    } else {
      user.otpRequestCount += 1;
      if (user.otpRequestCount > 3) {
        logger.error(`Suspicious OTP activity: ${email} (window limit reached)`, { ip, userAgent, eventType: "OTP_WINDOW_LIMIT" });
        res.status(429);
        throw new Error("Too many OTP requests. Please try again after 15 minutes.");
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const bcrypt = require("bcryptjs");
    const hashedOTP = await bcrypt.hash(otp, 10);

    user.resetPasswordOTP = hashedOTP;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    user.lastOtpRequest = Date.now();
    user.otpAttempts = 0;

    await user.save();

    try {
      const frontendUrl = process.env.FRONTEND_URL || "https://kambata.travel";
      const emailHtml = buildPremiumEmail({
        type: "welcome", // Can use the same SVG or add a "security" one. We'll use default which is a generic icon or we could use the welcome one. We'll just use "welcome" for now or "sos" for a lock? Actually we'll use "default".
        title: "Password Reset Request",
        icon: "🔒",
        accentColor: "#3B82F6", // Blue for security
        greeting: `Hello ${user.name},`,
        bodyLines: [
          "We received a request to reset the password associated with your Kambata Travel account.",
          "Please use the secure OTP code below to verify your identity and reset your password. This code will expire in 10 minutes.",
          "If you did not request this password reset, please ignore this email or contact support if you have concerns."
        ],
        infoCards: [
          { title: "Reset Code", value: otp, iconEmoji: "🔑" }
        ],
        cta: {
          text: "Reset Password",
          link: `${frontendUrl}/forgot-password?email=${encodeURIComponent(user.email)}`,
          color: "#3B82F6"
        }
      });

      sendEmail({
        to: user.email,
        subject: "Password Reset - Kambata Travel",
        html: emailHtml,
      }).catch(err => logger.error(`Forgot password email failed: ${err.message}`));

      logger.info(`OTP sent: ${email}`, { ip, userAgent, eventType: "OTP_SENT" });
      res.status(200).json({ success: true, message: "OTP sent to email" });
    } catch (error) {
      user.resetPasswordOTP = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      logger.error(`Email delivery focus: ${email}`, { ip, userAgent, error: error.message, eventType: "EMAIL_ERROR" });
      res.status(500);
      throw new Error("Could not send email. Please try again later.");
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const email = req.body.email ? req.body.email.toLowerCase().trim() : "";
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const user = await User.findOne({ email });

    if (!user || !user.resetPasswordOTP) {
      incrementIPFailure(ip);
      res.status(400);
      throw new Error("Invalid request");
    }

    if (user.resetPasswordExpires < Date.now()) {
      user.resetPasswordOTP = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      res.status(400);
      throw new Error("OTP has expired");
    }

    const bcrypt = require("bcryptjs");
    const isMatch = await bcrypt.compare(otp, user.resetPasswordOTP);

    if (isMatch) {
      logger.info(`OTP verified: ${email}`, { ip, userAgent, eventType: "OTP_VERIFIED" });
      res.status(200).json({ success: true, message: "OTP verified" });
    } else {
      user.otpAttempts += 1;
      if (user.otpAttempts >= 3) {
        user.resetPasswordOTP = undefined;
        user.resetPasswordExpires = undefined;
        logger.error(`OTP invalidated: ${email} (too many failed tries)`, { ip, userAgent, eventType: "OTP_BRUTE_FORCE_ATTEMPT" });
      } else {
        logger.warn(`Invalid OTP entered: ${email}`, { ip, userAgent, eventType: "OTP_INVALID", attempts: user.otpAttempts });
      }
      await user.save();
      incrementIPFailure(ip);

      res.status(400);
      throw new Error("Invalid OTP");
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password - Verify OTP & Update Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { otp, newPassword } = req.body;
    const email = req.body.email ? req.body.email.toLowerCase().trim() : "";
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const user = await User.findOne({
      email,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user || !user.resetPasswordOTP) {
      incrementIPFailure(ip);
      logger.warn(`Final reset failed: Invalid OTP sequence for ${email}`, { ip, userAgent, eventType: "PASSWORD_RESET_FAILURE" });
      res.status(400);
      throw new Error("Invalid or expired code");
    }

    const bcrypt = require("bcryptjs");
    const isOTPMatch = await bcrypt.compare(otp, user.resetPasswordOTP);

    if (!isOTPMatch) {
      incrementIPFailure(ip);
      logger.warn(`Final reset failed: OTP mismatch for ${email}`, { ip, userAgent, eventType: "PASSWORD_RESET_FAILURE" });
      res.status(400);
      throw new Error("Invalid or expired code");
    }

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    user.otpAttempts = 0;
    user.loginAttempts = 0;
    user.isBlocked = false;

    await user.save();
    resetIPFailure(ip);

    logger.info(`Password reset success: ${email}`, { ip, userAgent, eventType: "PASSWORD_RESET_SUCCESS" });
    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Email via OTP
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const email = req.body.email ? req.body.email.toLowerCase().trim() : "";
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];
    const bcrypt = require("bcryptjs");

    const user = await User.findOne({ email });

    if (!user) {
      incrementIPFailure(ip);
      res.status(400);
      throw new Error("Invalid request");
    }

    if (user.isEmailVerified) {
      res.status(400);
      throw new Error("Email is already verified.");
    }

    if (!user.emailVerificationOTP || user.emailVerificationExpires < Date.now()) {
      res.status(400);
      throw new Error("OTP has expired. Please request a new one.");
    }

    const isMatch = await bcrypt.compare(otp, user.emailVerificationOTP);

    if (isMatch) {
      user.isEmailVerified = true;
      user.emailVerificationOTP = undefined;
      user.emailVerificationExpires = undefined;

      if (user.role === "guide" && user.guideStatus === "none") {
        const existingGuide = await Guide.findOne({ user: user._id });
        if (!existingGuide) {
          await Guide.create({ user: user._id });
        }
      }

      await user.save();

      logger.info(`Email verified: ${email}`, { ip, userAgent, eventType: "EMAIL_VERIFIED" });
      res.status(200).json({ success: true, message: "Email verified successfully", data: null });
    } else {
      incrementIPFailure(ip);
      logger.warn(`Invalid verification OTP entered: ${email}`, { ip, userAgent, eventType: "EMAIL_OTP_INVALID" });
      res.status(400);
      throw new Error("Invalid OTP");
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Resend Verification OTP
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerificationOTP = async (req, res, next) => {
  try {
    const email = req.body.email ? req.body.email.toLowerCase().trim() : "";
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"];
    const bcrypt = require("bcryptjs");

    const user = await User.findOne({ email });

    if (!user) {
      res.status(200).json({ success: true, message: "If your email is registered, you will receive a new OTP." });
      return;
    }

    if (user.isEmailVerified) {
      res.status(400);
      throw new Error("Email is already verified.");
    }

    // Generate Verification OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOTP = await bcrypt.hash(otp, 10);

    // Development Helper: Log OTP to terminal for easy local testing
    if (process.env.NODE_ENV !== "production") {
       console.log(`\n\n================================`);
       console.log(`[LOCAL DEV] Resent Verification OTP for ${email}: ${otp}`);
       console.log(`================================\n\n`);
    }

    user.emailVerificationOTP = hashedOTP;
    user.emailVerificationExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    try {
      const frontendUrl = process.env.FRONTEND_URL || "https://kambata.travel";
      const emailHtml = buildPremiumEmail({
        type: "welcome",
        title: "Your New Verification Code",
        icon: "🔄",
        accentColor: "#10B981",
        greeting: `Hello ${user.name},`,
        bodyLines: [
          "You have requested a new email verification code for your Kambata Travel account.",
          "Please use the secure code below to verify your identity. This code will expire in 15 minutes."
        ],
        infoCards: [
          { title: "Verification Code", value: otp, iconEmoji: "🔐" }
        ],
        cta: {
          text: "Verify Your Email Now",
          link: `${frontendUrl}/verify-email?email=${encodeURIComponent(user.email)}`,
          color: "#10B981"
        }
      });

      sendEmail({
      to: user.email,
      subject: "Your New Verification Code - Kambata Travel",
      html: emailHtml,
    }).catch(err => logger.error(`Resend email failed: ${err.message}`));

      logger.info(`Verification OTP resent: ${email}`, { ip, userAgent, eventType: "EMAIL_OTP_RESENT" });
      res.status(200).json({ success: true, message: "New verification code sent." });
    } catch (error) {
      logger.error(`Failed to resend verification email to ${email}: ${error.message}`);
      res.status(500);
      throw new Error("Could not send email. Please try again later.");
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Admin-only login — isolated from the main site UI.
 * Uses the shared user store but rejects non-admin roles.
 */
const adminLogin = async (req, res, next) => {
  try {
    const { password } = req.body;
    const email = req.body.email ? req.body.email.toLowerCase().trim() : "";
    const user = await User.findOne({ email });

    if (!user || user.role !== "admin") {
      res.status(401);
      throw new Error("Invalid admin credentials");
    }

    if (user.isBlocked) {
      res.status(403);
      throw new Error("Admin account is blocked");
    }

    if (user.suspendedUntil && user.suspendedUntil > Date.now()) {
      res.status(403);
      throw new Error("Admin account is suspended");
    }

    if (!user.isEmailVerified) {
      res.status(403);
      throw new Error("Please verify your email before accessing the admin portal");
    }

    if (!(await user.matchPassword(password))) {
      res.status(401);
      throw new Error("Invalid admin credentials");
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      accessToken: generateAccessToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auth with Google
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res, next) => {
  try {
    const { token, role } = req.body;
    
    if (!token) {
      res.status(400);
      throw new Error("No Google token provided");
    }

    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client();

    // Verify the JWT credential returned by <GoogleLogin />
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: '167884286246-pae6qdcf9u587i1i961asqkjodd4els7.apps.googleusercontent.com'
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture, email_verified } = payload;

    if (!email_verified) {
      res.status(400);
      throw new Error("Google email not verified");
    }

    let user = await User.findOne({ email });

    if (user) {
      // User exists, check if blocked
      if (checkUserBlock(user)) {
        res.status(403);
        throw new Error("Account suspended or blocked");
      }
      
      // If they originally signed up via local, maybe link googleId?
      if (!user.googleId) {
        user.googleId = sub;
        await user.save();
      }

      // Generate token and login
      const refreshToken = generateRefreshToken(user._id);
      res.cookie("jwt", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      logger.info(`Successful Google login for user: ${user.email}`, {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        eventType: "LOGIN_SUCCESS",
      });

      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        guideStatus: user.guideStatus,
        profilePicture: user.profilePicture,
        isEmailVerified: user.isEmailVerified,
        accessToken: generateAccessToken(user._id),
      });
    }

    // New user
    const finalRole = ["user", "guide"].includes(role) ? role : "user";
    const userPayload = {
      name,
      email,
      googleId: sub,
      authProvider: 'google',
      role: finalRole,
      isEmailVerified: true, // Google verifies emails
      profilePicture: picture,
    };

    if (finalRole === "guide") {
      userPayload.guideStatus = "none";
    }

    user = await User.create(userPayload);
    
    if (finalRole === "guide") {
      await Guide.create({ user: user._id });
    }

    logger.info(`User registered via Google: ${email} as ${finalRole}`, {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      eventType: "REGISTRATION_SUCCESS",
    });

    const refreshToken = generateRefreshToken(user._id);
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      guideStatus: user.guideStatus,
      profilePicture: user.profilePicture,
      isEmailVerified: user.isEmailVerified,
      accessToken: generateAccessToken(user._id),
    });

  } catch (error) {
    logger.error(`Google auth failed: ${error.message}`);
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  forgotPassword,
  verifyOTP,
  resetPassword,
  verifyEmail,
  resendVerificationOTP,
  adminLogin,
  googleAuth,
};
