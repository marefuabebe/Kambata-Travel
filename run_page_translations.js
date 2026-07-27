const fs = require('fs');
const path = require('path');

function processFile(filePath, replacements, needsUseLanguage = true) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add useLanguage if needed
  if (needsUseLanguage && !content.includes('useLanguage')) {
    if (content.includes('import { useRouter } from "next/navigation";')) {
      content = content.replace(
        'import { useRouter } from "next/navigation";',
        'import { useRouter } from "next/navigation";\nimport { useLanguage } from "@/context/LanguageContext";'
      );
    } else {
      content = content.replace(
        'import React',
        'import React' // fallback if we want to replace here
      );
      // better way: just insert after first import
      content = content.replace(/import [^\n]+;\n/, match => match + 'import { useLanguage } from "@/context/LanguageContext";\n');
    }
  }

  // Inject const { t } = useLanguage(); inside the component
  if (needsUseLanguage && !content.includes('const { t } = useLanguage();')) {
    const match = content.match(/export default function \w+\(\) \{\n/);
    if (match) {
      content = content.replace(match[0], match[0] + '  const { t } = useLanguage();\n');
    }
  }

  // Apply replacements
  for (const { search, replace } of replacements) {
    if (search instanceof RegExp) {
      content = content.replace(search, replace);
    } else {
      content = content.split(search).join(replace);
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

// 1. REVIEWS
processFile(
  path.join(__dirname, 'frontend/src/app/explorer-dashboard/reviews/page.tsx'),
  [
    { search: '>My Reviews<', replace: '>{t("reviews.title")}<' },
    { search: '>Share your experiences to help other travelers and support our local guides.<', replace: '>{t("reviews.subtitle")}<' },
    { search: '>Pending Reviews\n', replace: '>{t("reviews.pendingReviews")}\n' },
    { search: '>Submitted Reviews<', replace: '>{t("reviews.submittedReviews")}<' },
    { search: '>All caught up!<', replace: '>{t("reviews.caughtUp")}<' },
    { search: '>You have no pending reviews. Complete more adventures to unlock new review opportunities!<', replace: '>{t("reviews.caughtUpDesc")}<' },
    { search: '> Rate {isTour ? "Tour" : "Package"}<', replace: '>{t(isTour ? "reviews.rateTour" : "reviews.ratePackage")}<' },
    { search: '> Rate Guide ({guide.name.split(" ")[0]})<', replace: '> {t("reviews.rateGuide")} ({guide.name.split(" ")[0]})<' },
    { search: '>No reviews submitted yet.<', replace: '>{t("reviews.noReviewsSubmitted")}<' },
    { search: '>Response from Guide<', replace: '>{t("reviews.responseFromGuide")}<' },
    { search: '>Overall Experience<', replace: '>{t("reviews.overallExperience")}<' },
    { search: '>Category Breakdown<', replace: '>{t("reviews.categoryBreakdown")}<' },
    { search: '>Share your thoughts<', replace: '>{t("reviews.shareYourThoughts")}<' },
    { search: 'placeholder="Tell us what you loved..."', replace: 'placeholder={t("reviews.tellUsWhatYouLoved")}' },
    { search: '>Cancel<', replace: '>{t("reviews.cancel")}<' },
    { search: '{isSubmitting ? "Submitting..." : "Submit Review"}', replace: '{isSubmitting ? t("reviews.submitting") : t("reviews.submitReview")}' }
  ]
);

// 2. SOS
processFile(
  path.join(__dirname, 'frontend/src/app/explorer-dashboard/sos/page.tsx'),
  [
    { search: '>Emergency SOS Center<', replace: '>{t("sos.title")}<' },
    { search: '>For urgent help during your tour. We respond immediately.<', replace: '>{t("sos.subtitle")}<' },
    { search: '>Emergency Hotline', replace: '>{t("sos.hotline")}' },
    { search: '>Available 24/7 for life-threatening emergencies<', replace: '>{t("sos.available247")}<' },
    { search: '>Submit New Alert<', replace: '>{t("sos.submitAlert")}<' },
    { search: '>Alert History<', replace: '>{t("sos.history")}<' },
    { search: '>Emergency Type<', replace: '>{t("sos.emergencyType")}<' },
    { search: '>Severity Level<', replace: '>{t("sos.severityLevel")}<' },
    { search: '>Your Current Location<', replace: '>{t("sos.location")}<' },
    { search: '>Contact Phone Number<', replace: '>{t("sos.contactPhone")}<' },
    { search: '>Describe the Situation<', replace: '>{t("sos.description")}<' },
    { search: '{submitting ? "Sending..." : "Send Emergency Alert"}', replace: '{submitting ? t("sos.sending") : t("sos.sendAlert")}' },
    { search: '>No SOS alerts<', replace: '>{t("sos.noAlerts")}<' },
    { search: '>You haven\'t submitted any emergency alerts.<', replace: '>{t("sos.noAlertsDesc")}<' }
  ]
);

// 3. SUPPORT
processFile(
  path.join(__dirname, 'frontend/src/app/explorer-dashboard/support/page.tsx'),
  [
    { search: '>Help & Support<', replace: '>{t("support.title")}<' },
    { search: '>We\'re here to help. Contact us or browse FAQs.<', replace: '>{t("support.subtitle")}<' },
    { search: '>Open Tickets<', replace: '>{t("support.openTickets")}<' },
    { search: '>Create Ticket<', replace: '>{t("support.createTicket")}<' },
    { search: '>Subject<', replace: '>{t("support.subject")}<' },
    { search: '>Category<', replace: '>{t("support.category")}<' },
    { search: '>Message<', replace: '>{t("support.message")}<' },
    { search: '{submitting ? "Submitting..." : "Submit Ticket"}', replace: '{submitting ? t("support.submitting") : t("support.submitTicket")}' },
    { search: '>No support tickets<', replace: '>{t("support.noTickets")}<' },
    { search: '>You don\'t have any open support tickets.<', replace: '>{t("support.noTicketsDesc")}<' },
    { search: '>Frequently Asked Questions<', replace: '>{t("support.faqs")}<' }
  ]
);

// 4. SETTINGS
// Settings has a LOT of fields. I will do basic main ones.
processFile(
  path.join(__dirname, 'frontend/src/app/explorer-dashboard/settings/page.tsx'),
  [
    { search: 'label: "General"', replace: 'label: t("settings.general")' },
    { search: 'label: "Preferences"', replace: 'label: t("settings.preferences")' },
    { search: 'label: "Emergency"', replace: 'label: t("settings.emergency")' },
    { search: 'label: "Notifications"', replace: 'label: t("settings.notifications")' },
    { search: 'label: "Security"', replace: 'label: t("settings.security")' },
    { search: '>Settings<', replace: '>{t("settings.title")}<' },
    { search: '>Manage your profile, preferences, and account security.<', replace: '>{t("settings.subtitle")}<' },
    { search: 'Personal Information', replace: '{t("settings.personalInfo")}' },
    { search: 'label="Full Name"', replace: 'label={t("settings.name")}' },
    { search: 'label="Phone Number"', replace: 'label={t("settings.phone")}' },
    { search: 'label="Location"', replace: 'label={t("settings.location")}' },
    { search: 'Travel Preferences', replace: '{t("settings.travelPreferences")}' },
    { search: 'label="Preferred Difficulty"', replace: 'label={t("settings.difficulty")}' },
    { search: 'label="Group Type"', replace: 'label={t("settings.groupType")}' },
    { search: 'Emergency Contact', replace: '{t("settings.emergencyContact")}' },
    { search: 'label="Relation"', replace: 'label={t("settings.relation")}' },
    { search: 'Notification Preferences', replace: '{t("settings.notificationPrefs")}' },
    { search: '>Email Alerts<', replace: '>{t("settings.emailAlerts")}<' },
    { search: '>Booking Updates<', replace: '>{t("settings.bookingUpdates")}<' },
    { search: '>Reminders<', replace: '>{t("settings.reminders")}<' },
    { search: 'Security Settings', replace: '{t("settings.securitySettings")}' },
    { search: 'label="New Password"', replace: 'label={t("settings.newPassword")}' },
    { search: 'Danger Zone', replace: '{t("settings.dangerZone")}' },
    { search: '>Delete Account<', replace: '>{t("settings.deleteAccount")}<' },
    { search: 'Once you delete your account, there is no going back. Please be certain.', replace: '{t("settings.deleteDesc")}' },
    { search: '{loading ? "Saving..." : "Save Changes"}', replace: '{loading ? t("settings.saving") : t("settings.saveChanges")}' }
  ]
);

console.log("Pages updated.");
