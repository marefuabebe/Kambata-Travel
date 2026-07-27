const mongoose = require('mongoose');
require('dotenv').config();
const TourRequest = require('./models/TourRequest');
require('./models/Tour');
require('./models/Package');

mongoose.connect(process.env.DATABASE_URI).then(async () => {
  const requests = await TourRequest.find().populate('tourId packageId');
  
  let count = 0;
  for (const req of requests) {
    const title = req.tourId ? req.tourId.title.en : (req.packageId ? req.packageId.name.en : '');
    if (title.includes('Gamosha')) {
      // Set the date back to June 27, 2026
      const pastDate = new Date('2026-06-27T00:00:00.000Z');
      
      req.preferredDate = pastDate;
      req.status = 'expired';
      await req.save();
      count++;
      console.log('Reverted Gamosha request. New date:', req.preferredDate);
    }
  }
  
  console.log('Done fixing', count, 'requests.');
  process.exit(0);
}).catch(console.error);
