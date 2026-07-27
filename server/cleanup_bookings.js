const mongoose = require('mongoose');
const PackageBooking = require('./models/PackageBooking');

mongoose.connect('mongodb://localhost:27017/kambata-travel').then(async () => {
  const result = await PackageBooking.deleteMany({ bookingStatus: 'pending' });
  console.log(`Deleted ${result.deletedCount} pending package bookings.`);
  process.exit(0);
});
