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

// Stable image URLs for social icons (using email-safe Icons8 PNGs)
const SOCIAL_ICONS = {
  facebook: "https://img.icons8.com/ios-filled/50/4B5563/facebook-new.png",
  instagram: "https://img.icons8.com/ios-filled/50/4B5563/instagram-new.png",
  youtube: "https://img.icons8.com/ios-filled/50/4B5563/youtube-play.png",
  x: "https://img.icons8.com/ios-filled/50/4B5563/twitter-x.png"
};

// High-quality white PNG icons for the header (email-safe)
const ICONS = {
  welcome: "https://img.icons8.com/ios-filled/50/FFFFFF/secured-letter--v1.png",
  forgot_password: "https://img.icons8.com/ios-filled/50/FFFFFF/lock.png",
  booking_confirmed: "https://img.icons8.com/ios-filled/50/FFFFFF/suitcase.png",
  ticket: "https://img.icons8.com/ios-filled/50/FFFFFF/two-tickets.png",
  payment_receipt: "https://img.icons8.com/ios-filled/50/FFFFFF/receipt.png",
  tour_update: "https://img.icons8.com/ios-filled/50/FFFFFF/chat.png",
  tour_reminder: "https://img.icons8.com/ios-filled/50/FFFFFF/bell.png",
  feedback: "https://img.icons8.com/ios-filled/50/FFFFFF/star--v1.png",
  guide_assignment: "https://img.icons8.com/ios-filled/50/FFFFFF/user.png",
  default: "https://img.icons8.com/ios-filled/50/FFFFFF/bell.png",
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

  let effectiveInfoCards = Array.isArray(options.infoCards) ? [...options.infoCards] : [];

  if (effectiveInfoCards.length === 0 && options.bookingSummary) {
    const s = options.bookingSummary;
    if (s.tourName) effectiveInfoCards.push({ title: "Experience", value: s.tourName });
    if (s.referenceNumber || s.reference) effectiveInfoCards.push({ title: "Reference No", value: s.referenceNumber || s.reference });
    if (s.date) effectiveInfoCards.push({ title: "Date", value: s.date });
    if (s.guideName) effectiveInfoCards.push({ title: "Assigned Guide", value: s.guideName });
    if (s.travelers) effectiveInfoCards.push({ title: "Travelers", value: s.travelers });
    if (s.totalPrice) effectiveInfoCards.push({ title: "Total Amount", value: s.totalPrice });
  }

  // Determine if there is an OTP card (6 digits)
  const otpCard = effectiveInfoCards.find(c => c.title && c.title.toLowerCase().includes("code") && String(c.value).length === 6);
  const regularCards = otpCard ? effectiveInfoCards.filter(c => c !== otpCard) : effectiveInfoCards;

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
                  <div style="background-color: ${BRAND.green}; width: 72px; height: 72px; border-radius: 50%; display: inline-block; text-align: center; line-height: 72px; margin-bottom: 25px;">
                    <img src="${getIcon(type)}" alt="icon" width="36" height="36" style="display: inline-block; vertical-align: middle; margin-top: 18px;" />
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
