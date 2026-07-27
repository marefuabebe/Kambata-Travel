const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'frontend/src/locales/en.json');
const amPath = path.join(__dirname, 'frontend/src/locales/am.json');
const supportPath = path.join(__dirname, 'frontend/src/app/explorer-dashboard/support/page.tsx');

let enLocale = JSON.parse(fs.readFileSync(enPath, 'utf8'));
let amLocale = JSON.parse(fs.readFileSync(amPath, 'utf8'));

const supportEn = {
  ...enLocale.support,
  subtitle: "We're here to help you before, during, and after your journey.",
  currentEmergency: "Current Trip Emergency?",
  emergencyDesc: "If you are currently on a tour and need immediate assistance, call our 24/7 hotline.",
  contactUs: "Contact Us",
  generalInquiries: "General Inquiries",
  hours: "Mon-Fri, 8am-6pm EAT",
  emailSupport: "Email Support",
  replyTime: "Typically replies in 2 hours",
  openMessages: "Open Messages",
  searchAnswers: "Search for answers...",
  noResults: "No results found",
  tryDifferent: "Try different keywords or contact support below.",
  sendMessage: "Send a Message",
  messageSent: "Message Sent",
  receivedRequest: "We've received your request and will get back to you shortly.",
  sendAnother: "Send another",
  selectTopic: "Select a topic",
  topicBooking: "Booking Modification",
  topicPayment: "Payment Issue",
  topicTour: "Tour Inquiry",
  topicAccount: "Account Problem",
  topicOther: "Other",
  mySupportTickets: "My Support Tickets",
  id: "ID",
  date: "Date",
  status: "Status",
  close: "Close",
  catBookings: "Bookings & Payments",
  catTours: "Tours & Packages",
  q1: "How do I modify my booking?",
  a1: "You can modify your booking up to 48 hours before the tour start time. Go to 'My Bookings', select your upcoming trip, and click 'Modify Schedule' or contact support.",
  q2: "What is the cancellation policy?",
  a2: "Full refunds are available for cancellations made at least 7 days before departure. Cancellations within 48 hours may be subject to a 50% fee.",
  q3: "Which payment methods are accepted?",
  a3: "We accept Visa, MasterCard, Telebirr, and direct bank transfers (CBE, Dashen, Awash).",
  q4: "Are flights included in the packages?",
  a4: "Domestic flights within Ethiopia are often included in premium packages. International flights to Addis Ababa must be booked separately.",
  q5: "What should I pack for a trekking tour?",
  a5: "We recommend sturdy hiking boots, layers for cold mornings, sun protection, and a refillable water bottle. A detailed packing list will be available in your Booking Details page once confirmed."
};

