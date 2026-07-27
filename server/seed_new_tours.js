const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./models/Tour');

dotenv.config();

const guideId = "69e233a79d976052e7f21da9";

const newTours = [
  {
    title: {
      en: "Durame Town Cultural Expedition",
      am: "የዱራሜ ከተማ ባህላዊ ጉብኝት"
    },
    description: {
      en: "Explore the vibrant heart of the Kembata zone. This guided walk takes you through bustling local markets, traditional coffee roasteries, and includes a private session with local elders to learn about the 'Sera' indigenous governance.",
      am: "የከምባታ ባህል ንቁ ማዕከልን ይጎብኙ። ይህ የሚመራ የእግር ጉዞ በደመቁ የሀገር ውስጥ ገበያዎች፣ በባህላዊ የቡና ጥበብ እና ከሀገር ሽማግሌዎች ጋር ስለ 'ሰራ' ስርዓት የሚደረግ ውይይትን ያካትታል።"
    },
    category: "Culture",
    destination: "69e11889c7673d883d19e205",
    createdBy: guideId,
    price: 45,
    duration: { value: 1, unit: "days" },
    difficulty: "easy",
    maxCapacity: 12,
    images: ["https://res.cloudinary.com/dzf4st3t2/image/upload/v1776359613/kambata-travel/destinations/Durame_yol7k6.png"],
    isPublished: true,
    rating: { average: 4.8, numReviews: 12 },
    facilities: ["local_guide_required", "coffee_ceremony", "photography_allowed"]
  },
  {
    title: {
      en: "Sarobira Landscapes & Highlands Trek",
      am: "የሳሮቢታ ተራራማ አካባቢዎች ጉዞ"
    },
    description: {
      en: "A mesmerizing journey through the rolling green hills of Sarobira. Witness the ancient Enset agricultural systems that have sustained the highlands for millennia. Perfect for nature lovers and landscape photographers.",
      am: "በሳሮቢታ ለምለም ኮረብታዎች ውስጥ የሚደረግ ማራኪ ጉዞ። የደጋውን አካባቢ ለሺህ ዓመታት ያቆየውን ጥንታዊ የእንሰት እርሻ ስርዓት ይመልከቱ። ለተፈጥሮ ወዳጆች እና ፎቶግራፍ አንሺዎች ፍጹም ነው።"
    },
    category: "Nature",
    destination: "69e11889c7673d883d19e206",
    createdBy: guideId,
    price: 85,
    duration: { value: 2, unit: "days" },
    difficulty: "moderate",
    maxCapacity: 8,
    images: ["https://res.cloudinary.com/dzf4st3t2/image/upload/v1776362718/Gemini_Generated_Image_bmo32hbmo32hbmo3_axyzig.png"],
    isPublished: true,
    rating: { average: 4.9, numReviews: 8 },
    facilities: ["hiking_required", "local_guide_required", "drinking_water_provided"]
  },
  {
    title: {
      en: "Grand Masala Festival Experience",
      am: "ታላቁ የማሳላ በዓል ተሞክሮ"
    },
    description: {
      en: "The ultimate cultural immersion. Celebrate the Kembata New Year atop the sacred Mount Hambaricho. Experience the Demera bonfire, communal Atakana dining, and traditional Shall dances in their traditional setting.",
      am: "የከምባታን አዲስ ዓመት በተቀደሰው የሀምባሪቾ ተራራ ላይ ያክብሩ። የደመራ እሳትን፣ የጋራ የአታካና አመጋገብን እና ባህላዊ የሻላ ጭፈራዎችን በወቅቱ እና በቦታው ይለማመዱ።"
    },
    category: "Heritage",
    destination: "69e11889c7673d883d19e203",
    createdBy: guideId,
    price: 120,
    duration: { value: 3, unit: "days" },
    difficulty: "moderate",
    maxCapacity: 15,
    images: ["https://res.cloudinary.com/dzf4st3t2/image/upload/v1776594871/2b4e84d7-7330-4570-9b1a-40026b7ef58d_raoclx.jpg"],
    isPublished: true,
    rating: { average: 5.0, numReviews: 24 },
    facilities: ["local_guide_required", "indigenous_food", "religious_site_etiquette", "photography_allowed"]
  }
];

const seedTours = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    // We keep existing tours and just add these three new specific ones
    // Or we could check if they already exist
    for (const tourData of newTours) {
      const exists = await Tour.findOne({ "title.en": tourData.title.en });
      if (!exists) {
        await Tour.create(tourData);
        console.log(`Created tour: ${tourData.title.en}`);
      } else {
        console.log(`Tour already exists: ${tourData.title.en}`);
      }
    }

    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding tours:', error);
    process.exit(1);
  }
};

seedTours();
