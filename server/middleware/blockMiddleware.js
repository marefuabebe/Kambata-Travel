/**
 * In-memory IP blocking store.
 * Structure helps transition to Redis later.
 */
const blockedIPs = new Map();

/**
 * Middleware to check if an IP is blocked
 */
const checkIPBlock = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const blockExpiry = blockedIPs.get(ip);

  if (blockExpiry) {
    if (Date.now() < blockExpiry) {
      console.warn(`[SECURITY] Blocked request from ${ip}`);
      res.status(403);
      return next(new Error("Too many attempts. Your IP is temporarily blocked for 30 minutes."));
    } else {
      // Block expired, remove from memory
      blockedIPs.delete(ip);
    }
  }

  next();
};

/**
 * Utility to block an IP
 * @param {string} ip - IP address to block
 * @param {number} durationInMinutes - Duration of the block
 */
const blockIP = (ip, durationInMinutes = 30) => {
  const expiry = Date.now() + durationInMinutes * 60 * 1000;
  blockedIPs.set(ip, expiry);
  console.warn(`[SECURITY] IP ${ip} blocked for ${durationInMinutes} minutes`);
};

/**
 * Interface for counting failed attempts by IP
 * (This could also be moved to a DB/Redis later)
 */
const ipFailures = new Map();
const incrementIPFailure = (ip) => {
  const count = (ipFailures.get(ip) || 0) + 1;
  ipFailures.set(ip, count);

  if (count >= 10) { // Global IP threshold
    blockIP(ip);
    ipFailures.delete(ip); // Reset failure count after blocking
  }
};

const resetIPFailure = (ip) => {
  ipFailures.delete(ip);
};

module.exports = { checkIPBlock, blockIP, incrementIPFailure, resetIPFailure };
