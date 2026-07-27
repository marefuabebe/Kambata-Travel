const fs = require('fs');

const enPath = 'frontend/src/locales/en.json';
const amPath = 'frontend/src/locales/am.json';

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const amData = JSON.parse(fs.readFileSync(amPath, 'utf8'));

enData.home = {
  welcomeTag: "WELCOME TO KAMBATA",
  heroTitle1: "Explore the Untouched",
  heroTitle2: "Beauty of Kambata Zone",
  heroSub: "From breathtaking landscapes and rich culture to warm communities and unforgettable adventures. Kambata welcomes you.",
  startAdventure: "Start Your Adventure",
  features: {
    localExp: "Local Experiences",
    localExpDesc: "Authentic & community-based",
    expertGuides: "Expert Local Guides",
    expertGuidesDesc: "Friendly, professional & local",
    safeComfort: "Safe & Comfortable",
    safeComfortDesc: "Your safety is our priority",
    sustainable: "Sustainable Tourism",
    sustainableDesc: "Protecting nature & culture"
  },
  search: {
    whereTo: "Where to?",
    whereToPlaceholder: "Search destinations...",
    category: "What are you looking for?",
    categoryPlaceholder: "Select category",
    duration: "Duration",
    durationPlaceholder: "Any duration",
    travelers: "Travelers",
    travelersPlaceholder: "1 Traveler",
    button: "Search"
  }
};

amData.home = {
  welcomeTag: "እንኳን ወደ ከምባታ በደህና መጡ",
  heroTitle1: "ያልተነካውን ውበት ያስሱ",
  heroTitle2: "የከምባታ ዞን",
  heroSub: "ከአስደናቂ መልክዓ ምድሮች እና ባለጸጋ ባህል ጀምሮ እስከ ደማቅ ማህበረሰቦች እና የማይረሱ ጀብዱዎች። ከምባታ እንኳን ደህና መጣችሁ ይላል።",
  startAdventure: "ጀብዱዎን ይጀምሩ",
  features: {
    localExp: "የአካባቢ ልምዶች",
    localExpDesc: "ትክክለኛ እና ማህበረሰብን መሰረት ያደረገ",
    expertGuides: "ባለሙያ የአካባቢ አስጎብኚዎች",
    expertGuidesDesc: "ተግባቢ፣ ባለሙያ እና የአካባቢው ተወላጅ",
    safeComfort: "ደህንነቱ የተጠበቀ እና ምቹ",
    safeComfortDesc: "የእርስዎ ደህንነት ቅድሚያ የምንሰጠው ጉዳይ ነው",
    sustainable: "ዘላቂ ቱሪዝም",
    sustainableDesc: "ተፈጥሮን እና ባህልን መጠበቅ"
  },
  search: {
    whereTo: "የት ነው የሚሄዱት?",
    whereToPlaceholder: "መዳረሻዎችን ይፈልጉ...",
    category: "ምን እየፈለጉ ነው?",
    categoryPlaceholder: "ምድብ ይምረጡ",
    duration: "የቆይታ ጊዜ",
    durationPlaceholder: "ማንኛውም የቆይታ ጊዜ",
    travelers: "ተጓዦች",
    travelersPlaceholder: "1 ተጓዥ",
    button: "ፈልግ"
  }
};

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
fs.writeFileSync(amPath, JSON.stringify(amData, null, 2));
console.log('Locales updated successfully');
