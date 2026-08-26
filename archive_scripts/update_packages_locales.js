const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'frontend/src/locales/en.json');
const amPath = path.join(__dirname, 'frontend/src/locales/am.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const amData = JSON.parse(fs.readFileSync(amPath, 'utf8'));

enData.packagesPage = {
  toast: {
    loadSchedulesFailed: "Could not load package schedules",
    invalidSelection: "Please select a schedule and valid number of travelers.",
    reserved: "Travel Package reserved — proceed to payment from My Bookings",
    bookingFailed: "Booking failed"
  },
  header: {
    title: "Travel Packages",
    subtitle: "Premium curated experiences combining tours and luxurious accommodations."
  },
  empty: {
    title: "No packages available",
    desc: "We are currently crafting exclusive new travel packages. Check back soon!"
  },
  card: {
    badge: "Travel Package",
    from: "From",
    perPerson: "/ person",
    btnDetails: "Details"
  },
  modal: {
    title: "Book Package",
    noSchedules: "There are currently no upcoming schedules available for this package. Please check back later.",
    selectSchedule: "Select Schedule",
    seatsRemaining: "seats remaining",
    travelers: "Travelers",
    travelersPlaceholder: "Number of travelers",
    totalPrice: "Total Price",
    cancel: "Cancel",
    confirmBooking: "Confirm Booking"
  }
};

amData.packagesPage = {
  toast: {
    loadSchedulesFailed: "የጥቅል መርሃግብሮችን መጫን አልተቻለም",
    invalidSelection: "እባክዎ መርሃግብር እና ትክክለኛ የተጓዦች ብዛት ይምረጡ።",
    reserved: "የጉዞ ጥቅል ተይዟል — ወደ ክፍያ ከምዝገባዎቼ ይቀጥሉ",
    bookingFailed: "ማስያዝ አልተሳካም"
  },
  header: {
    title: "የጉዞ ጥቅሎች",
    subtitle: "ከጉብኝቶች እና የቅንጦት ማረፊያዎች ጋር የተዋሃዱ ልዩ የጉዞ ልምዶች።"
  },
  empty: {
    title: "ምንም ጥቅሎች የሉም",
    desc: "በአሁኑ ጊዜ አዳዲስ ልዩ የጉዞ ጥቅሎችን እያዘጋጀን ነው። እባክዎ ትንሽ ቆይተው ይመለሱ!"
  },
  card: {
    badge: "የጉዞ ጥቅል",
    from: "ከ",
    perPerson: "/ ሰው",
    btnDetails: "ዝርዝሮች"
  },
  modal: {
    title: "ጥቅል ያስይዙ",
    noSchedules: "በአሁኑ ጊዜ ለዚህ ጥቅል ምንም መርሃግብሮች የሉም። እባክዎ ትንሽ ቆይተው ይመለሱ።",
    selectSchedule: "መርሃግብር ይምረጡ",
    seatsRemaining: "የቀሩ ቦታዎች",
    travelers: "ተጓዦች",
    travelersPlaceholder: "የተጓዦች ብዛት",
    totalPrice: "ጠቅላላ ዋጋ",
    cancel: "ሰርዝ",
    confirmBooking: "ማስያዣን አረጋግጥ"
  }
};

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
fs.writeFileSync(amPath, JSON.stringify(amData, null, 2));

console.log("Packages locales updated successfully");
