/**
 * emailTemplateBuilder.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Kambata Travel — Clean, Minimal, Modern Email Framework
 * Matches the requested design aesthetic: white cards, pale green header,
 * circular icons, elegant typography.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const LOGO_URL = "https://res.cloudinary.com/dzf4st3t2/image/upload/v1777659922/kambata-travel/assets/picsvg_download_psbhbc.png";

const BRAND = {
  green: "#166534",      // Dark green for buttons/icons
  greenLight: "#F0FDF4", // Pale green for top background
  dark: "#111827",       // Text primary
  gray: "#4B5563",       // Text secondary
  grayLight: "#9CA3AF",  // Muted text
  border: "#E5E7EB",     // Card border
  bg: "#FAFAFA",         // Global background
};

// SVG Icons for different email types
const ICONS = {
  welcome: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><path d="m16 19 2 2 4-4"/></svg>`,
  forgot_password: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  booking_confirmed: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`, // Used checkmark instead of suitcase for confirmed
  ticket: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>`,
  payment_receipt: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  tour_update: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>`,
  tour_reminder: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`,
  feedback: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  guide_assignment: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  default: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
};

const getIcon = (type) => ICONS[type] || ICONS.default;

const buildPremiumEmail = (options) => {
  const {
    type = "default",
    title = "Notification",
    greeting,
    bodyLines = [],
    infoCards = [],
    cta,
  } = options;

  // Determine if there is an OTP card (6 digits)
  const otpCard = infoCards.find(c => c.title && c.title.toLowerCase().includes("code") && String(c.value).length === 6);
  const regularCards = otpCard ? infoCards.filter(c => c !== otpCard) : infoCards;

  let dynamicContentHtml = "";

  // 1. Render OTP Blocks if present
  if (otpCard) {
    const digits = String(otpCard.value).split("");
    const digitCells = digits.map(d => `
      <td style="width: 45px; height: 55px; background-color: #FFFFFF; border: 1px solid #D1D5DB; border-radius: 8px; text-align: center; vertical-align: middle; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: bold; color: ${BRAND.dark};">
        ${d}
      </td>
    `).join('<td style="width: 8px;"></td>');

    dynamicContentHtml += `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>${digitCells}</tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top: 15px;">
            <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: ${BRAND.gray}; margin: 0;">
              This code will expire in 15 minutes.
            </p>
          </td>
        </tr>
      </table>
    `;
  }

  // 2. Render Key-Value Table if present (for Booking Confirmation, Receipt, etc.)
  if (regularCards.length > 0) {
    const tableRows = regularCards.map((card, index) => {
      const isLast = index === regularCards.length - 1;
      return `
        <tr>
          <td align="left" style="padding: 12px 0; border-bottom: ${isLast ? 'none' : '1px solid ' + BRAND.border}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: ${BRAND.gray};">
            ${card.title}
          </td>
          <td align="right" style="padding: 12px 0; border-bottom: ${isLast ? 'none' : '1px solid ' + BRAND.border}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; font-weight: bold; color: ${BRAND.dark};">
            ${card.value}
          </td>
        </tr>
      `;
    }).join("");

    dynamicContentHtml += `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 25px 0 35px 0;">
        ${tableRows}
      </table>
    `;
  }

  // 3. Render Button
  let buttonHtml = "";
  if (cta) {
    buttonHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 10px; margin-bottom: 25px;">
        <tr>
          <td align="center">
            <a href="${cta.link}" style="display: inline-block; background-color: ${BRAND.green}; color: #FFFFFF; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: bold; text-decoration: none; padding: 14px 32px; border-radius: 6px;">
              ${cta.text}
            </a>
          </td>
        </tr>
      </table>
    `;
  }

  const bodyHtml = bodyLines.map(line => `
    <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: ${BRAND.gray}; margin: 0 0 16px 0; text-align: center;">
      ${line}
    </p>
  `).join("");

  const year = new Date().getFullYear();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${BRAND.bg}; -webkit-font-smoothing: antialiased;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.bg}">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            
            <!-- Global Header outside the card -->
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; margin-bottom: 20px;">
              <tr>
                <td align="left" valign="middle">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding-right: 10px;">
                        <img src="${LOGO_URL}" alt="Logo" width="28" height="28" style="display: block; filter: brightness(0) invert(0.2) sepia(1) saturate(3) hue-rotate(110deg) brightness(0.6);" />
                      </td>
                      <td>
                        <span style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: bold; color: ${BRAND.green}; letter-spacing: 1px; text-transform: uppercase;">KAMBATA</span>
                        <br/>
                        <span style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: bold; color: ${BRAND.gray}; letter-spacing: 2px; text-transform: uppercase;">TRAVEL</span>
                      </td>
                    </tr>
                  </table>
                </td>
                <td align="right" valign="middle" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; color: ${BRAND.grayLight};">
                  Discover. Experience. Kambata.
                </td>
              </tr>
            </table>

            <!-- Main White Card -->
            <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="max-width: 600px; border-radius: 12px; overflow: hidden; border: 1px solid ${BRAND.border}; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
              
              <!-- Top Light Green Section with Icon and Title -->
              <tr>
                <td align="center" bgcolor="${BRAND.greenLight}" style="padding: 40px 20px 30px 20px;">
                  <div style="background-color: ${BRAND.green}; width: 64px; height: 64px; border-radius: 50%; display: inline-block; text-align: center; line-height: 64px; margin-bottom: 24px;">
                    <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" style="width:64px;height:64px;v-text-anchor:middle;" arcsize="50%" fillcolor="${BRAND.green}" strokecolor="${BRAND.green}" strokeweight="0"><v:textbox inset="0,0,0,0"><center><![endif]-->
                    <table width="100%" height="100%" cellpadding="0" cellspacing="0"><tr><td align="center" valign="middle">
                      ${getIcon(type)}
                    </td></tr></table>
                    <!--[if mso]></center></v:textbox></v:roundrect><![endif]-->
                  </div>
                  <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: bold; color: ${BRAND.dark}; margin: 0; text-align: center;">
                    ${title}
                  </h1>
                </td>
              </tr>

              <!-- Content Section -->
              <tr>
                <td align="center" style="padding: 30px 40px 40px 40px;">
                  
                  ${greeting ? `
                    <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: bold; color: ${BRAND.dark}; margin: 0 0 16px 0; text-align: center;">
                      ${greeting}
                    </p>
                  ` : ''}

                  ${bodyHtml}

                  ${dynamicContentHtml}

                  ${buttonHtml}

                  <!-- Social Links & Footer inside the card -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px; border-top: 1px solid ${BRAND.border}; padding-top: 30px;">
                    <tr>
                      <td align="center">
                        <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; font-weight: bold; color: ${BRAND.dark}; margin: 0 0 16px 0;">
                          Follow Us
                        </p>
                        <table cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="padding: 0 8px;">
                              <a href="#" style="text-decoration: none; color: ${BRAND.grayLight}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: bold;">f</a>
                            </td>
                            <td style="padding: 0 8px;">
                              <a href="#" style="text-decoration: none; color: ${BRAND.grayLight}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: bold;">ig</a>
                            </td>
                            <td style="padding: 0 8px;">
                              <a href="#" style="text-decoration: none; color: ${BRAND.grayLight}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: bold;">yt</a>
                            </td>
                            <td style="padding: 0 8px;">
                              <a href="#" style="text-decoration: none; color: ${BRAND.grayLight}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: bold;">x</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top: 25px;">
                        <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: ${BRAND.grayLight}; margin: 0;">
                          &copy; ${year} Kambata Travel. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

module.exports = { buildPremiumEmail };
