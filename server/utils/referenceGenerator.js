const crypto = require("crypto");

/**
 * Generates a human-readable reference number.
 * Format: PREFIX-YYYY-XXXXX
 * Example: TOUR-2026-00125
 * @param {string} prefix - The prefix (e.g., 'TOUR', 'HOTEL', 'PKG')
 * @returns {string} The formatted reference number
 */
const generateReferenceNumber = async (prefix) => {
  const year = new Date().getFullYear();
  // Generate a random 5-digit string. 
  // In a massive scale system, this would use an auto-incrementing sequence in DB, 
  // but random hex or digits is fine for standard uniqueness.
  const randomStr = crypto.randomBytes(3).toString("hex").toUpperCase(); 
  return `${prefix}-${year}-${randomStr}`;
};

module.exports = { generateReferenceNumber };
