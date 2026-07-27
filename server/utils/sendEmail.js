const { Resend } = require("resend");

const sendEmail = async (options) => {
  if (!process.env.RESEND_API_KEY) {
    console.log("\n⚠️ [WARNING]: RESEND_API_KEY not found in .env");
    console.log("Mocking email delivery instead of failing.");
    console.log("-----------------------------------------");
    console.log(`To: ${options.email || options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`OTP: ${options.otp || "N/A"}`);
    console.log("-----------------------------------------\n");
    return;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const logoUrl = "https://res.cloudinary.com/dzf4st3t2/image/upload/v1777659922/kambata-travel/assets/picsvg_download_psbhbc.png";
    const year = new Date().getFullYear();
    let emailBodyHtml = "";

    if (options.html) {
      emailBodyHtml = options.html;
    } else if (options.otp) {
      emailBodyHtml = `
        <table width="600" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color: #ffffff; width: 100%; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #E5E7EB;">
          <tr>
            <td align="center" bgcolor="#FDFCF0" style="background-color: #FDFCF0; padding: 40px 20px 20px; border-bottom: 2px solid #F3F4F6;">
              <img src="${logoUrl}" alt="Kambata Travel" width="auto" height="60" style="display: block; height: 60px; max-width: 200px; border: 0;" />
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 40px 40px 10px;">
              <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 700;">Secure Your Account</h2>
              <p style="margin: 0 auto 35px; color: #4B5563; font-size: 16px; font-weight: 600; line-height: 1.6; max-width: 450px;">
                You have initiated a request to verify your email. Please use the secure authorization code below to complete your setup.
              </p>
            </td>
          </tr>
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
          <tr>
            <td align="center" bgcolor="#1F2937" style="background-color: #1F2937; padding: 40px 30px;">
              <p style="margin: 0 0 10px; color: #ffffff; font-size: 16px; font-weight: 700; letter-spacing: 1px;">KAMBATA TRAVEL</p>
              <p style="margin: 0 0 10px; color: #9CA3AF; font-size: 13px; line-height: 1.6;">Connecting you to the heart of the highlands.</p>
              <p style="margin: 0 0 10px; color: #9CA3AF; font-size: 13px; line-height: 1.6;">If you didn't request this email, please ignore it.</p>
              <p style="margin: 0; color: #6B7280; font-size: 11px;">&copy; ${year} Kambata Travel. All rights reserved.</p>
            </td>
          </tr>
        </table>
      `;
    } else {
      emailBodyHtml = `
        <table width="600" border="0" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color: #ffffff; width: 100%; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #E5E7EB;">
          <tr>
            <td align="center" bgcolor="#FDFCF0" style="background-color: #FDFCF0; padding: 40px 20px 20px; border-bottom: 2px solid #F3F4F6;">
              <img src="${logoUrl}" alt="Kambata Travel" width="auto" height="60" style="display: block; height: 60px; max-width: 200px; border: 0;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #111827; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">${options.subject}</h2>
              <div style="margin: 0; color: #374151; font-size: 16px; font-weight: 400; line-height: 1.7;">
                ${options.message ? options.message.replace(/\n/g, '<br>') : ''}
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" bgcolor="#F9FAFB" style="background-color: #F9FAFB; padding: 30px; border-top: 1px solid #E5E7EB;">
              <p style="margin: 0 0 10px; color: #1F2937; font-size: 14px; font-weight: 600; letter-spacing: 1px;">KAMBATA TRAVEL</p>
              <p style="margin: 0; color: #9CA3AF; font-size: 11px;">&copy; ${year} Kambata Travel. All rights reserved.</p>
            </td>
          </tr>
        </table>
      `;
    }

    const finalHtml = `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <body style="margin: 0; padding: 0; background-color: #F3F4F6; -webkit-font-smoothing: antialiased; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
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

    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || "Kambata Travel <onboarding@resend.dev>",
      to: options.email || options.to,
      subject: options.subject,
      html: finalHtml,
      attachments: options.attachments || [],
    });

    console.log("Resend Message sent:", data);
  } catch (error) {
    console.error("Error sending email via Resend:", error.message);
    throw error;
  }
};

module.exports = sendEmail;
