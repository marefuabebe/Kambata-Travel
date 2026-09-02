/**
 * emailTemplateBuilder.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Kambata Travel — Clean, Minimal, Modern Email Framework
 * Accurately implements the provided mockup design.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const LOGO_URL = "https://res.cloudinary.com/dzf4st3t2/image/upload/v1777659922/kambata-travel/assets/picsvg_download_psbhbc.png";

const BRAND = {
  green: "#166534",      // Dark green for buttons
  greenLight: "#F0FDF4", // Pale green for top background
  dark: "#111827",       // Text primary
  gray: "#4B5563",       // Text secondary
  grayLight: "#9CA3AF",  // Muted text
  border: "#E5E7EB",     // Card border
  bg: "#FFFFFF",         // Global background
  footerBg: "#F9FAFB",   // Footer and OTP container background
};

// Stable image URLs for social icons
const SOCIAL_ICONS = {
  facebook: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Facebook_logo_%28square%29.png/240px-Facebook_logo_%28square%29.png",
  instagram: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/240px-Instagram_logo_2016.svg.png",
  youtube: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/240px-YouTube_full-color_icon_%282017%29.svg.png",
  x: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/X_logo_2023.svg/240px-X_logo_2023.svg.png"
};

// Fallback high-quality emojis for the header icons since SVGs don't render in Gmail
const ICONS = {
  welcome: "✉️",
  forgot_password: "🔒",
  booking_confirmed: "💼",
  ticket: "🎫",
  payment_receipt: "🧾",
  tour_update: "💬",
  tour_reminder: "🔔",
  feedback: "⭐",
  guide_assignment: "👤",
  default: "✉️",
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

  // 1. Render OTP Blocks if present (Matching the gray container mockup)
  if (otpCard) {
    const digits = String(otpCard.value).split("");
    const digitCells = digits.map(d => `
      <td style="width: 45px; height: 55px; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; text-align: center; vertical-align: middle; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 24px; font-weight: bold; color: ${BRAND.dark};">
        ${d}
      </td>
    `).join('<td style="width: 10px;"></td>');

    dynamicContentHtml += `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 25px 0;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" border="0" bgcolor="${BRAND.footerBg}" style="background-color: ${BRAND.footerBg}; padding: 15px 20px; border-radius: 12px; border: 1px solid ${BRAND.border};">
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
          <td align="left" style="padding: 14px 0; border-bottom: ${isLast ? 'none' : '1px solid ' + BRAND.border}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: ${BRAND.gray};">
            ${card.title}
          </td>
          <td align="right" style="padding: 14px 0; border-bottom: ${isLast ? 'none' : '1px solid ' + BRAND.border}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: bold; color: ${BRAND.dark};">
            ${card.value}
          </td>
        </tr>
      `;
    }).join("");

    dynamicContentHtml += `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 25px 0 35px 0; border-top: 1px solid ${BRAND.border}; border-bottom: 1px solid ${BRAND.border};">
        ${tableRows}
      </table>
    `;
  }

  // 3. Render Button
  let buttonHtml = "";
  if (cta) {
    buttonHtml = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 10px; margin-bottom: 30px;">
        <tr>
          <td align="center">
            <a href="${cta.link}" style="display: inline-block; background-color: ${BRAND.green}; color: #FFFFFF; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: bold; text-decoration: none; padding: 14px 36px; border-radius: 6px;">
              ${cta.text}
            </a>
          </td>
        </tr>
      </table>
    `;
  }

  const bodyHtml = bodyLines.map(line => `
    <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: ${BRAND.gray}; margin: 0 0 16px 0; text-align: center; max-width: 450px; margin-left: auto; margin-right: auto;">
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
          <td align="center" style="padding: 40px 15px;">
            
            <!-- Global Header outside the card -->
            <table width="100%" max-width="500" cellpadding="0" cellspacing="0" border="0" style="max-width: 500px; margin-bottom: 25px;">
              <tr>
                <td align="left" valign="middle">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding-right: 12px;">
                        <img src="${LOGO_URL}" alt="Kambata Travel" height="24" style="display: block; height: 24px;" />
                      </td>
                      <td>
                        <span style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: bold; color: ${BRAND.green}; letter-spacing: 1px; text-transform: uppercase;">KAMBATA</span>
                        <br/>
                        <span style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10px; font-weight: bold; color: ${BRAND.grayLight}; letter-spacing: 2.5px; text-transform: uppercase;">TRAVEL</span>
                      </td>
                    </tr>
                  </table>
                </td>
                <td align="right" valign="middle" style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: ${BRAND.grayLight};">
                  Discover. Experience. Kambata.
                </td>
              </tr>
            </table>

            <!-- Main Card -->
            <table width="100%" max-width="500" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="max-width: 500px; border-radius: 12px; overflow: hidden; border: 1px solid ${BRAND.border}; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
              
              <!-- Top Light Green Section with Icon and Title -->
              <tr>
                <td align="center" bgcolor="${BRAND.greenLight}" style="background-color: ${BRAND.greenLight}; padding: 45px 20px 35px 20px;">
                  <div style="background-color: ${BRAND.green}; width: 72px; height: 72px; border-radius: 50%; display: inline-block; text-align: center; line-height: 72px; margin-bottom: 25px; font-size: 32px;">
                    ${getIcon(type)}
                  </div>
                  <h1 style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 22px; font-weight: bold; color: ${BRAND.dark}; margin: 0; text-align: center;">
                    ${title}
                  </h1>
                </td>
              </tr>

              <!-- Content Section -->
              <tr>
                <td align="center" style="padding: 35px 40px 10px 40px;">
                  
                  ${greeting ? `
                    <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: bold; color: ${BRAND.dark}; margin: 0 0 16px 0; text-align: center;">
                      ${greeting}
                    </p>
                  ` : ''}

                  ${bodyHtml}

                  ${dynamicContentHtml}

                  ${buttonHtml}

                </td>
              </tr>

              <!-- Footer Section (Gray Background) -->
              <tr>
                <td align="center" bgcolor="${BRAND.footerBg}" style="background-color: ${BRAND.footerBg}; padding: 30px 20px; border-top: 1px solid ${BRAND.border};">
                  <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: bold; color: ${BRAND.dark}; margin: 0 0 16px 0;">
                    Follow Us
                  </p>
                  <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                    <tr>
                      <td style="padding: 0 10px;">
                        <a href="#"><img src="${SOCIAL_ICONS.facebook}" alt="Facebook" width="24" height="24" style="display: block; width: 24px; height: 24px; opacity: 0.7;" /></a>
                      </td>
                      <td style="padding: 0 10px;">
                        <a href="#"><img src="${SOCIAL_ICONS.instagram}" alt="Instagram" width="24" height="24" style="display: block; width: 24px; height: 24px; opacity: 0.7;" /></a>
                      </td>
                      <td style="padding: 0 10px;">
                        <a href="#"><img src="${SOCIAL_ICONS.youtube}" alt="YouTube" width="24" height="24" style="display: block; width: 24px; height: 24px; opacity: 0.7;" /></a>
                      </td>
                      <td style="padding: 0 10px;">
                        <a href="#"><img src="${SOCIAL_ICONS.x}" alt="X" width="24" height="24" style="display: block; width: 24px; height: 24px; opacity: 0.7;" /></a>
                      </td>
                    </tr>
                  </table>
                  <p style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: ${BRAND.grayLight}; margin: 0;">
                    &copy; ${year} Kambata Travel. All rights reserved.
                  </p>
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
