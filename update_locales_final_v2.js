const fs = require('fs');

const enPath = 'frontend/src/locales/en.json';
const amPath = 'frontend/src/locales/am.json';

const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const amData = JSON.parse(fs.readFileSync(amPath, 'utf8'));

enData.home.faq = {
  q1: "How do I book a tour?",
  a1: "You can book a tour directly through our website by browsing the Tours page, selecting your preferred package, and following the easy checkout process.",
  q2: "Do you support offline booking?",
  a2: "Yes! If you prefer to book in person or pay via bank transfer, you can visit our Kambata Zone office in Durame town or call our support line.",
  q3: "Can I cancel my booking?",
  a3: "Absolutely. We offer a full refund if you cancel at least 48 hours before your scheduled tour date. Please check our cancellation policy for more details.",
  q4: "Is transportation included?",
  a4: "Most of our guided tours include local transportation from Durame town to the destination. However, this varies by package, so please check the specific tour details.",
  q5: "Are guides local?",
  a5: "Yes, all our guides are certified locals from the Kambata region. They offer deep cultural insights and know the history and hidden gems of the area intimately."
};

enData.home.stats = {
  destinations: "Destinations<br />To Explore",
  travelers: "Happy<br />Travelers",
  guides: "Local Guides<br />& Experts",
  satisfaction: "Satisfaction<br />Rate"
};

enData.home.tours = {
  perPerson: "per person",
  viewAll: "View All Tours"
};

amData.home.faq = {
  q1: "እንዴት ጉብኝት እመዘገባለሁ?",
  a1: "ጉብኝቶችን በቀጥታ በድረ-ገጻችን በኩል የጉብኝቶች ገጽን በማሰስ፣ የሚመርጡትን ጥቅል በመምረጥ እና ቀላል የክፍያ ሂደትን በመከተል መመዝገብ ይችላሉ።",
  q2: "በአካል ቀርቦ መመዝገብ ይቻላል?",
  a2: "አዎ! በአካል ቀርበው መመዝገብ ወይም በባንክ ማስተላለፍ መክፈል ከፈለጉ፣ በዱራሜ ከተማ የሚገኘውን የከምባታ ዞን ቢሯችንን መጎብኘት ወይም የድጋፍ መስመራችንን መደወል ይችላሉ።",
  q3: "ምዝገባዬን መሰረዝ እችላለሁ?",
  a3: "በእርግጥ። ከተያዘለት የጉብኝት ቀን ቢያንስ ከ48 ሰዓታት በፊት ከሰረዙ ሙሉ ገንዘብ እንመልሳለን። ለተጨማሪ ዝርዝሮች እባክዎ የስረዛ ፖሊሲያችንን ይመልከቱ።",
  q4: "ትራንስፖርት ተካቷል?",
  a4: "አብዛኛዎቹ የእኛ የተመሩ ጉብኝቶች ከዱራሜ ከተማ ወደ መድረሻው የአካባቢ ትራንስፖርትን ያካትታሉ። ሆኖም ይህ በጥቅሉ ላይ ስለሚለያይ እባክዎ የተወሰኑ የጉብኝት ዝርዝሮችን ያረጋግጡ።",
  q5: "አስጎብኚዎች የአካባቢው ተወላጆች ናቸው?",
  a5: "አዎ፣ ሁሉም አስጎብኚዎቻችን ከከምባታ ክልል የተረጋገጡ የአካባቢው ተወላጆች ናቸው። ጥልቅ ባህላዊ ግንዛቤዎችን ይሰጣሉ እናም የአካባቢውን ታሪክ እና የተደበቁ እንቁዎች በቅርበት ያውቃሉ።"
};

amData.home.stats = {
  destinations: "የሚዳሰሱ<br />መዳረሻዎች",
  travelers: "ደስተኛ<br />ተጓዦች",
  guides: "የአካባቢ አስጎብኚዎች<br />እና ባለሙያዎች",
  satisfaction: "የእርካታ<br />መጠን"
};

amData.home.tours = {
  perPerson: "ለአንድ ሰው",
  viewAll: "ሁሉንም ጉብኝቶች ይመልከቱ"
};

fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
fs.writeFileSync(amPath, JSON.stringify(amData, null, 2));
console.log('Locales updated successfully');
