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
        en: "Gamosha Hot Spring Retreat",
        am: "የጋሞሻ ፍል ውሃ መዝናኛ"
      },
      description: {
        en: "Relax and rejuvenate in the healing, natural thermal waters of Gamosha Hot Spring. Surrounded by peaceful nature, it is the perfect spot for wellness and relaxation after a long trek in the Kambata highlands.",
        am: "በተፈጥሯዊ የጋሞሻ ፍል ውሃ ዘና ይበሉ።"
      },
      category: "Relax",
      destination: destId,
      createdBy: guideId,
      price: 40,
      duration: { value: 1, unit: "days" },
      difficulty: "easy",
      maxCapacity: 20,
      images: ["https://res.cloudinary.com/dzf4st3t2/image/upload/v1782037934/kambata/ovq6lovr2deyvofv0eyi.png"],
      isPublished: true,
      rating: { average: 4.8, numReviews: 32 },
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
