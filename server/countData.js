const mongoose = require('mongoose');
require('dotenv').config();
const Tour = require('./models/Tour');
const Booking = require('./models/Booking');
const PackageBooking = require('./models/PackageBooking');

mongoose.connect(process.env.DATABASE_URI).then(async () => {
  const c = await Booking.countDocuments();
  console.log("Total Bookings:", c);
  const pb = await PackageBooking.countDocuments();
  console.log("Total PackageBookings:", pb);
  const t = await Tour.countDocuments();
  console.log("Total Tours:", t);
  process.exit(0);
});
