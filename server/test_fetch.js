const mongoose = require('mongoose');
const PackageBooking = require('./models/PackageBooking');

mongoose.connect('mongodb://localhost:27017/kambata-travel').then(async () => {
  const pkg = await PackageBooking.findOne({ _id: '6a5ad5e46e7b04d296f8ac3c' })
    .populate({
      path: "packageId",
      select: "name basePrice duration",
      populate: [
        { path: "tour", select: "images" },
        { path: "hotel", select: "name location" }
      ]
    })
    .populate("packageScheduleId", "date endDate startTime")
    .lean();
    
  console.log(JSON.stringify(pkg, null, 2));
  process.exit(0);
});
