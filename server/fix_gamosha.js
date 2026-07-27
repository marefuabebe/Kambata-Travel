const mongoose = require('mongoose');
require('dotenv').config();
const TourRequest = require('./models/TourRequest');
require('./models/Tour');
require('./models/Package');
require('./models/User');
require('./models/Guide');

mongoose.connect(process.env.DATABASE_URI).then(async () => {
  const requests = await TourRequest.find({ status: 'payment_expired' }).populate('tourId packageId');
  
  let fixedCount = 0;
  for (const req of requests) {
    const title = req.tourId ? req.tourId.title.en : (req.packageId ? req.packageId.name.en : '');
    
    // If it's NOT Travel Experience (or if it IS Gamosha Hot Spring Retreat), change it back to 'expired'
    if (title && title.includes('Gamosha')) {
      req.status = 'expired';
      await req.save();
      fixedCount++;
    }
  }
  
  console.log('Fixed', fixedCount, 'requests back to expired');
  process.exit(0);
}).catch(console.error);
