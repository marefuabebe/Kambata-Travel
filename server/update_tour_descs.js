const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./models/Tour');

dotenv.config();

const updates = {
  "Sarobira Highlands": {
    en: "Embark on an unforgettable trek through the lush Sarobira Highlands. Discover ancient terraced farming, immerse yourself in untouched nature, and capture spectacular panoramic photos of the rolling emerald hills.",
    am: "በለምለም የሳሮቢታ ተራራማ አካባቢዎች የማይረሳ የእግር ጉዞ ያድርጉ።"
  },
  "Mount Hambarcho": {
    en: "Conquer the legendary Mount Hambarcho, Kambata's most iconic peak. This thrilling ascent rewards you with breathtaking 360-degree views of the Great Rift Valley and a sense of true accomplishment.",
    am: "የከምባታን ታዋቂ የሆነውን የሀምባሪቾ ተራራን ይውጡ።"
  },
  "Durame Town": {
    en: "Dive into the vibrant heart of Kambata in Durame Town. Wander through bustling local markets, savor authentic Ethiopian coffee ceremonies, and experience the warm, welcoming culture of the local community.",
    am: "በዱራሜ ከተማ ውስጥ የከምባታን የነቃ ባህል ይለማመዱ።"
  },
  "Ajora Falls": {
    en: "Witness the awe-inspiring power of the twin Ajora Falls as they plunge dramatically into a deep gorge. A magnificent natural wonder perfect for sightseeing, relaxation, and connecting with nature.",
    am: "ወደ ጥልቅ ገደል የሚወርደውን አስደናቂውን የአጆራ ፏፏቴን ይመልከቱ።"
  }
};

const run = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    
    for (const [title, desc] of Object.entries(updates)) {
      await Tour.updateMany(
        { "title.en": title },
        { $set: { "description.en": desc.en, "description.am": desc.am } }
      );
      console.log(`Updated description for ${title}`);
    }

    console.log("All descriptions updated!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