const supportAm = {
  ...amLocale.support,
  subtitle: "ከጉዞዎ በፊት፣ በጉዞዎ ወቅት እና ከጉዞዎ በኋላ እርስዎን ለመርዳት እዚህ ነን።",
  currentEmergency: "በአሁኑ ጉዞ ላይ ድንገተኛ አደጋ አጋጥሞዎታል?",
  emergencyDesc: "በአሁኑ ጊዜ በጉብኝት ላይ ከሆኑ እና አስቸኳይ እርዳታ ከፈለጉ፣ የ24/7 የስልክ መስመራችንን ይደውሉ።",
  contactUs: "ያግኙን",
  generalInquiries: "አጠቃላይ ጥያቄዎች",
  hours: "ከሰኞ-አርብ፣ 2ሰዓት-12ሰዓት (በኢትዮጵያ ሰዓት)",
  emailSupport: "የኢሜል ድጋፍ",
  replyTime: "በተለምዶ በ2 ሰዓታት ውስጥ ይመልሳል",
  openMessages: "መልእክቶችን ክፈት",
  searchAnswers: "መልሶችን ይፈልጉ...",
  noResults: "ምንም አልተገኘም",
  tryDifferent: "የተለዩ ቃላትን ይሞክሩ ወይም ከዚህ በታች ያለውን ድጋፍ ያግኙ።",
  sendMessage: "መልእክት ይላኩ",
  messageSent: "መልእክት ተልኳል",
  receivedRequest: "ጥያቄዎን ተቀብለናል እና በቅርቡ ምላሽ እንሰጣለን።",
  sendAnother: "ሌላ ላክ",
  selectTopic: "ርዕስ ይምረጡ",
  topicBooking: "የቦታ ማስያዣ ማሻሻያ",
  topicPayment: "የክፍያ ችግር",
  topicTour: "የጉብኝት ጥያቄ",
  topicAccount: "የመለያ ችግር",
  topicOther: "ሌላ",
  mySupportTickets: "የእኔ የድጋፍ ትኬቶች",
  id: "መለያ",
  date: "ቀን",
  status: "ሁኔታ",
  close: "ዝጋ",
  catBookings: "ቦታ ማስያዣዎች እና ክፍያዎች",
  catTours: "ጉብኝቶች እና ጥቅሎች",
  q1: "እንዴት ነው ቦታ ማስያዣዬን ማሻሻል የምችለው?",
  a1: "ከጉብኝቱ መጀመሪያ ጊዜ እስከ 48 ሰዓታት በፊት ድረስ ቦታ ማስያዣዎን ማሻሻል ይችላሉ። ወደ 'የእኔ ቦታ ማስያዣዎች' ይሂዱ፣ መጪውን ጉዞዎን ይምረጡ እና 'መርሐግብር አሻሽል' የሚለውን ጠቅ ያድርጉ ወይም ድጋፍን ያግኙ።",
  q2: "የስረዛ ፖሊሲው ምንድን ነው?",
  a2: "ከመነሳት ቢያንስ ከ7 ቀናት በፊት ለተደረጉ ስረዛዎች ሙሉ ገንዘብ ተመላሽ ይደረጋል። በ48 ሰዓታት ውስጥ ለሚደረጉ ስረዛዎች የ50% ቅጣት ሊኖር ይችላል።",
  q3: "የትኞቹ የክፍያ ዘዴዎች ተቀባይነት አላቸው?",
  a3: "ቪዛ፣ ማስተርካርድ፣ ቴሌብር እና ቀጥታ የባንክ ዝውውሮችን (ሲቢኢ፣ ዳሸን፣ አዋሽ) እንቀበላለን።",
  q4: "በረራዎች በጥቅሎቹ ውስጥ ተካትተዋል?",
  a4: "በኢትዮጵያ ውስጥ ያሉ የሀገር ውስጥ በረራዎች ብዙ ጊዜ በፕሪሚየም ጥቅሎች ውስጥ ይካተታሉ። ወደ አዲስ አበባ የሚደረጉ ዓለም አቀፍ በረራዎች ለብቻ መያዝ አለባቸው።",
  q5: "ለእግር ጉዞ ምን ማሸግ አለብኝ?",
  a5: "ጠንካራ የእግር ጉዞ ጫማዎችን፣ ለቀዝቃዛ ጠዋት ደረብ የሚያደርጉ ልብሶችን፣ የፀሐይ መከላከያ እና እንደገና ሊሞላ የሚችል የውሃ ጠርሙስ እንመክራለን። አንዴ ከተረጋገጠ ዝርዝር የማሸጊያ ዝርዝር በቦታ ማስያዣ ዝርዝሮች ገጽዎ ላይ ይገኛል።"
};

enLocale.support = supportEn;
amLocale.support = supportAm;

fs.writeFileSync(enPath, JSON.stringify(enLocale, null, 2), 'utf8');
fs.writeFileSync(amPath, JSON.stringify(amLocale, null, 2), 'utf8');

let supportContent = fs.readFileSync(supportPath, 'utf8');

