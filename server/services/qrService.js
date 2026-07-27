"use strict";

const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const getSecretKey = () => {
  return process.env.JWT_SECRET || "fallback_super_secret_key_32_bytes";
};

/**
 * Hashes a raw token (the JWT) for secure DB matching.
 */
const hashToken = (rawToken) => {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
};

/**
 * Generates the secure JWT payload and DB fields.
 * Call this upon payment confirmation.
 */
const generateQRData = (bookingId, bookingType, generatedAt, expiresAt, extraData = {}) => {
  const nonce = crypto.randomBytes(32).toString("hex");

  const payload = {
    bookingId: bookingId.toString(),
    bookingType,
    nonce,
    issuedAt: generatedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    travelerId: extraData.travelerId?.toString(),
    scheduleId: extraData.scheduleId?.toString(),
    guideId: extraData.guideId?.toString(),
    bookingCode: extraData.bookingCode,
    bookingSource: extraData.bookingSource,
  };

  const token = jwt.sign(payload, getSecretKey(), { noTimestamp: true });
  const qrTokenHash = hashToken(token);

  return {
    qrNonce: nonce,
    qrTokenHash,
    token, // We don't store this token, but we might return it
  };
};

/**
 * Reconstructs the exact JWT dynamically for the dashboard without storing the token itself.
 */
const reconstructJWT = (bookingId, bookingType, nonce, generatedAt, expiresAt, extraData = {}) => {
  const payload = {
    bookingId: bookingId.toString(),
    bookingType,
    nonce,
    issuedAt: generatedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    travelerId: extraData.travelerId?.toString(),
    scheduleId: extraData.scheduleId?.toString(),
    guideId: extraData.guideId?.toString(),
    bookingCode: extraData.bookingCode,
    bookingSource: extraData.bookingSource,
  };
  return jwt.sign(payload, getSecretKey(), { noTimestamp: true });
};

/**
 * Verifies the JWT signature
 */
const verifyJWTSignature = (token) => {
  try {
    return jwt.verify(token, getSecretKey(), { ignoreExpiration: true }); // We'll manually check expiration later
  } catch (err) {
    return null;
  }
};

module.exports = {
  generateQRData,
  hashToken,
  reconstructJWT,
  verifyJWTSignature,
};
