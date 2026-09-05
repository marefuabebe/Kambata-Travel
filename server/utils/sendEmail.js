const nodemailer = require('nodemailer');
const { buildPremiumEmail } = require('./emailTemplateBuilder');

let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: parseInt(process.env.EMAIL_PORT, 10) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
  });
}

const sendEmail = async (options) => {
  let finalHtml = "";

  if (options.html) {
    finalHtml = options.html;
  } else {
    let infoCards = [];
    if (options.otp) {
      infoCards.push({ title: "Verification Code", value: options.otp });
    }

    const subjectLower = (options.subject || "").toLowerCase();
    let type = "default";
    if (subjectLower.includes("welcome") || subjectLower.includes("verify")) type = "welcome";
    else if (subjectLower.includes("reset") || subjectLower.includes("password")) type = "forgot_password";
    else if (subjectLower.includes("booking") || subjectLower.includes("confirm")) type = "booking_confirmed";
    else if (subjectLower.includes("payment") || subjectLower.includes("receipt")) type = "payment_receipt";
    else if (subjectLower.includes("update") || subjectLower.includes("request")) type = "tour_update";
    else if (subjectLower.includes("remind") || subjectLower.includes("upcoming")) type = "tour_reminder";
    else if (subjectLower.includes("feedback") || subjectLower.includes("review")) type = "feedback";
    else if (subjectLower.includes("assign") || subjectLower.includes("guide")) type = "guide_assignment";

    finalHtml = buildPremiumEmail({
      type: type,
      title: options.subject || "Notification",
      greeting: options.name ? `Hello ${options.name},` : undefined,
      bodyLines: options.message ? options.message.split('\n') : [],
      infoCards: infoCards,
      bookingSummary: options.bookingSummary,
    });
  }

  const recipient = options.email || options.to;

  // 1. Primary path: Nodemailer SMTP (supports attachments like PDF receipts)
  if (transporter) {
    try {
      console.log(`[EMAIL] Attempting delivery via Gmail SMTP to: ${recipient}`);
      const mailOptions = {
        from: process.env.EMAIL_FROM || `"Kambata Travel" <${process.env.EMAIL_USER}>`,
        to: recipient,
        subject: options.subject,
        html: finalHtml,
      };

      if (options.attachments && Array.isArray(options.attachments) && options.attachments.length > 0) {
        mailOptions.attachments = options.attachments;
      }

      await transporter.sendMail(mailOptions);
      console.log(`[EMAIL] SUCCESS! Email (with attachments: ${options.attachments?.length || 0}) sent via SMTP.`);
      return;
    } catch (smtpErr) {
      console.warn(`[EMAIL] SMTP delivery failed (${smtpErr.message}). Falling back to Google Apps Script proxy...`);
    }
  }

  // 2. Fallback path: Google Apps Script HTTP proxy
  try {
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby6uIUKlFL1dA1X5PHdffgk0e7bZCAHtPgxPV3Hc_d3X5zxd-T4dNrMImu0q5bIwK0v/exec";
    console.log(`[EMAIL] Attempting to send via Google Apps Script to: ${recipient}`);

    const payload = JSON.stringify({
      token: "kambata-secret-12345",
      to: recipient,
      subject: options.subject,
      html: finalHtml
    });

    const https = require('https');
    const url = require('url');

    const makeRequest = (requestUrl, postData) => {
      return new Promise((resolve, reject) => {
        const parsedUrl = new URL(requestUrl);
        const requestOptions = {
          hostname: parsedUrl.hostname,
          path: parsedUrl.pathname + parsedUrl.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const req = https.request(requestOptions, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            makeRequest(res.headers.location, postData).then(resolve).catch(reject);
            return;
          }

          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve({ raw: data });
            }
          });
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
      });
    };

    const result = await makeRequest(GOOGLE_SCRIPT_URL, payload);
    if (result.error) {
      throw new Error(result.error);
    }

    console.log(`[EMAIL] SUCCESS! Google Apps Script confirmed delivery.`);
  } catch (gasErr) {
    console.error(`[EMAIL] FAILED via Google Apps Script:`, gasErr.message);
    throw gasErr;
  }
};

module.exports = sendEmail;
