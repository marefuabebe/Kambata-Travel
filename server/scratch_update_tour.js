const mongoose = require('mongoose');

const updateTour = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/kambata-travel');
    console.log('Connected to DB');

    const db = mongoose.connection.db;
    const toursCollection = db.collection('tours');

    // Find the Sarobira Highlands tour
    const tour = await toursCollection.findOne({
      $or: [
        { 'title.en': { $regex: /Sarobira Highlands/i } },
        { title: { $regex: /Sarobira Highlands/i } }
      ]
    });

    if (!tour) {
      console.log('Tour not found!');
      process.exit(1);
    }

    console.log(`Found tour: ${tour.title.en || tour.title}`);

    // Update images
    const newImageUrl = "https://res.cloudinary.com/dzf4st3t2/image/upload/v1776362718/Gemini_Generated_Image_bmo32hbmo32hbmo3_axyzig.png";

    await toursCollection.updateOne(
      { _id: tour._id },
      { 
        $set: { 
          images: [newImageUrl],
          image: newImageUrl
        } 
      }
    );

    console.log('Successfully updated tour images');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

updateTour();
