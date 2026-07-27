const fs = require('fs');

const enPath = 'frontend/src/locales/en.json';
const amPath = 'frontend/src/locales/am.json';

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const amData = JSON.parse(fs.readFileSync(amPath, 'utf8'));

amData.home = {
  ...amData.home,
  welcomeTag: "ወደ ከምባታ እንኳን በደህና መጡ",
  heroTitle1: "የከምባታ ዞንን",
  heroTitle2: "ያልተነካ ውበት ያስሱ",
  heroSub: "ከአስደናቂ መልክዓ ምድሮች እና የበለጸገ ባህል ጀምሮ እስከ ደማቅ ማህበረሰቦች እና የማይረሱ ጀብዱዎች። ከምባታ በደስታ ይቀበሎታል።",
  startAdventure: "ጀብዱዎን ይጀምሩ",
  features: {
    localExp: "የሀገር ውስጥ ተሞክሮዎች",
    localExpDesc: "እውነተኛ እና ማህበረሰብን መሰረት ያደረገ",
    expertGuides: "ልምድ ያላቸው የሀገር ውስጥ አስጎብኚዎች",
    expertGuidesDesc: "ተጫዋች፣ ፕሮፌሽናል እና የሀገር ውስጥ",
    safeComfort: "ደህንነቱ የተጠበቀ እና ምቹ",
    safeComfortDesc: "ደህንነትዎ ቅድሚያ የምንሰጠው ጉዳይ ነው",
    sustainable: "ዘላቂ ቱሪዝም",
    sustainableDesc: "ተፈጥሮን እና ባህልን መጠበቅ"
  },
  search: {
    whereTo: "ወዴት?",
    whereToPlaceholder: "መዳረሻዎችን ይፈልጉ...",
    category: "ምን እየፈለጉ ነው?",
    categoryPlaceholder: "ምድብ ይምረጡ",
    duration: "ቆይታ",
    durationPlaceholder: "ማንኛውም ቆይታ",
    travelers: "ተጓዦች",
    travelersPlaceholder: "1 ተጓዥ",
    button: "አሁን ይፈልጉ",
    categories: {
      nature: "ተፈጥሮ",
      waterfalls: "ፏፏቴዎች",
      hiking: "የእግር ጉዞ",
      culture: "ባህል",
      heritage: "ቅርስ",
      festivals: "በዓላት"
    }
  }
};

enData.home.search = {
  ...enData.home.search,
  categories: {
    nature: "Nature",
    waterfalls: "Waterfalls",
    hiking: "Hiking",
    culture: "Culture",
    heritage: "Heritage",
    festivals: "Festivals"
  }
};

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
fs.writeFileSync(amPath, JSON.stringify(amData, null, 2));
console.log('Locales updated successfully');
