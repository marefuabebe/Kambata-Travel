const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/app/explorer-dashboard/bookings/[id]/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add import
if (!content.includes('useLanguage')) {
  content = content.replace(
    'import { useParams, useRouter } from "next/navigation";',
    'import { useParams, useRouter } from "next/navigation";\nimport { useLanguage } from "@/context/LanguageContext";'
  );
}

// Add useLanguage hook
if (!content.includes('const { t } = useLanguage();')) {
  content = content.replace(
    '  const router = useRouter();',
    '  const router = useRouter();\n  const { t } = useLanguage();'
  );
}

// Replace strings
content = content.replace(/"Booking Confirmed"/g, 't("bookings.timeline.bookingConfirmed")');
content = content.replace(/"Payment Received"/g, 't("bookings.timeline.paymentReceived")');
content = content.replace(/"Guide Assigned"/g, 't("bookings.timeline.guideAssigned")');
content = content.replace(/"Tour Reminder"/g, 't("bookings.timeline.tourReminder")');
content = content.replace(/"Tour In Progress"/g, 't("bookings.timeline.tourInProgress")');
content = content.replace(/"Tour Completed"/g, 't("bookings.timeline.tourCompleted")');
content = content.replace(/"Leave Review"/g, 't("bookings.timeline.leaveReview")');

content = content.replace(/Back to My Bookings/g, '{t("bookings.details.backToBookings")}');
content = content.replace(/Travel Pass/g, '{t("bookings.actions.digitalPass")}');
content = content.replace(/Trip Timeline/g, '{t("bookings.details.bookingTimeline")}');
content = content.replace(/Your Guide/g, '{t("bookings.details.yourGuide")}');
content = content.replace(/> Chat/g, '> {t("bookings.actions.messageGuide")}');
content = content.replace(/Payment Summary/g, 'Payment Summary');
content = content.replace(/> Download Invoice/g, '> {t("bookings.actions.downloadInvoice")}');
content = content.replace(/Document Center/g, '{t("bookings.details.documentsReceipts")}');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Bookings detail page updated with translations');
