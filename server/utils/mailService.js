const nodemailer = require("nodemailer");
const logger = require("./logger");

/**
 * Professional Mail Service
 * Wraps nodemailer to provide secure, consistent email delivery.
 */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Kambata Travel" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`);
    // Non-blocking failure: Log error but don't break the request
    return null;
  }
};

module.exports = { sendEmail };
