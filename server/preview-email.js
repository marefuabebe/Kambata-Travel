/**
 * Quick preview script — writes email HTML to a temp file and opens it.
 * Run: node preview-email.js [type]
 * Types: welcome, booking_confirmed, ticket, tour_completed, review_reminder, sos, default
 */
const fs = require("fs");
const path = require("path");
const { buildPremiumEmail } = require("./utils/emailTemplateBuilder");

const type = process.argv[2] || "welcome";

const configs = {
  welcome: {
    type: "welcome",
    title: "Welcome to Kambata Travel!",
    accentColor: "#10B981",
    greeting: "Hello Tadese Heramo,",
    bodyLines: [
      "We are thrilled to have you join the Kambata Travel family!",
      "To start exploring amazing destinations, exclusive tours, and local experiences, please verify your email address using the code below."
    ],
    infoCards: [{ title: "Verification Code", value: "143585", iconEmoji: "🔐" }],
    cta: { text: "Verify Your Email", link: "https://kambata.travel/verify-email", color: "#10B981" }
  },
  booking_confirmed: {
    type: "booking_confirmed",
    title: "Your Booking is Confirmed!",
    accentColor: "#10B981",
    greeting: "Hello Tadese Heramo,",
    bodyLines: [
      "We are thrilled to confirm your reservation! Your adventure to the heart of Kambata is officially booked.",
      "Your payment was successful, and your receipt is attached as a PDF to this email."
    ],
    statusBadge: { text: "CONFIRMED", color: "#10B981" },
    bookingSummary: {
      tourName: "Ajora Falls & Hambaricho Expedition",
      date: "July 25, 2026",
      guideName: "Bekele Tadesse",
      travelers: 4,
      totalPrice: "ETB 12,500"
    },
    cta: { text: "View Your Itinerary", link: "https://kambata.travel/bookings", color: "#10B981" }
  },
  ticket: {
    type: "ticket",
    title: "Check-in Successful",
    accentColor: "#10B981",
    greeting: "Hello Tadese Heramo,",
    bodyLines: ["You have successfully checked in for your tour. Enjoy your trip!"],
    infoCards: [
      { title: "Tour Name", value: "Ajora Falls Adventure", iconEmoji: "📍" },
      { title: "Travelers", value: "4 guests", iconEmoji: "👥" }
    ],
    statusBadge: { text: "CHECKED IN", color: "#10B981" },
    cta: { text: "View Dashboard", link: "https://kambata.travel/dashboard", color: "#10B981" }
  },
  tour_completed: {
    type: "tour_completed",
    title: "Thank you for traveling with us!",
    accentColor: "#FF8C00",
    greeting: "Hi Tadese,",
    bodyLines: [
      "We hope you had an amazing time on your recent tour: <strong>Ajora Falls & Hambaricho Expedition</strong>.",
      "We'd love to hear about your experience! Your feedback helps us improve and supports our amazing guides."
    ],
    cta: { text: "Leave a Review", link: "https://kambata.travel/reviews", color: "#FF8C00" }
  },
  review_reminder: {
    type: "review_reminder",
    title: "How was your experience?",
    accentColor: "#10B981",
    greeting: "Hi Tadese,",
    bodyLines: [
      "It's been a day since your tour finished. We hope you're still smiling from your <strong>Ajora Falls</strong> experience!",
      "If you haven't already, please take a quick moment to rate your guide."
    ],
    infoCards: [{ title: "Tour Completed", value: "July 25, 2026", iconEmoji: "📅" }],
    cta: { text: "Rate Your Guide ★★★★★", link: "https://kambata.travel/reviews", color: "#10B981" }
  },
  sos: {
    type: "sos",
    title: "SOS Alert: MEDICAL EMERGENCY",
    accentColor: "#EF4444",
    greeting: "Attention Admin,",
    bodyLines: [
      "An emergency SOS alert has been submitted by Tadese Heramo (traveler).",
      "Please review the details below and respond immediately via the admin dashboard."
    ],
    infoCards: [
      { title: "Reported By", value: "Tadese Heramo (traveler)", iconEmoji: "👤" },
      { title: "Type", value: "MEDICAL EMERGENCY", iconEmoji: "⚠️" },
      { title: "Severity", value: "HIGH", iconEmoji: "🔥" },
      { title: "Location", value: "Ajora Falls Viewpoint", iconEmoji: "📍" },
      { title: "Contact Phone", value: "+251 91 234 5678", iconEmoji: "📞" },
      { title: "Description", value: "Traveler fell and needs medical attention", iconEmoji: "📝" }
    ],
    statusBadge: { text: "URGENT", color: "#EF4444" },
    cta: { text: "Respond Now", link: "https://kambata.travel/admin/sos", color: "#EF4444" }
  },
  default: {
    type: "default",
    title: "Password Reset Request",
    accentColor: "#3B82F6",
    greeting: "Hello Tadese Heramo,",
    bodyLines: [
      "We received a request to reset the password associated with your Kambata Travel account.",
      "Please use the secure OTP code below to verify your identity. This code will expire in 10 minutes."
    ],
    infoCards: [{ title: "Reset Code", value: "892741", iconEmoji: "🔑" }],
    cta: { text: "Reset Password", link: "https://kambata.travel/reset-password", color: "#3B82F6" }
  }
};

const config = configs[type] || configs.default;
const html = buildPremiumEmail(config);

const outPath = path.join(__dirname, `email-preview-${type}.html`);
fs.writeFileSync(outPath, html);
console.log(`\n✅ Preview written to: ${outPath}`);
console.log(`   Open this file in your browser to preview the email.`);
console.log(`   HTML size: ${html.length} bytes\n`);
