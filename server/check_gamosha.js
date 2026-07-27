const mongoose = require('mongoose');
require('dotenv').config();
const TourRequest = require('./models/TourRequest');
require('./models/Tour');
require('./models/Package');

mongoose.connect(process.env.DATABASE_URI).then(async () => {
  const requests = await TourRequest.find().populate('tourId packageId');
  for (const req of requests) {
    const title = req.tourId ? req.tourId.title.en : (req.packageId ? req.packageId.name.en : '');
    if (title.includes('Gamosha')) {
      console.log('Gamosha Request:', {
        id: req._id,
        status: req.status,
        preferredDate: req.preferredDate,
        now: new Date()
      });
    }
  }
  process.exit(0);
}).catch(console.error);
