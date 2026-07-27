const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'frontend/src/locales/en.json');
const amPath = path.join(__dirname, 'frontend/src/locales/am.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const amData = JSON.parse(fs.readFileSync(amPath, 'utf8'));

enData.requests = {
  title: "My Custom Requests",
  subtitle: "Track the status of your custom dates, private tours, and waitlists.",
  paymentPending: "Payment Pending",
  travelExperience: "Travel Experience",
  travelers: "Travelers",
  messageFromAdmin: "Message from Admin",
  activityTimeline: "Activity Timeline",
  status: {
    actionRequired: "Action Required",
    guideAccepted: "Your guide accepted!",
    completePayment: "Complete payment within 30 minutes to confirm your reservation.",
    approved: "Approved",
    assigningGuide: "Assigning your guide…",
    notifyWhenReady: "We'll notify you as soon as your guide is confirmed and payment is ready.",
    underReview: "Under Review",
    reviewingRequest: "Our team is currently reviewing your request. We'll get back to you shortly.",
    unavailable: "Unavailable",
    unableToFulfill: "We are unable to fulfill this request at this time.",
    expired: "Expired",
    paymentExpired: "The payment window for this request has expired.",
    noLongerValid: "This request is no longer valid.",
    paymentSuccessful: "Payment Successful",
    expeditionSecured: "Your expedition is secured!",
    viewDetails: "View Details →",
    cancelled: "Cancelled",
    youCancelled: "You cancelled this request.",
    cancelRequest: "Cancel Request",
    confirmCancel: "Are you sure you want to cancel this request?"
  },
  empty: {
    title: "No requests found",
    subtitle: "You don't have any requests in this category yet."
  }
};

amData.requests = {
  title: "የእኔ ብጁ ጥያቄዎች",
  subtitle: "የብጁ ቀኖችዎን፣ የግል ጉብኝቶችዎን እና የተጠባባቂ ዝርዝሮችዎን ሁኔታ ይከታተሉ።",
  paymentPending: "ክፍያ በመጠባበቅ ላይ",
  travelExperience: "የጉዞ ልምድ",
  travelers: "ተጓዦች",
  messageFromAdmin: "ከአስተዳዳሪ መልእክት",
  activityTimeline: "የእንቅስቃሴ የጊዜ መስመር",
  status: {
    actionRequired: "እርምጃ ያስፈልጋል",
    guideAccepted: "መሪዎ ተቀብሏል!",
    completePayment: "ማስያዣዎን ለማረጋገጥ በ30 ደቂቃዎች ውስጥ ክፍያዎን ያጠናቅቁ።",
    approved: "ጸድቋል",
    assigningGuide: "መሪዎን በመመደብ ላይ…",
    notifyWhenReady: "መሪዎ እንደተረጋገጠ እና ክፍያ ዝግጁ ሲሆን እናሳውቅዎታለን።",
    underReview: "በግምገማ ላይ",
    reviewingRequest: "ቡድናችን በአሁኑ ጊዜ ጥያቄዎን እየገመገመ ነው። በቅርቡ እንመለስልዎታለን።",
    unavailable: "አይገኝም",
    unableToFulfill: "በአሁኑ ጊዜ ይህንን ጥያቄ ማሟላት አንችልም።",
    expired: "ጊዜው አልፎበታል",
    paymentExpired: "የዚህ ጥያቄ ክፍያ ጊዜ አልፎበታል።",
    noLongerValid: "ይህ ጥያቄ ከእንግዲህ ዋጋ የለውም።",
    paymentSuccessful: "ክፍያ ተሳክቷል",
    expeditionSecured: "ጉዞዎ ተረጋግጧል!",
    viewDetails: "ዝርዝሮችን ይመልከቱ →",
    cancelled: "ተሰርዟል",
    youCancelled: "ይህንን ጥያቄ ሰርዘውታል።",
    cancelRequest: "ጥያቄውን ይሰርዙ",
    confirmCancel: "እርግጠኛ ነዎት ይህንን ጥያቄ መሰረዝ ይፈልጋሉ?"
  },
  empty: {
    title: "ምንም ጥያቄዎች አልተገኙም",
    subtitle: "በዚህ ምድብ ውስጥ እስካሁን ምንም ጥያቄዎች የሉዎትም።"
  }
};

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2), 'utf8');
fs.writeFileSync(amPath, JSON.stringify(amData, null, 2), 'utf8');
console.log('Requests locales updated.');
