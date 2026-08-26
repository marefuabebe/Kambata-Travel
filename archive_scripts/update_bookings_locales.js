const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'frontend/src/locales/en.json');
const amPath = path.join(__dirname, 'frontend/src/locales/am.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const amData = JSON.parse(fs.readFileSync(amPath, 'utf8'));

enData.bookings = {
  title: "My Bookings",
  subtitle: "View all your past and upcoming reservations in Kambaata.",
  tabs: {
    tours: "Tours",
    hotels: "Hotels",
    packages: "Packages"
  },
  actions: {
    downloadInvoice: "Download Invoice",
    digitalPass: "Digital Pass",
    cancelBooking: "Cancel Booking",
    confirmCompletion: "Confirm Completion",
    viewDetails: "View Details",
    generatePass: "Generate Digital Pass",
    messageGuide: "Message Guide",
    contactSupport: "Contact Support"
  },
  status: {
    confirmed: "Confirmed",
    paid: "Paid",
    pending: "Pending",
    completed: "Completed",
    cancelled: "Cancelled"
  },
  details: {
    backToBookings: "Back to My Bookings",
    bookingTimeline: "Booking Timeline",
    documentsReceipts: "Documents & Receipts",
    needHelp: "Need Help?",
    yourGuide: "Your Guide"
  },
  timeline: {
    bookingConfirmed: "Booking Confirmed",
    paymentReceived: "Payment Received",
    guideAssigned: "Guide Assigned",
    tourReminder: "Tour Reminder",
    tourInProgress: "Tour In Progress",
    tourCompleted: "Tour Completed",
    leaveReview: "Leave Review"
  },
  empty: {
    title: "No bookings found",
    subtitle: "You haven't made any bookings in this category yet."
  }
};

amData.bookings = {
  title: "የእኔ ማስያዣዎች",
  subtitle: "በካምባታ ውስጥ ያደረጓቸውን ያለፉትን እና የሚመጡትን ማስያዣዎች ይመልከቱ።",
  tabs: {
    tours: "ጉብኝቶች",
    hotels: "ሆቴሎች",
    packages: "ጥቅሎች"
  },
  actions: {
    downloadInvoice: "ደረሰኝ ያውርዱ",
    digitalPass: "ዲጂታል ማለፊያ",
    cancelBooking: "ማስያዣውን ይሰርዙ",
    confirmCompletion: "ማጠናቀቂያን ያረጋግጡ",
    viewDetails: "ዝርዝሮችን ይመልከቱ",
    generatePass: "ዲጂታል ማለፊያ ይፍጠሩ",
    messageGuide: "ለመሪው መልእክት ይላኩ",
    contactSupport: "ድጋፍን ያግኙ"
  },
  status: {
    confirmed: "ተረጋግጧል",
    paid: "ተከፍሏል",
    pending: "በመጠባበቅ ላይ",
    completed: "ተጠናቋል",
    cancelled: "ተሰርዟል"
  },
  details: {
    backToBookings: "ወደ ማስያዣዎቼ ተመለስ",
    bookingTimeline: "የማስያዣ የጊዜ መስመር",
    documentsReceipts: "ሰነዶች እና ደረሰኞች",
    needHelp: "እርዳታ ይፈልጋሉ?",
    yourGuide: "የእርስዎ መሪ"
  },
  timeline: {
    bookingConfirmed: "ማስያዣው ተረጋግጧል",
    paymentReceived: "ክፍያው ተቀብሏል",
    guideAssigned: "መሪ ተመድቧል",
    tourReminder: "የጉብኝት ማስታወሻ",
    tourInProgress: "ጉብኝቱ በመካሄድ ላይ ነው",
    tourCompleted: "ጉብኝቱ ተጠናቋል",
    leaveReview: "ግምገማ ይተዉ"
  },
  empty: {
    title: "ምንም ማስያዣዎች አልተገኙም",
    subtitle: "በዚህ ምድብ ውስጥ እስካሁን ምንም ማስያዣ አላደረጉም።"
  }
};

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2), 'utf8');
fs.writeFileSync(amPath, JSON.stringify(amData, null, 2), 'utf8');
console.log('Bookings locales updated.');
