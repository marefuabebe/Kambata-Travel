const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/kambata-travel').then(async () => {
  const TourRequest = require('./server/models/TourRequest');
  const guideId = '6a196bae0d579e5460a6c6b8'; // Johon
  const requests = await TourRequest.find({
    assignedGuide: guideId,
    status: { $in: ["guide_pending", "awaiting_payment", "confirmed", "declined_by_guide", "expired"] }
  })
    .populate("tourId", "title")
    .populate("packageId", "name")
    .populate("user", "name email")
    .sort("-createdAt")
    .lean();
  
  console.log(JSON.stringify(requests, null, 2));
  process.exit(0);
});
