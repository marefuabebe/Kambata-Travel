const mongoose = require('mongoose');
require('dotenv').config();
const TourRequest = require('./models/TourRequest');

mongoose.connect(process.env.DATABASE_URI).then(async () => {
  const result = await TourRequest.updateMany(
    { status: 'expired' },
    { $set: { status: 'payment_expired' } }
  );
  console.log('Fixed', result.modifiedCount, 'requests');
  process.exit(0);
}).catch(console.error);
