const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'frontend/src/locales/en.json');
const amPath = path.join(__dirname, 'frontend/src/locales/am.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const amData = JSON.parse(fs.readFileSync(amPath, 'utf8'));

enData.reviews = {
  title: "My Reviews",
  subtitle: "Share your experiences to help other travelers and support our local guides.",
  pendingReviews: "Pending Reviews",
  submittedReviews: "Submitted Reviews",
  caughtUp: "All caught up!",
  caughtUpDesc: "You have no pending reviews. Complete more adventures to unlock new review opportunities!",
  rateTour: "Rate Tour",
  ratePackage: "Rate Package",
  rateGuide: "Rate Guide",
  noReviewsSubmitted: "No reviews submitted yet.",
  responseFromGuide: "Response from Guide",
  overallExperience: "Overall Experience",
  categoryBreakdown: "Category Breakdown",
  shareYourThoughts: "Share your thoughts",
  tellUsWhatYouLoved: "Tell us what you loved...",
  cancel: "Cancel",
  submitReview: "Submit Review",
  submitting: "Submitting..."
};

amData.reviews = {
  title: "የእኔ ግምገማዎች",
  subtitle: "ሌሎች ተጓዦችን ለመርዳት እና የአካባቢ መሪዎቻችንን ለመደገፍ ተሞክሮዎን ያጋሩ።",
  pendingReviews: "በመጠባበቅ ላይ ያሉ ግምገማዎች",
  submittedReviews: "የገቡ ግምገማዎች",
  caughtUp: "ሁሉንም ጨርሰዋል!",
  caughtUpDesc: "በመጠባበቅ ላይ ያሉ ግምገማዎች የሉዎትም። አዳዲስ የግምገማ እድሎችን ለመክፈት ተጨማሪ ጀብዱዎችን ያጠናቅቁ!",
  rateTour: "ጉብኝቱን ይገምግሙ",
  ratePackage: "ጥቅሉን ይገምግሙ",
  rateGuide: "መሪውን ይገምግሙ",
  noReviewsSubmitted: "እስካሁን ምንም ግምገማዎች አልገቡም።",
  responseFromGuide: "ከመሪ የተሰጠ ምላሽ",
  overallExperience: "አጠቃላይ ተሞክሮ",
  categoryBreakdown: "የምድብ ዝርዝር",
  shareYourThoughts: "ሀሳብዎን ያካፍሉ",
  tellUsWhatYouLoved: "ምን እንደወደዱ ይንገሩን...",
  cancel: "ይቅር",
  submitReview: "ግምገማ አስገባ",
  submitting: "በማስገባት ላይ..."
};

enData.settings = {
  title: "Settings",
  subtitle: "Manage your profile, preferences, and account security.",
  general: "General",
  preferences: "Preferences",
  emergency: "Emergency",
  notifications: "Notifications",
  security: "Security",
  saveChanges: "Save Changes",
  saving: "Saving...",
  personalInfo: "Personal Information",
  name: "Full Name",
  phone: "Phone Number",
  location: "Location",
  email: "Email",
  travelPreferences: "Travel Preferences",
  difficulty: "Preferred Difficulty",
  groupType: "Group Type",
  emergencyContact: "Emergency Contact",
  relation: "Relation",
  notificationPrefs: "Notification Preferences",
  emailAlerts: "Email Alerts",
  bookingUpdates: "Booking Updates",
  reminders: "Reminders",
  securitySettings: "Security Settings",
  newPassword: "New Password",
  updatePassword: "Update Password",
  dangerZone: "Danger Zone",
  deleteAccount: "Delete Account",
  deleteDesc: "Once you delete your account, there is no going back. Please be certain.",
  uploadPhoto: "Upload Photo"
};

amData.settings = {
  title: "ቅንብሮች",
  subtitle: "መገለጫዎን፣ ምርጫዎችዎን እና የመለያ ደህንነትዎን ያስተዳድሩ።",
  general: "አጠቃላይ",
  preferences: "ምርጫዎች",
  emergency: "ድንገተኛ",
  notifications: "ማሳወቂያዎች",
  security: "ደህንነት",
  saveChanges: "ለውጦችን አስቀምጥ",
  saving: "በማስቀመጥ ላይ...",
  personalInfo: "የግል መረጃ",
  name: "ሙሉ ስም",
  phone: "ስልክ ቁጥር",
  location: "አካባቢ",
  email: "ኢሜል",
  travelPreferences: "የጉዞ ምርጫዎች",
  difficulty: "ተመራጭ የችግር ደረጃ",
  groupType: "የቡድን አይነት",
  emergencyContact: "የድንገተኛ አደጋ ተጠሪ",
  relation: "ዝምድና",
  notificationPrefs: "የማሳወቂያ ምርጫዎች",
  emailAlerts: "የኢሜል ማንቂያዎች",
  bookingUpdates: "የማስያዣ ዝማኔዎች",
  reminders: "ማሳሰቢያዎች",
  securitySettings: "የደህንነት ቅንብሮች",
  newPassword: "አዲስ የይለፍ ቃል",
  updatePassword: "የይለፍ ቃል አዘምን",
  dangerZone: "አደገኛ ዞን",
  deleteAccount: "መለያ ሰርዝ",
  deleteDesc: "አንዴ መለያዎን ከሰረዙ ወደኋላ መመለስ አይቻልም። እባክዎ እርግጠኛ ይሁኑ።",
  uploadPhoto: "ፎቶ ስቀል"
};

enData.sos = {
  title: "Emergency SOS Center",
  subtitle: "For urgent help during your tour. We respond immediately.",
  hotline: "Emergency Hotline",
  available247: "Available 24/7 for life-threatening emergencies",
  submitAlert: "Submit New Alert",
  history: "Alert History",
  emergencyType: "Emergency Type",
  severityLevel: "Severity Level",
  location: "Your Current Location",
  contactPhone: "Contact Phone Number",
  description: "Describe the Situation",
  sendAlert: "Send Emergency Alert",
  sending: "Sending...",
  noAlerts: "No SOS alerts",
  noAlertsDesc: "You haven't submitted any emergency alerts.",
  statusOpen: "Received",
  statusAck: "Acknowledged",
  statusProg: "Being Handled",
  statusRes: "Resolved",
  statusFalse: "False Alarm",
  submittedSuccess: "Help is on the way!"
};

amData.sos = {
  title: "የድንገተኛ አደጋ ማእከል",
  subtitle: "በጉብኝትዎ ወቅት አስቸኳይ እርዳታ ለማግኘት። ወዲያውኑ ምላሽ እንሰጣለን።",
  hotline: "የድንገተኛ አደጋ ስልክ",
  available247: "ለህይወት አስጊ ለሆኑ ድንገተኛ አደጋዎች 24/7 ይገኛል",
  submitAlert: "አዲስ ማንቂያ ያስገቡ",
  history: "የማንቂያ ታሪክ",
  emergencyType: "የድንገተኛ አደጋ አይነት",
  severityLevel: "የከባድነት ደረጃ",
  location: "አሁን ያሉበት አካባቢ",
  contactPhone: "የመገናኛ ስልክ ቁጥር",
  description: "ሁኔታውን ይግለጹ",
  sendAlert: "የድንገተኛ አደጋ ማንቂያ ይላኩ",
  sending: "በመላክ ላይ...",
  noAlerts: "ምንም የSOS ማንቂያዎች የሉም",
  noAlertsDesc: "ምንም የድንገተኛ አደጋ ማንቂያ አላስገቡም።",
  statusOpen: "ተቀብለናል",
  statusAck: "ታይቷል",
  statusProg: "በመስተናገድ ላይ",
  statusRes: "ተፈትቷል",
  statusFalse: "የሐሰት ማንቂያ",
  submittedSuccess: "እርዳታ በመንገድ ላይ ነው!"
};

enData.support = {
  title: "Help & Support",
  subtitle: "We're here to help. Contact us or browse FAQs.",
  openTickets: "Open Tickets",
  createTicket: "Create Ticket",
  subject: "Subject",
  category: "Category",
  message: "Message",
  submitTicket: "Submit Ticket",
  submitting: "Submitting...",
  noTickets: "No support tickets",
  noTicketsDesc: "You don't have any open support tickets.",
  faqs: "Frequently Asked Questions",
  contactUs: "Contact Us"
};

amData.support = {
  title: "እርዳታ እና ድጋፍ",
  subtitle: "እኛ ለመርዳት እዚህ ነን። ያግኙን ወይም በተደጋጋሚ የሚጠየቁ ጥያቄዎችን ያስሱ።",
  openTickets: "ክፍት ቲኬቶች",
  createTicket: "ቲኬት ይፍጠሩ",
  subject: "ርዕስ",
  category: "ምድብ",
  message: "መልእክት",
  submitTicket: "ቲኬት ያስገቡ",
  submitting: "በማስገባት ላይ...",
  noTickets: "ምንም የድጋፍ ቲኬቶች የሉም",
  noTicketsDesc: "ምንም ክፍት የድጋፍ ቲኬቶች የሉዎትም።",
  faqs: "በተደጋጋሚ የሚጠየቁ ጥያቄዎች",
  contactUs: "ያግኙን"
};

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2), 'utf8');
fs.writeFileSync(amPath, JSON.stringify(amData, null, 2), 'utf8');
console.log('Locales for reviews, settings, sos, support added.');
