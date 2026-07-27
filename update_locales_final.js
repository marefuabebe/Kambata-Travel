const fs = require('fs');

const enPath = 'frontend/src/locales/en.json';
const amPath = 'frontend/src/locales/am.json';

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const amData = JSON.parse(fs.readFileSync(amPath, 'utf8'));

amData.home = {
  ...amData.home,
  destinationsDesc: "የከምባታን ውበት በተዋሃዱ መንገዶቻቸው፣ አረንጓዴ ተራሮች ከህያው ቅርስ ጋር በሚገናኙበት ቦታ ይለማመዱ።",
  expDesc: "ደማቅ ባህሎችን፣ አስደናቂ መልክዓ ምድሮችን፣ የበለጸገ ታሪክን እና የከምባታን ህዝብ ሞቅ ያለ አቀባበል ያግኙ።",
  expFeat1: "እውነተኛ የአካባቢ ተሞክሮዎች",
  expFeat2: "ማህበረሰብን ማዕከል ያደረገ",
  expFeat3: "ዘላቂ ቱሪዝም",
  expFeat4: "የአካባቢ ማህበረሰቦችን ይደግፉ",
  days: "ቀናት",
  hours: "ሰዓታት",
  minutes: "ደቂቃዎች",
  seconds: "ሴኮንዶች",
  viewAllTours: "ሁሉንም ጉብኝቶች ይመልከቱ",
  stillQuestions: "አሁንም ጥያቄዎች አሉዎት?"
};

enData.home = {
  ...enData.home,
  destinationsDesc: "Experience Kambata's beauty through their integrated paths, where verdant peaks meet living heritage.",
  expDesc: "Discover vibrant traditions, breathtaking landscapes, rich history, and the warmth of the Kambata people.",
  expFeat1: "Authentic Local Experiences",
  expFeat2: "Community Centered",
  expFeat3: "Sustainable Tourism",
  expFeat4: "Support Local Communities",
  days: "DAYS",
  hours: "HOURS",
  minutes: "MINUTES",
  seconds: "SECONDS",
  viewAllTours: "View All Tours",
  stillQuestions: "Still have questions?"
};

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
fs.writeFileSync(amPath, JSON.stringify(amData, null, 2));
console.log('Locales updated successfully');
