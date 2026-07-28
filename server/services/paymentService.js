const axios = require("axios");
const logger = require("../utils/logger");

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
const CHAPA_BASE_URL = process.env.CHAPA_BASE_URL;

/**
 * Initialize a payment with Chapa
 * @param {Object} booking 
 * @param {Object} user 
 * @returns {Promise<Object>}
 */
const initializePayment = async (booking, user) => {
  try {
    const payload = {
      amount: booking.totalPrice.toString(),
      currency: "ETB",
      email: user.email,
      first_name: user.name.split(" ")[0] || "Customer",
      last_name: user.name.split(" ")[1] || "Kambata",
      tx_ref: booking.tx_ref,
      callback_url: `${process.env.BACKEND_URL || process.env.APP_BACKEND_URL || "http://localhost:5000"}/api/payments/webhook`,
      return_url: `${process.env.FRONTEND_URL || process.env.APP_FRONTEND_URL || "http://localhost:3000"}/payment-callback?trx_ref=${booking.tx_ref}`,
      "customization[title]": "Kambata Travel Booking",
      "customization[description]": `Payment for booking ${booking._id}`,
    };

    const response = await axios.post(
      `${CHAPA_BASE_URL}/transaction/initialize`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("CHAPA RESPONSE:", response.data);
    return response.data;
  } catch (error) {
    logger.error("Chapa Initialization Error:", error.response?.data || error.message);
    throw new Error("Failed to initialize payment gateway");
  }
};

/**
 * Verify a transaction status with Chapa
 * @param {string} tx_ref 
 * @returns {Promise<Object>}
 */
const verifyTransaction = async (tx_ref) => {
  if (process.env.NODE_ENV === "development") {
    logger.info(`[MOCK] Bypassing Chapa verify for local testing: ${tx_ref}`);
    return { status: "success", data: { status: "success", reference: tx_ref } };
  }

  try {
    const response = await axios.get(
      `${CHAPA_BASE_URL}/transaction/verify/${tx_ref}`,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    logger.error("Chapa Verification Error:", error.response?.data || error.message);
    throw new Error("Failed to verify transaction");
  }
};

/**
 * Issue a refund via Chapa for a paid booking
 * @param {string} tx_ref - Original transaction reference
 * @param {Object} options - { reason, amount }
 */
const refundTransaction = async (tx_ref, options = {}) => {
  if (process.env.NODE_ENV === "development") {
    logger.info(`[MOCK] Bypassing Chapa refund for local testing: ${tx_ref}`);
    return { status: "success", message: "Mock refund successful", data: {} };
  }

  try {
    const params = new URLSearchParams();
    if (options.reason) params.append("reason", options.reason);
    if (options.amount) params.append("amount", String(options.amount));
    if (options.reference) params.append("reference", options.reference);

    const response = await axios.post(
      `${CHAPA_BASE_URL}/refund/${tx_ref}`,
      params,
      {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data;
  } catch (error) {
    logger.error("Chapa Refund Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to process refund via Chapa");
  }
};

module.exports = {
  initializePayment,
  verifyTransaction,
  refundTransaction,
};
