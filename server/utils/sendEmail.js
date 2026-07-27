const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // Mock email delivery for local development if SMTP is not configured
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    console.log("\n⚠️ [WARNING]: SMTP Credentials not found in .env");
    console.log("Mocking email delivery instead of failing.");
    console.log("-----------------------------------------");
    console.log(`To: ${options.email || options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`OTP: ${options.otp}`);
    console.log("-----------------------------------------\n");
    return; // Resolve successfully without actually sending
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const logoUrl = "https://res.cloudinary.com/dzf4st3t2/image/upload/v1777659922/kambata-travel/assets/picsvg_download_psbhbc.png";
    const year = new Date().getFullYear();

    let emailBodyHtml = "";

    if (options.html) {
      emailBodyHtml = options.html;
    } else if (options.otp) {
      emailBodyHtml = `
        <!-- Main Container Table -->
        <table width="600" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color: #ffffff; width: 100%; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #E5E7EB;">
          <!-- Header -->
          <tr>
            <td align="center" bgcolor="#FDFCF0" style="background-color: #FDFCF0; padding: 40px 20px 20px; border-bottom: 2px solid #F3F4F6;">
              <img src="${logoUrl}" alt="Kambata Travel" width="auto" height="60" style="display: block; height: 60px; max-width: 200px; border: 0;" />
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td align="center" style="padding: 40px 40px 10px;">
              <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700;">Secure Your Account</h2>
              <p style="margin: 0 auto 35px; color: #4B5563; font-size: 16px; font-weight: 600; line-height: 1.6; max-width: 450px;">
                You have initiated a request to verify your email. Please use the secure authorization code below to complete your setup.
              </p>
            </td>
          </tr>
          <!-- OTP Box -->
          <tr>
            <td align="center" style="padding: 0 40px 35px;">
              <table border="0" cellpadding="0" cellspacing="0" bgcolor="#F9FAFB" style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; width: 100%; max-width: 320px;">
                <tr>
                  <td align="center" style="padding: 25px 20px;">
                    <span style="display: block; color: #6B7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 12px;">Verification Code</span>
                    <p style="margin: 0; color: #1A331B; font-size: 42px; font-weight: 700; letter-spacing: 12px; padding-left: 12px;">${options.otp}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Security Warning -->
          <tr>
            <td align="center" style="padding: 0 40px 40px;">
              <table border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFBEB" style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; border-radius: 0 4px 4px 0; width: 100%;">
                <tr>
                  <td align="left" style="padding: 20px;">
                    <p style="margin: 0 0 8px; color: #B45309; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Security Notice</p>
                    <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.5;">This code expires in 15 minutes. Never share this code with anyone. Our staff will never ask for your password or OTP.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" bgcolor="#1F2937" style="background-color: #1F2937; padding: 40px 30px;">
              <p style="margin: 0 0 10px; color: #ffffff; font-size: 16px; font-weight: 700; letter-spacing: 1px;">KAMBATA TRAVEL</p>
              <p style="margin: 0 0 10px; color: #9CA3AF; font-size: 13px; line-height: 1.6;">Connecting you to the heart of the highlands.</p>
              <!-- Divider -->
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 20px auto; width: 100%; max-width: 200px;">
                <tr><td height="1" bgcolor="#374151" style="font-size: 1px; line-height: 1px;">&nbsp;</td></tr>
              </table>
              <p style="margin: 0 0 10px; color: #9CA3AF; font-size: 13px; line-height: 1.6;">If you didn't request this email, please ignore it.</p>
              <p style="margin: 0; color: #6B7280; font-size: 11px;">&copy; ${year} Kambata Travel. All rights reserved.</p>
            </td>
          </tr>
        </table>
      `;
    } else {
      emailBodyHtml = `
        <!-- Main Container Table -->
        <table width="600" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color: #ffffff; width: 100%; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #E5E7EB;">
          <!-- Header -->
          <tr>
            <td align="center" bgcolor="#FDFCF0" style="background-color: #FDFCF0; padding: 40px 20px 20px; border-bottom: 2px solid #F3F4F6;">
              <img src="${logoUrl}" alt="Kambata Travel" width="auto" height="60" style="display: block; height: 60px; max-width: 200px; border: 0;" />
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #111827; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">${options.subject}</h2>
              <div style="margin: 0; color: #374151; font-size: 16px; font-weight: 400; line-height: 1.7;">
                ${options.message.replace(/\n/g, '<br>')}
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" bgcolor="#F9FAFB" style="background-color: #F9FAFB; padding: 30px; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 10px; color: #1F2937; font-size: 14px; font-weight: 600; letter-spacing: 1px;">KAMBATA TRAVEL</p>
              <p style="margin: 0 0 15px; color: #6B7280; font-size: 13px; line-height: 1.6;">Connecting you to the heart of the highlands.</p>
              <p style="margin: 0; color: #9CA3AF; font-size: 11px;">&copy; ${year} Kambata Travel. All rights reserved.</p>
            </td>
          </tr>
        </table>
      `;
    }

    const finalHtml = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${options.subject || 'Kambata Travel'}</title>
        <!--[if mso]>
        <style type="text/css">
          table {border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;}
          table, td, p, span, a {font-family: Arial, Helvetica, sans-serif !important;}
        </style>
        <![endif]-->
      </head>
      <body style="margin: 0; padding: 0; background-color: #F3F4F6; -webkit-font-smoothing: antialiased; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <!-- Outer Wrapper Table -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#F3F4F6" style="background-color: #F3F4F6; width: 100%; table-layout: fixed;">
          <tr>
            <td align="center" style="padding: 40px 15px;">
              ${emailBodyHtml}
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const message = {
      from: process.env.EMAIL_FROM || `"Kambata Travel" <noreply@kambatatravel.com>`,
      to: options.email || options.to,
      subject: options.subject,
      text: options.message,
      attachments: options.attachments || [],
      html: finalHtml,
    };

    const info = await transporter.sendMail(message);
    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email via Nodemailer:", error.message);
    throw error; // Re-throw so the controller knows it failed
  }
};

module.exports = sendEmail;
