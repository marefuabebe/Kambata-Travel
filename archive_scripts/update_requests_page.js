const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/app/explorer-dashboard/my-requests/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add import
if (!content.includes('useLanguage')) {
  content = content.replace(
    'import { toast } from "react-hot-toast";',
    'import { toast } from "react-hot-toast";\nimport { useLanguage } from "@/context/LanguageContext";'
  );
}

// Add useLanguage hook
if (!content.includes('const { t } = useLanguage();')) {
  content = content.replace(
    '  const [activeTab, setActiveTab] = useState("pending_admin");',
    '  const [activeTab, setActiveTab] = useState("pending_admin");\n  const { t } = useLanguage();'
  );
}

// Replace strings
content = content.replace(/>My Custom Requests</g, '>{t("requests.title")}<');
content = content.replace(/>Track the status of your custom dates, private tours, and waitlists.</g, '>{t("requests.subtitle")}<');

// Tabs & ActiveTab
content = content.replace(/"Payment Pending"/g, 't("requests.paymentPending")');

// Empty State logic (Wait, I need to check empty state)
content = content.replace(/>No requests found</g, '>{t("requests.empty.title")}<');
content = content.replace(/>You haven't made any requests in this category yet.</g, '>{t("requests.empty.subtitle")}<');

// Details
content = content.replace(/'Travel Experience'/g, 't("requests.travelExperience")');
content = content.replace(/Travelers/g, '{t("requests.travelers")}');
content = content.replace(/Message from Admin/g, '{t("requests.messageFromAdmin")}');
content = content.replace(/Activity Timeline/g, '{t("requests.activityTimeline")}');

// Status messages
content = content.replace(/Action Required/g, '{t("requests.status.actionRequired")}');
content = content.replace(/>Your guide accepted!</g, '>{t("requests.status.guideAccepted")}<');
content = content.replace(/>Complete payment within 30 minutes to confirm your reservation.</g, '>{t("requests.status.completePayment")}<');

content = content.replace(/>Approved</g, '>{t("requests.status.approved")}<');
content = content.replace(/>Assigning your guide…</g, '>{t("requests.status.assigningGuide")}<');
content = content.replace(/>We'll notify you as soon as your guide is confirmed and payment is ready.</g, '>{t("requests.status.notifyWhenReady")}<');

content = content.replace(/>Under Review</g, '>{t("requests.status.underReview")}<');
content = content.replace(/>Our team is currently reviewing your request. We'll get back to you shortly.</g, '>{t("requests.status.reviewingRequest")}<');

content = content.replace(/>Unavailable</g, '>{t("requests.status.unavailable")}<');
content = content.replace(/>We are unable to fulfill this request at this time.</g, '>{t("requests.status.unableToFulfill")}<');

content = content.replace(/>Expired</g, '>{t("requests.status.expired")}<');
content = content.replace(/>The payment window for this request has expired.</g, '>{t("requests.status.paymentExpired")}<');
content = content.replace(/>This request is no longer valid.</g, '>{t("requests.status.noLongerValid")}<');

content = content.replace(/>Payment Successful</g, '>{t("requests.status.paymentSuccessful")}<');
content = content.replace(/>Your expedition is secured!</g, '>{t("requests.status.expeditionSecured")}<');
content = content.replace(/View Details →/g, '{t("requests.status.viewDetails")}');

content = content.replace(/>Cancelled</g, '>{t("requests.status.cancelled")}<');
content = content.replace(/>You cancelled this request.</g, '>{t("requests.status.youCancelled")}<');

content = content.replace(/Cancel Request/g, '{t("requests.status.cancelRequest")}');
content = content.replace(/"Are you sure you want to cancel this request\?"/g, 't("requests.status.confirmCancel")');

fs.writeFileSync(filePath, content, 'utf8');
console.log('My requests page updated with translations');
