/**
 * emailTemplateBuilder.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Kambata Travel — Luxury Email Framework
 * 
 * Generates premium, responsive HTML email templates inspired by
 * Airbnb, Booking.com, GetYourGuide, and Stripe.
 * 
 * Architecture:
 *   • Table-based layout for Gmail / Outlook compatibility
 *   • Fully inline CSS on every element
 *   • <style> block only for dark-mode @media and responsive breakpoints
 *   • Dynamic hero images, contextual SVG bridge icons
 *   • Glassmorphism overlay cards, premium info blocks
 *   • Timeline/progress, booking summary, status badges
 *   • Rich branded footer with logo, links, support, social
 * 
 * API: buildPremiumEmail({ type, title, accentColor, greeting, bodyLines,
 *        infoCards, bookingSummary, cta, statusBadge })
 *      Same signature — zero caller changes required.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const LOGO_URL = "https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037998/kambata/dkpheumdufifku4djspm.svg";
const FRONTEND_URL_DEFAULT = "https://kambata.travel";

const BRAND = {
  green:     "#0F766E",
  greenLt:   "#10B981",
  dark:      "#0F172A",
  darkCard:  "#1E293B",
  body:      "#334155",
  muted:     "#64748B",
  light:     "#94A3B8",
  border:    "#E2E8F0",
  surface:   "#F8FAFC",
  bg:        "#F1F5F9",
  white:     "#FFFFFF",
  footerBg:  "#1A3C34",
  amber:     "#F59E0B",
  blue:      "#3B82F6",
  red:       "#EF4444",
  orange:    "#FF8C00",
};

// ═══════════════════════════════════════════════════════════════════════════════
// HERO IMAGES — Contextual destination photos per email type
// ═══════════════════════════════════════════════════════════════════════════════

const getHeroImage = (type) => {
  const heroes = {
    welcome:            "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1200&q=80",
    booking_confirmed:  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
    ticket:             "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
    tour_completed:     "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
    review_reminder:    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
    sos:                "https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?auto=format&fit=crop&w=1200&q=80",
    default:            "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1200&q=80",
  };
  return heroes[type] || heroes.default;
};

// ═══════════════════════════════════════════════════════════════════════════════
// HERO TITLES — Type-specific hero headlines
// ═══════════════════════════════════════════════════════════════════════════════

const getHeroHeadline = (type, title) => {
  const headlines = {
    welcome:            "Welcome to<br/>Kambata Travel!",
    booking_confirmed:  "Your Adventure<br/>Awaits!",
    ticket:             "Check-in<br/>Confirmed!",
    tour_completed:     "Thank You For<br/>Traveling With Us!",
    review_reminder:    "How Was Your<br/>Experience?",
    sos:                "Emergency<br/>Alert",
  };
  return headlines[type] || title || "Kambata Travel";
};

const getHeroTagline = (type) => {
  const taglines = {
    welcome:            "Your gateway to the heart of Kambata.<br/><strong>Adventure.</strong> <span style=\"color:#10B981;\">Culture.</span> <span style=\"color:#F59E0B;\">Nature.</span>",
    booking_confirmed:  "Your journey to the heart of Ethiopia begins now.",
    ticket:             "You're all set for an unforgettable experience.",
    tour_completed:     "We hope the journey left you with stories to tell.",
    review_reminder:    "Your feedback shapes the future of local tourism.",
    sos:                "Immediate attention required.",
    default:            "Connecting you to the Heart of Kambata.",
  };
  return taglines[type] || taglines.default;
};

// ═══════════════════════════════════════════════════════════════════════════════
// BRIDGE ICONS — Large contextual SVG icon bridging header → body
// ═══════════════════════════════════════════════════════════════════════════════

const getBridgeIcon = (type, accentColor) => {
  const c = accentColor || BRAND.green;
  const icons = {
    welcome: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
    booking_confirmed: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    ticket: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>`,
    tour_completed: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    review_reminder: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    sos: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    default: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  };
  return icons[type] || icons.default;
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Hero Header
// ═══════════════════════════════════════════════════════════════════════════════

const buildHeroHeader = (type, accentColor) => {
  const heroImg = getHeroImage(type);
  const headline = getHeroHeadline(type);
  const tagline = getHeroTagline(type);
  const isEmergency = type === "sos";
  const gradientTop = isEmergency ? "rgba(127,29,29,0.6)" : "rgba(15,35,30,0.45)";
  const gradientBot = isEmergency ? "rgba(127,29,29,0.92)" : "rgba(15,35,30,0.88)";

  return `
    <!-- Hero Header -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
      style="background-image: linear-gradient(to bottom, ${gradientTop}, ${gradientBot}), url('${heroImg}'); background-size: cover; background-position: center; background-color: ${isEmergency ? '#7F1D1D' : '#0F766E'};">
      <tr><td style="padding: 40px 40px 60px 40px;">
        <!-- Logo -->
        <table cellpadding="0" cellspacing="0" border="0" role="presentation">
          <tr>
            <td style="padding-right: 12px; vertical-align: middle;">
              <img src="${LOGO_URL}" alt="K" width="36" height="36"
                style="display: block; width: 36px; height: 36px; filter: brightness(0) invert(1);" />
            </td>
            <td style="vertical-align: middle;">
              <span style="font-family: 'Poppins', Arial, sans-serif; font-size: 16px; font-weight: 800; color: #FFFFFF; letter-spacing: 2px; text-transform: uppercase;">KAMBATA</span>
              <br/>
              <span style="font-family: 'Inter', Arial, sans-serif; font-size: 9px; font-weight: 600; color: rgba(255,255,255,0.75); letter-spacing: 3px; text-transform: uppercase;">TRAVEL</span>
            </td>
          </tr>
        </table>
        <!-- Headline -->
        <h1 style="font-family: 'Poppins', Arial, sans-serif; font-size: 36px; font-weight: 800; color: #FFFFFF; margin: 28px 0 12px 0; line-height: 1.15; letter-spacing: -0.5px;">
          ${headline}
        </h1>
        <!-- Tagline -->
        <p style="font-family: 'Inter', Arial, sans-serif; font-size: 15px; color: rgba(255,255,255,0.82); margin: 0; line-height: 1.5; max-width: 400px;">
          ${tagline}
        </p>
      </td></tr>
    </table>`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Bridge Icon (overlaps header/body junction)
// ═══════════════════════════════════════════════════════════════════════════════

const buildBridgeIcon = (type, accentColor) => {
  const icon = getBridgeIcon(type, accentColor);
  const bgColor = `${accentColor}18`;
  return `
    <!-- Bridge Icon -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" class="dark-body-bg"
      style="background-color: #FFFFFF;">
      <tr><td align="center" style="padding: 0;">
        <div style="width: 64px; height: 64px; border-radius: 50%; background-color: ${bgColor}; border: 3px solid ${accentColor}; display: inline-block; text-align: center; line-height: 64px; margin-top: -32px;">
          <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" style="width:64px;height:64px;v-text-anchor:middle;" arcsize="50%" fillcolor="${bgColor}" strokecolor="${accentColor}" strokeweight="3px"><v:textbox inset="0,0,0,0"><center><![endif]-->
          ${icon}
          <!--[if mso]></center></v:textbox></v:roundrect><![endif]-->
        </div>
      </td></tr>
    </table>`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Status Badge
// ═══════════════════════════════════════════════════════════════════════════════

const buildStatusBadge = (statusBadge) => {
  if (!statusBadge) return "";
  const bgColor = `${statusBadge.color}15`;
  return `
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom: 20px;">
      <tr><td style="background-color: ${bgColor}; color: ${statusBadge.color}; font-family: 'Inter', Arial, sans-serif; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; padding: 8px 20px; border-radius: 20px; border: 1px solid ${statusBadge.color}30;">
        ${statusBadge.text}
      </td></tr>
    </table>`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Info Cards — Premium 2-column grid
// ═══════════════════════════════════════════════════════════════════════════════

const buildInfoCards = (infoCards) => {
  if (!infoCards || infoCards.length === 0) return "";

  // Check if any card has the special "Verification Code" or "Reset Code" title — render as OTP digits
  const otpCard = infoCards.find(c => 
    c.title && (c.title.toLowerCase().includes("verification code") || c.title.toLowerCase().includes("reset code"))
  );

  let otpHtml = "";
  if (otpCard && otpCard.value) {
    const digits = String(otpCard.value).split("");
    const digitCells = digits.map(d => `
      <td style="width: 48px; height: 58px; background-color: #FFFFFF; border: 2px solid ${BRAND.border}; border-radius: 12px; text-align: center; vertical-align: middle; font-family: 'Poppins', monospace; font-size: 28px; font-weight: 800; color: ${BRAND.dark};" class="dark-card dark-text">
        ${d}
      </td>
    `).join('<td style="width: 8px;"></td>');

    otpHtml = `
    <!-- OTP Code Block -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin: 30px 0; background-color: ${BRAND.surface}; border-radius: 20px; border: 1px solid ${BRAND.border};" class="dark-surface">
      <tr><td style="padding: 28px 24px;">
        <p style="font-family: 'Inter', Arial, sans-serif; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; color: ${BRAND.muted}; margin: 0 0 16px 0; text-align: center;" class="dark-muted">
          YOUR ${otpCard.title.toUpperCase()}
        </p>
        <table cellpadding="0" cellspacing="0" border="0" role="presentation" align="center">
          <tr>${digitCells}</tr>
        </table>
        <p style="font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: ${BRAND.light}; margin: 16px 0 0 0; text-align: center;" class="dark-muted">
          ⏱ This code will expire in 15 minutes.
        </p>
      </td></tr>
    </table>`;
  }

  // Filter out OTP card from regular info cards
  const regularCards = otpCard ? infoCards.filter(c => c !== otpCard) : infoCards;

  let regularHtml = "";
  if (regularCards.length > 0) {
    // Build rows of 2 cards each
    const rows = [];
    for (let i = 0; i < regularCards.length; i += 2) {
      const card1 = regularCards[i];
      const card2 = regularCards[i + 1];
      
      const cell = (card) => `
        <td width="50%" style="padding: 6px; vertical-align: top;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
            style="background-color: #FFFFFF; border-radius: 16px; border: 1px solid ${BRAND.border};" class="dark-card">
            <tr><td style="padding: 16px 18px;">
              ${card.iconEmoji ? `<span style="font-size: 20px; display: block; margin-bottom: 8px;">${card.iconEmoji}</span>` : ""}
              <span style="display: block; font-family: 'Inter', Arial, sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: ${BRAND.muted}; margin-bottom: 5px;" class="dark-muted">${card.title}</span>
              <span style="display: block; font-family: 'Inter', Arial, sans-serif; font-size: 15px; font-weight: 700; color: ${BRAND.dark};" class="dark-text">${card.value}</span>
            </td></tr>
          </table>
        </td>`;
      
      rows.push(`<tr>${cell(card1)}${card2 ? cell(card2) : '<td width="50%" style="padding: 6px;"></td>'}</tr>`);
    }

    regularHtml = `
    <!-- Info Cards Grid -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" 
      style="margin: 25px 0; background-color: ${BRAND.surface}; border-radius: 20px; padding: 8px; border: 1px solid ${BRAND.border};" class="dark-surface">
      <tr><td style="padding: 8px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
          ${rows.join("")}
        </table>
      </td></tr>
    </table>`;
  }

  return otpHtml + regularHtml;
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Booking Summary Card
// ═══════════════════════════════════════════════════════════════════════════════

const buildBookingSummary = (bookingSummary) => {
  if (!bookingSummary) return "";

  const row = (label, value, isTotal = false) => `
    <tr>
      <td style="padding: ${isTotal ? '14px 0 8px' : '10px 0'}; font-family: 'Inter', Arial, sans-serif; font-size: 14px; ${isTotal ? 'font-weight: 700; border-top: 2px solid ' + BRAND.border + ';' : 'font-weight: 500;'} color: ${isTotal ? BRAND.dark : BRAND.muted}; vertical-align: top;" class="${isTotal ? 'dark-text dark-border-top' : 'dark-muted'}">${label}</td>
      <td style="padding: ${isTotal ? '14px 0 8px' : '10px 0'}; font-family: 'Inter', Arial, sans-serif; font-size: 14px; ${isTotal ? 'font-weight: 800; border-top: 2px solid ' + BRAND.border + '; color: ' + BRAND.green + ';' : 'font-weight: 600; color: ' + BRAND.dark + ';'} text-align: right; vertical-align: top;" class="${isTotal ? 'dark-border-top' : 'dark-text'}">${value}</td>
    </tr>`;

  return `
  <!-- Booking Summary -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
    style="margin: 30px 0; background-color: #FFFFFF; border-radius: 20px; border: 1px solid ${BRAND.border}; overflow: hidden;" class="dark-card">
    <tr><td>
      <!-- Header Bar -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
        style="background-color: ${BRAND.surface}; border-bottom: 1px solid ${BRAND.border};" class="dark-surface dark-border-bottom">
        <tr>
          <td style="padding: 16px 24px;">
            <span style="font-family: 'Inter', Arial, sans-serif; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: ${BRAND.muted};" class="dark-muted">📋 Booking Details</span>
          </td>
          <td style="padding: 16px 24px; text-align: right;">
            <span style="font-family: 'Inter', Arial, sans-serif; font-size: 11px; font-weight: 700; color: ${BRAND.green}; background-color: ${BRAND.green}15; padding: 4px 12px; border-radius: 12px;">Confirmed</span>
          </td>
        </tr>
      </table>
      <!-- Details -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="padding: 0 24px;">
        ${row("Tour", bookingSummary.tourName)}
        ${row("Date", bookingSummary.date)}
        ${bookingSummary.guideName ? row("Guide", bookingSummary.guideName) : ""}
        ${row("Travelers", bookingSummary.travelers)}
        ${bookingSummary.totalPrice ? row("Total Price", bookingSummary.totalPrice, true) : ""}
      </table>
      <div style="height: 16px;"></div>
    </td></tr>
  </table>`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: CTA Button — Premium pill with arrow
// ═══════════════════════════════════════════════════════════════════════════════

const buildCTAButton = (cta, accentColor) => {
  if (!cta) return "";
  const btnColor = cta.color || accentColor || BRAND.green;
  return `
  <!-- CTA Button -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin: 35px 0 25px;">
    <tr><td align="center">
      <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${cta.link}" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="50%" fillcolor="${btnColor}" stroke="f"><w:anchorlock/><center style="color:#FFFFFF;font-family:'Inter',Arial,sans-serif;font-size:16px;font-weight:700;">${cta.text} →</center></v:roundrect><![endif]-->
      <!--[if !mso]><!-->
      <a href="${cta.link}" target="_blank"
        style="display: inline-block; background-color: ${btnColor}; color: #FFFFFF; font-family: 'Inter', Arial, sans-serif; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 44px; border-radius: 50px; box-shadow: 0 4px 14px ${btnColor}35; mso-hide: all;">
        ${cta.text}&nbsp;&nbsp;→
      </a>
      <!--<![endif]-->
    </td></tr>
  </table>`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Trust Section — 3-column icons
// ═══════════════════════════════════════════════════════════════════════════════

const buildTrustSection = (type) => {
  // Only show for welcome/verification type emails
  if (!["welcome"].includes(type)) return "";

  const items = [
    { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${BRAND.green}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 12 15 16 10" fill="none"/></svg>`, title: "Secure Account", desc: "Protect your account and personal information." },
    { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${BRAND.green}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`, title: "Easy Bookings", desc: "Book tours and manage your trips effortlessly." },
    { icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${BRAND.green}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`, title: "Personalized Experiences", desc: "Get recommendations made just for you." },
  ];

  const cells = items.map(item => `
    <td width="33.33%" style="padding: 12px 8px; text-align: center; vertical-align: top;">
      <div style="width: 52px; height: 52px; border-radius: 50%; background-color: ${BRAND.green}10; margin: 0 auto 12px; line-height: 52px; text-align: center;">
        ${item.icon}
      </div>
      <p style="font-family: 'Poppins', Arial, sans-serif; font-size: 13px; font-weight: 700; color: ${BRAND.dark}; margin: 0 0 4px 0;" class="dark-text">${item.title}</p>
      <p style="font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: ${BRAND.muted}; margin: 0; line-height: 1.4;" class="dark-muted">${item.desc}</p>
    </td>`).join("");

  return `
  <!-- Trust Section -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin: 35px 0 10px;">
    <tr><td align="center">
      <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom: 20px;">
        <tr>
          <td style="font-size: 16px; padding-right: 8px; vertical-align: middle;">»</td>
          <td style="font-family: 'Poppins', Arial, sans-serif; font-size: 18px; font-weight: 800; color: ${BRAND.dark}; vertical-align: middle;" class="dark-text">Why verify your email?</td>
          <td style="font-size: 16px; padding-left: 8px; vertical-align: middle;">«</td>
        </tr>
      </table>
    </td></tr>
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr>${cells}</tr>
      </table>
    </td></tr>
  </table>`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Journey Progress Timeline
// ═══════════════════════════════════════════════════════════════════════════════

const buildTimeline = (type) => {
  if (!["welcome"].includes(type)) return "";

  const steps = [
    { label: "Account Created", active: true, icon: "✓" },
    { label: "Verify Email", active: true, icon: "✉" },
    { label: "Complete Profile", active: false, icon: "👤" },
    { label: "Explore Kambata", active: false, icon: "✏" },
  ];

  const stepCells = steps.map((step, i) => {
    const isLast = i === steps.length - 1;
    const circleColor = step.active ? BRAND.green : BRAND.border;
    const textColor = step.active ? BRAND.green : BRAND.light;
    const circleBg = step.active ? `${BRAND.green}15` : BRAND.surface;
    
    return `
      <td style="text-align: center; vertical-align: top; padding: 0 4px; width: ${100 / steps.length}%;">
        <div style="width: 36px; height: 36px; border-radius: 50%; background-color: ${circleBg}; border: 2px solid ${circleColor}; margin: 0 auto 8px; line-height: 36px; text-align: center; font-size: 14px; color: ${circleColor};">
          ${step.active ? step.icon : step.icon}
        </div>
        <p style="font-family: 'Inter', Arial, sans-serif; font-size: 11px; font-weight: 600; color: ${textColor}; margin: 0; line-height: 1.3;" class="dark-muted">${step.label}</p>
      </td>`;
  }).join("");

  return `
  <!-- Journey Timeline -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
    style="margin: 30px 0; background-color: ${BRAND.surface}; border-radius: 20px; border: 1px solid ${BRAND.border}; overflow: hidden;" class="dark-surface">
    <tr><td style="padding: 24px;">
      <p style="font-family: 'Poppins', Arial, sans-serif; font-size: 16px; font-weight: 800; color: ${BRAND.dark}; margin: 0 0 20px; text-align: center;" class="dark-text">Your Journey Starts Here</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr>${stepCells}</tr>
      </table>
    </td></tr>
  </table>`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Destination Teaser — Bottom visual CTA
// ═══════════════════════════════════════════════════════════════════════════════

const buildDestinationTeaser = (type) => {
  if (["sos"].includes(type)) return "";

  return `
  <!-- Destination Teaser -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
    style="margin: 30px 0 10px; border-radius: 20px; overflow: hidden; border: 1px solid ${BRAND.border};" class="dark-card">
    <tr>
      <td width="120" style="vertical-align: middle;">
        <img src="https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=240&q=80" alt="Ajora Falls"
          width="120" style="display: block; width: 120px; height: 100px; object-fit: cover;" />
      </td>
      <td style="padding: 16px 20px; vertical-align: middle;">
        <p style="font-family: 'Poppins', Arial, sans-serif; font-size: 15px; font-weight: 800; color: ${BRAND.dark}; margin: 0 0 4px;" class="dark-text">Discover the Heart of Kambata</p>
        <p style="font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: ${BRAND.muted}; margin: 0; line-height: 1.4;" class="dark-muted">From the breathtaking Ajora Falls to the rich cultural heritage, your next unforgettable adventure awaits.</p>
      </td>
      <td width="70" style="vertical-align: middle; padding-right: 8px;">
        <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=140&q=80" alt="Hambaricho"
          width="60" style="display: block; width: 60px; height: 70px; object-fit: cover; border-radius: 10px;" />
      </td>
    </tr>
  </table>`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Premium Footer
// ═══════════════════════════════════════════════════════════════════════════════

const buildFooter = () => {
  const frontendUrl = process.env.FRONTEND_URL || FRONTEND_URL_DEFAULT;
  const year = new Date().getFullYear();

  return `
  <!-- Footer -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation"
    style="background-color: ${BRAND.footerBg};">
    <tr><td style="padding: 40px 40px 30px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr>
          <!-- Logo Column -->
          <td width="35%" style="vertical-align: top; padding-right: 20px;">
            <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom: 12px;">
              <tr>
                <td style="padding-right: 10px; vertical-align: middle;">
                  <img src="${LOGO_URL}" alt="Kambata" width="28" height="28"
                    style="display: block; width: 28px; height: 28px; filter: brightness(0) invert(1);" />
                </td>
                <td style="vertical-align: middle;">
                  <span style="font-family: 'Poppins', Arial, sans-serif; font-size: 13px; font-weight: 800; color: #FFFFFF; letter-spacing: 1.5px;">KAMBATA</span>
                  <br/>
                  <span style="font-family: 'Inter', Arial, sans-serif; font-size: 8px; font-weight: 600; color: rgba(255,255,255,0.5); letter-spacing: 2.5px;">TRAVEL</span>
                </td>
              </tr>
            </table>
            <p style="font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: rgba(255,255,255,0.5); margin: 0; line-height: 1.5;">Connecting you to the<br/>Heart of Kambata.</p>
          </td>
          <!-- Quick Links -->
          <td width="22%" style="vertical-align: top;">
            <p style="font-family: 'Inter', Arial, sans-serif; font-size: 11px; font-weight: 800; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 12px;">Quick Links</p>
            <p style="margin: 0; line-height: 2;">
              <a href="${frontendUrl}/tours" style="font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: rgba(255,255,255,0.55); text-decoration: none;">Tours & Packages</a><br/>
              <a href="${frontendUrl}/destinations" style="font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: rgba(255,255,255,0.55); text-decoration: none;">Destinations</a><br/>
              <a href="${frontendUrl}/about" style="font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: rgba(255,255,255,0.55); text-decoration: none;">About Us</a><br/>
              <a href="${frontendUrl}/contact" style="font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: rgba(255,255,255,0.55); text-decoration: none;">Contact Us</a>
            </p>
          </td>
          <!-- Support -->
          <td width="25%" style="vertical-align: top;">
            <p style="font-family: 'Inter', Arial, sans-serif; font-size: 11px; font-weight: 800; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 12px;">Support</p>
            <p style="font-family: 'Inter', Arial, sans-serif; font-size: 12px; color: rgba(255,255,255,0.55); margin: 0; line-height: 2;">
              support@kambata.travel<br/>
              +251 11 987 6543<br/>
              Mon – Sun: 8:00 AM –<br/>8:00 PM (EAT)
            </p>
          </td>
          <!-- Social -->
          <td width="18%" style="vertical-align: top; text-align: right;">
            <p style="font-family: 'Inter', Arial, sans-serif; font-size: 11px; font-weight: 800; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 12px;">Follow Us</p>
            <table cellpadding="0" cellspacing="0" border="0" role="presentation" align="right">
              <tr>
                <td style="padding: 0 4px;">
                  <a href="#" style="display: inline-block; width: 32px; height: 32px; background-color: rgba(255,255,255,0.1); border-radius: 50%; text-align: center; line-height: 32px; text-decoration: none; font-size: 14px;">
                    <span style="color: rgba(255,255,255,0.6);">f</span>
                  </a>
                </td>
                <td style="padding: 0 4px;">
                  <a href="#" style="display: inline-block; width: 32px; height: 32px; background-color: rgba(255,255,255,0.1); border-radius: 50%; text-align: center; line-height: 32px; text-decoration: none; font-size: 14px;">
                    <span style="color: rgba(255,255,255,0.6);">📷</span>
                  </a>
                </td>
              </tr>
              <tr><td style="height: 8px;" colspan="2"></td></tr>
              <tr>
                <td style="padding: 0 4px;">
                  <a href="#" style="display: inline-block; width: 32px; height: 32px; background-color: rgba(255,255,255,0.1); border-radius: 50%; text-align: center; line-height: 32px; text-decoration: none; font-size: 14px;">
                    <span style="color: rgba(255,255,255,0.6);">▶</span>
                  </a>
                </td>
                <td style="padding: 0 4px;">
                  <a href="#" style="display: inline-block; width: 32px; height: 32px; background-color: rgba(255,255,255,0.1); border-radius: 50%; text-align: center; line-height: 32px; text-decoration: none; font-size: 14px;">
                    <span style="color: rgba(255,255,255,0.6);">𝕏</span>
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
    <!-- Copyright Bar -->
    <tr><td style="padding: 20px 40px; border-top: 1px solid rgba(255,255,255,0.08);">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
        <tr>
          <td style="font-family: 'Inter', Arial, sans-serif; font-size: 11px; color: rgba(255,255,255,0.35);">
            &copy; ${year} Kambata Travel. All rights reserved.
          </td>
          <td style="text-align: right;">
            <a href="${frontendUrl}/privacy" style="font-family: 'Inter', Arial, sans-serif; font-size: 11px; color: rgba(255,255,255,0.35); text-decoration: none; margin-right: 16px;">Privacy Policy</a>
            <a href="${frontendUrl}/terms" style="font-family: 'Inter', Arial, sans-serif; font-size: 11px; color: rgba(255,255,255,0.35); text-decoration: none;">Terms of Service</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLE BLOCK — Dark mode + responsive (only media queries in <style>)
// ═══════════════════════════════════════════════════════════════════════════════

const getStyleBlock = () => `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;700;800&display=swap');

  /* Dark Mode */
  @media (prefers-color-scheme: dark) {
    .dark-wrapper { background-color: ${BRAND.dark} !important; }
    .dark-container { background-color: ${BRAND.darkCard} !important; box-shadow: 0 15px 35px rgba(0,0,0,0.3) !important; }
    .dark-body-bg { background-color: ${BRAND.darkCard} !important; }
    .dark-text { color: #FFFFFF !important; }
    .dark-body-text { color: #CBD5E1 !important; }
    .dark-muted { color: #94A3B8 !important; }
    .dark-card { background-color: ${BRAND.dark} !important; border-color: #334155 !important; }
    .dark-surface { background-color: ${BRAND.dark} !important; border-color: #334155 !important; }
    .dark-border-bottom { border-bottom-color: #334155 !important; }
    .dark-border-top { border-top-color: #334155 !important; }
    .dark-greeting { color: #F1F5F9 !important; }
  }

  /* Mobile Responsive */
  @media only screen and (max-width: 600px) {
    .email-wrapper-inner { padding: 12px !important; }
    .email-hero-td { padding: 32px 24px 48px 24px !important; }
    .email-hero-h1 { font-size: 28px !important; }
    .email-body-td { padding: 30px 20px !important; }
    .mobile-full { width: 100% !important; display: block !important; }
    .mobile-hide { display: none !important; }
    .mobile-stack td { display: block !important; width: 100% !important; padding: 12px 0 !important; }
    .cta-btn { width: 100% !important; text-align: center !important; box-sizing: border-box !important; }
    .footer-stack td { display: block !important; width: 100% !important; padding: 12px 0 !important; text-align: left !important; }
    .footer-stack table { float: none !important; }
  }
</style>`;

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN BUILDER — Orchestrates all components
// ═══════════════════════════════════════════════════════════════════════════════

const buildPremiumEmail = ({ 
  type = "default",
  title, 
  accentColor = "#10B981", 
  greeting, 
  bodyLines = [], 
  infoCards = [], 
  bookingSummary = null,
  cta = null,
  statusBadge = null 
}) => {
  
  const bodyContent = bodyLines.map(line => 
    `<p style="font-family: 'Inter', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: ${BRAND.body}; margin: 0 0 16px 0;" class="dark-body-text">${line}</p>`
  ).join("");

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${title || "Kambata Travel"}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  ${getStyleBlock()}
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND.bg}; font-family: 'Inter', Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: ${BRAND.body};">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" class="dark-wrapper"
    style="background-color: ${BRAND.bg};">
    <tr><td align="center" class="email-wrapper-inner" style="padding: 48px 20px;">

      <!-- Container -->
      <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" class="dark-container mobile-full"
        style="max-width: 600px; width: 100%; background-color: ${BRAND.white}; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);">
        
        ${buildHeroHeader(type, accentColor)}

        ${buildBridgeIcon(type, accentColor)}

        <!-- Email Body -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" class="dark-body-bg"
          style="background-color: ${BRAND.white};">
          <tr><td class="email-body-td" style="padding: 20px 44px 40px;">

            ${buildStatusBadge(statusBadge)}

            ${greeting ? `
            <h2 style="font-family: 'Poppins', Arial, sans-serif; font-size: 24px; font-weight: 800; color: ${BRAND.dark}; margin: 0 0 20px 0; line-height: 1.3;" class="dark-text">
              ${title}
            </h2>
            <p style="font-family: 'Inter', Arial, sans-serif; font-size: 17px; font-weight: 700; color: ${BRAND.dark}; margin: 0 0 20px 0;" class="dark-greeting">
              ${greeting}
            </p>` : `
            <h2 style="font-family: 'Poppins', Arial, sans-serif; font-size: 24px; font-weight: 800; color: ${BRAND.dark}; margin: 0 0 20px 0; line-height: 1.3;" class="dark-text">
              ${title}
            </h2>`}

            ${bodyContent}

            ${buildInfoCards(infoCards)}

            ${buildBookingSummary(bookingSummary)}

            ${buildCTAButton(cta, accentColor)}

            ${buildTrustSection(type)}

            ${buildTimeline(type)}

            ${buildDestinationTeaser(type)}

            <!-- Signature -->
            <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top: 35px;">
              <tr><td>
                <p style="font-family: 'Inter', Arial, sans-serif; font-size: 15px; color: ${BRAND.body}; margin: 0; line-height: 1.6;" class="dark-body-text">
                  Best regards,<br/>
                  <strong style="color: ${BRAND.dark};" class="dark-text">The Kambaata Team</strong>
                </p>
              </td></tr>
            </table>

          </td></tr>
        </table>

        ${buildFooter()}

      </table>
      <!-- /Container -->

    </td></tr>
  </table>
  <!-- /Wrapper -->

</body>
</html>`;
};

module.exports = { buildPremiumEmail };
