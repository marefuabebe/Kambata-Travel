const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./models/Tour');
const Destination = require('./models/Destination');

dotenv.config();

const guideId = "69e233a79d976052e7f21da9";

const seedTours = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    console.log('Connected to MongoDB...');

    const dest = await Destination.findOne();
    const destId = dest ? dest._id : "69e11889c7673d883d19e205";

    const newTour = {
      title: {
        en: "The Majestic Doje'e Waterfall",
        am: "ግርማ ሞገስ ያለው የዶጄ ፏፏቴ"
      },
      description: {
        en: "Experience the breathtaking beauty of The Majestic Doje'e Waterfall, a hidden gem nestled deep within the lush landscapes of Kambata. Feel the mist and power of the cascading waters.",
        am: "በከምባታ ለምለም መልክዓ ምድር ውስጥ የተደበቀውን ድንቅ የዶጄ ፏፏቴን ይጎብኙ።"
      },
      category: "Nature",
      destination: destId,
      createdBy: guideId,
      price: 60,
      duration: { value: 1, unit: "days" },
      difficulty: "easy",
      maxCapacity: 15,
      images: ["https://res.cloudinary.com/dzf4st3t2/image/upload/v1782053030/kambata/g146rbijvhsiwutsgf3x.jpg"],
      isPublished: true,
      rating: { average: 5.0, numReviews: 10 },
      facilities: ["local_guide_required", "photography_allowed", "drinking_water_provided"]
    };

    const exists = await Tour.findOne({ "title.en": newTour.title.en });
    if (!exists) {
      await Tour.create(newTour);
      console.log(`Created tour: ${newTour.title.en}`);
    } else {
      console.log(`Tour already exists: ${newTour.title.en}`);
    }

    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding tours:', error);
    process.exit(1);
  }
};

seedTours();
