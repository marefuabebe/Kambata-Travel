const mongoose = require('mongoose');
const PackageBooking = require('./models/PackageBooking');

mongoose.connect('mongodb://localhost:27017/kambata-travel').then(async () => {
  const bookings = await PackageBooking.find({}).lean();
  console.log(`Found ${bookings.length} package bookings.`);
  
  bookings.forEach(b => {
    console.log(`- ${b._id}: status=${b.bookingStatus}, paymentStatus=${b.paymentStatus}`);
  });
  process.exit(0);
});
