const fs = require("fs");
const enPath = "C:/kambata-travel/frontend/src/locales/en.json";
const amPath = "C:/kambata-travel/frontend/src/locales/am.json";
const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
const am = JSON.parse(fs.readFileSync(amPath, "utf8"));

Object.assign(en.guidePages.settings, {
  bankPlaceholder: "e.g. Commercial Bank of Ethiopia",
  holderPlaceholder: "Matches your National ID",
  accountPlaceholder: "Full account string",
  telebirrPlaceholder: "e.g. TeleBirr",
  phonePlaceholder: "+251 ...",
  deactivationDescFull: "Deactivating your expert profile will remove all your public tour listings and pause any pending payouts. Use this only if you wish to exit the platform.",
  deactivationConfirm: "You will be taken to support to request profile deactivation. Continue?",
});

Object.assign(am.guidePages.settings, {
  bankPlaceholder: "ለምሳሌ፣ ንግድ ባንክ ኢትዮጵያ",
  holderPlaceholder: "ከብሔራዊ መታወቂያዎ ጋር ይዛመዳል",
  accountPlaceholder: "ሙሉ የሂሳብ ቁጥር",
  telebirrPlaceholder: "ለምሳሌ፣ ቴሌብር",
  phonePlaceholder: "+251 ...",
  deactivationDescFull: "የባለሙያ መገለጫዎን ማሰናከል ሁሉንም የህዝብ ጉብኝት ዝርዝሮችን ያስወግዳል።",
  deactivationConfirm: "ለመገለጫ ማሰናከል ድጋፍ ይወሰዳሉ። ይቀጥሉ?",
});

Object.assign(en.guidePages.scanner, {
  cancel: "Cancel",
  securityPin: "Security PIN Required",
  securityPinDesc: "Ask the traveler for their 4-digit security PIN to confirm this pass.",
  verifyPin: "Verify PIN",
  locationWarning: "Location Warning",
  override: "Override",
  scansPendingSync: "{n} Scans Pending Sync",
  readyDescFull: "Ask the traveler to open their Digital Boarding Pass in the Kambata app, then tap the button below.",
  alignQrFull: "Align the QR code within the square frame. The scan will happen automatically.",
});

Object.assign(am.guidePages.scanner, {
  cancel: "ይቅር",
  securityPin: "የደህንነት ፒን ያስፈልጋል",
  securityPinDesc: "ይህንን ፓስ ለማረጋገጥ ከተጓዡ 4-አሃዝ የደህንነት ፒን ይጠይቁ።",
  verifyPin: "ፒን አረጋግጥ",
  locationWarning: "የአካባቢ ማስጠንቀቂያ",
  override: "ተተልፍ",
  scansPendingSync: "{n} ስካኖች ለማመሳሰል በመጠባበቅ ላይ",
  readyDescFull: "ተጓዡ የዲጂታል ቦርዲንግ ፓሱን በከምባታ መተግበሪያ ይክፈቱ፣ ከዚያ ቁልፉን ይጫኑ።",
  alignQrFull: "QR ኮዱን በካዴሩ ውስጥ ያስተካክሉ። ስካኑ በራስ-ሰር ይከናወናል።",
});

Object.assign(en.guidePages.profile, {
  strengthDescLong: "Complete your identity to gain priority placement in search results and admin approval.",
});

Object.assign(am.guidePages.profile, {
  strengthDescLong: "በፍለጋ ውጤቶች እና በአስተዳዳሪ ፈቃድ ቅድሚያ ለማግኘት ማንነትዎን ያጠናቅቁ።",
});

fs.writeFileSync(enPath, JSON.stringify(en, null, 2) + "\n");
fs.writeFileSync(amPath, JSON.stringify(am, null, 2) + "\n");
console.log("Extra locale keys added");
