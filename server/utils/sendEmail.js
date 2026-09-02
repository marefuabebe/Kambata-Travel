const { buildPremiumEmail } = require('./emailTemplateBuilder');

const sendEmail = async (options) => {
  try {
    let finalHtml = "";

    if (options.html) {
      // If a full HTML string was already provided (e.g. from authController using buildPremiumEmail), use it directly.
      finalHtml = options.html;
    } else {
      // Automatically convert legacy email calls to the new premium template
      let infoCards = [];
      if (options.otp) {
        infoCards.push({ title: "Verification Code", value: options.otp });
      }

      // Try to intelligently guess the email type based on the subject
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
        bodyLines: options.message ? options.message.split('\\n') : [],
        infoCards: infoCards,
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // Google Apps Script HTTP Proxy
    // Since Render blocks outbound SMTP and Resend requires a verified
    // custom domain, the only free way to send emails using a standard
    // @gmail.com address from Render is via an HTTP proxy like GAS.
    // ═══════════════════════════════════════════════════════════════
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby6uIUKlFL1dA1X5PHdffgk0e7bZCAHtPgxPV3Hc_d3X5zxd-T4dNrMImu0q5bIwK0v/exec";
    const recipient = options.email || options.to;

    console.log(`[EMAIL] Attempting to send via Google Apps Script...`);
    console.log(`[EMAIL] To: ${recipient}`);

    const payload = JSON.stringify({
      token: "kambata-secret-12345",
      to: recipient,
      subject: options.subject,
      html: finalHtml
    });

    const https = require('https');
    const url = require('url');
    
    // We need to handle HTTP 302 redirects because Google Apps Script always redirects POST requests
    const makeRequest = (requestUrl, postData) => {
      return new Promise((resolve, reject) => {
        const parsedUrl = url.parse(requestUrl);
        const requestOptions = {
          hostname: parsedUrl.hostname,
          path: parsedUrl.path,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const req = https.request(requestOptions, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            // Handle redirect
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
  } catch (error) {
    console.error(`[EMAIL] FAILED via Google Apps Script:`, error.message);
    throw error;
  }
};

module.exports = sendEmail;