const replacements = [
  { search: 'subtitle="We\'re here to help you before, during, and after your journey."', replace: 'subtitle={t("support.subtitle")}' },
  { search: '>Current Trip Emergency?<', replace: '>{t("support.currentEmergency")}<' },
  { search: '>If you are currently on a tour and need immediate assistance, call our 24/7 hotline.<', replace: '>{t("support.emergencyDesc")}<' },
  { search: '>Contact Us<', replace: '>{t("support.contactUs")}<' },
  { search: '>General Inquiries<', replace: '>{t("support.generalInquiries")}<' },
  { search: '>Mon-Fri, 8am-6pm EAT<', replace: '>{t("support.hours")}<' },
  { search: '>Email Support<', replace: '>{t("support.emailSupport")}<' },
  { search: '>Typically replies in 2 hours<', replace: '>{t("support.replyTime")}<' },
  { search: 'Open Messages', replace: '{t("support.openMessages")}' },
  { search: 'placeholder="Search for answers..."', replace: 'placeholder={t("support.searchAnswers")}' },
  { search: '>No results found<', replace: '>{t("support.noResults")}<' },
  { search: '>Try different keywords or contact support below.<', replace: '>{t("support.tryDifferent")}<' },
  { search: '>Send a Message<', replace: '>{t("support.sendMessage")}<' },
  { search: '>Message Sent<', replace: '>{t("support.messageSent")}<' },
  { search: 'We\'ve received your request and will get back to you shortly.', replace: '{t("support.receivedRequest")}' },
  { search: 'Send another', replace: '{t("support.sendAnother")}' },
  { search: '>Select a topic<', replace: '>{t("support.selectTopic")}<' },
  { search: '>Booking Modification<', replace: '>{t("support.topicBooking")}<' },
  { search: '>Payment Issue<', replace: '>{t("support.topicPayment")}<' },
  { search: '>Tour Inquiry<', replace: '>{t("support.topicTour")}<' },
  { search: '>Account Problem<', replace: '>{t("support.topicAccount")}<' },
  { search: '>Other<', replace: '>{t("support.topicOther")}<' },
  { search: '>My Support Tickets<', replace: '>{t("support.mySupportTickets")}<' },
  { search: '>ID<', replace: '>{t("support.id")}<' },
  { search: '>Date<', replace: '>{t("support.date")}<' },
  { search: '>Status<', replace: '>{t("support.status")}<' },
  { search: '>Close<', replace: '>{t("support.close")}<' }
];

// FAQS array replacement
const oldFaqs = `const faqs = [
  {
    category: "Bookings & Payments",
    items: [
      { q: "How do I modify my booking?", a: "You can modify your booking up to 48 hours before the tour start time. Go to 'My Bookings', select your upcoming trip, and click 'Modify Schedule' or contact support." },
      { q: "What is the cancellation policy?", a: "Full refunds are available for cancellations made at least 7 days before departure. Cancellations within 48 hours may be subject to a 50% fee." },
      { q: "Which payment methods are accepted?", a: "We accept Visa, MasterCard, Telebirr, and direct bank transfers (CBE, Dashen, Awash)." }
    ]
  },
  {
    category: "Tours & Packages",
    items: [
      { q: "Are flights included in the packages?", a: "Domestic flights within Ethiopia are often included in premium packages. International flights to Addis Ababa must be booked separately." },
      { q: "What should I pack for a trekking tour?", a: "We recommend sturdy hiking boots, layers for cold mornings, sun protection, and a refillable water bottle. A detailed packing list will be available in your Booking Details page once confirmed." },
    ]
  }
];`;

const newFaqs = `const getFaqs = (t: any) => [
  {
    category: t("support.catBookings"),
    items: [
      { q: t("support.q1"), a: t("support.a1") },
      { q: t("support.q2"), a: t("support.a2") },
      { q: t("support.q3"), a: t("support.a3") }
    ]
  },
  {
    category: t("support.catTours"),
    items: [
      { q: t("support.q4"), a: t("support.a4") },
      { q: t("support.q5"), a: t("support.a5") },
    ]
  }
];`;

supportContent = supportContent.replace(oldFaqs, newFaqs);

// Replace the two usages of `faqs`
supportContent = supportContent.replace(/faqs\.map/g, 'getFaqs(t).map');

// Handle the manual replacements
for (const { search, replace } of replacements) {
  supportContent = supportContent.split(search).join(replace);
}

fs.writeFileSync(supportPath, supportContent, 'utf8');
console.log("Support subtext translation completed.");
