const fs = require('fs');

const enPath = 'frontend/src/locales/en.json';
const amPath = 'frontend/src/locales/am.json';

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const amData = JSON.parse(fs.readFileSync(amPath, 'utf8'));

amData.home = {
  ...amData.home,
  categoryTag: "ፍላጎትዎን ያግኙ",
  categoryTitle: "በምድብ ያስሱ",
  destinationsTag: "ዋና ዋና መዳረሻዎች",
  destinationsTitle: "ታዋቂ መዳረሻዎች",
  inKambata: "በከምባታ",
  expTag: "እውነተኛውን ከምባታን ይለማመዱ",
  expCulture: "ባህል።",
  expNature: "ተፈጥሮ።",
  expPeople: "ህዝብ።",
  expAllInOne: "ሁሉም በአንድ ቦታ።",
  eventsComingSoon: "በቅርብ ቀን ....",
  masalaFestival: "የማሳላ በዓል",
  toursTag: "ተመራጭ ጉብኝቶች",
  whyTravelers: "ተጓዦች ከምባታን ለምን ይወዳሉ",
  faqTitle: "ተደጋግመው የሚነሱ ጥያቄዎች",
  ctaTag: "ለቀጣዩ ጀብዱዎ ዝግጁ ነዎት?",
  ctaTitle: "ከምባታን አብረን እናስስ!",
  ctaWhether: "ጀብዱን እየፈለጉም ይሁን",
  ctaRelaxation: "መዝናናት",
  ctaCulture: "ባህል",
  ctaOrNature: "ወይም ተፈጥሮ",
  ctaHasSomething: "— ከምባታ ለእርስዎ የማይረሳ ነገር አለው።",
  bookTour: "ጉብኝት ይመዝገቡ",
  contactUs: "ያግኙን"
};

enData.home = {
  ...enData.home,
  categoryTag: "DISCOVER YOUR PASSION",
  categoryTitle: "Explore By Category",
  destinationsTag: "TOP DESTINATIONS",
  destinationsTitle: "Popular Destinations",
  inKambata: "in Kambata",
  expTag: "EXPERIENCE THE REAL KAMBATA",
  expCulture: "Culture.",
  expNature: "Nature.",
  expPeople: "People.",
  expAllInOne: "All in One Place.",
  eventsComingSoon: "COMING SOON ....",
  masalaFestival: "Masala Festival",
  toursTag: "FEATURED TOURS",
  whyTravelers: "WHY TRAVELERS LOVE KAMBATA",
  faqTitle: "Frequently Asked Questions",
  ctaTag: "READY FOR YOUR NEXT ADVENTURE?",
  ctaTitle: "Let's Explore Kambata Together!",
  ctaWhether: "Whether you're looking for adventure",
  ctaRelaxation: "relaxation",
  ctaCulture: "culture",
  ctaOrNature: "or nature",
  ctaHasSomething: "— Kambata has something unforgettable for you.",
  bookTour: "Book a Tour",
  contactUs: "Contact Us"
};

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
fs.writeFileSync(amPath, JSON.stringify(amData, null, 2));
console.log('Locales updated successfully');
