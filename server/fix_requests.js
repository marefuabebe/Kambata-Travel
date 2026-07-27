const mongoose = require('mongoose');
require('dotenv').config();
const TourRequest = require('./models/TourRequest');
const Tour = require('./models/Tour');
const PackageSchedule = require('./models/PackageSchedule');

mongoose.connect(process.env.DATABASE_URI).then(async () => {
  const requests = await TourRequest.find({ status: 'converted_to_schedule', assignedGuide: { $exists: false } });
  for(let req of requests) {
    if(req.assignedSchedule) {
      if(req.tourId) {
        const tour = await Tour.findOne({ 'schedules._id': req.assignedSchedule });
        if(tour) {
          const schedule = tour.schedules.id(req.assignedSchedule);
          if(schedule && schedule.guide) {
            req.assignedGuide = schedule.guide;
            await req.save();
            console.log('Fixed tour request:', req._id);
          }
        }
      } else if (req.packageId) {
        const sch = await PackageSchedule.findById(req.assignedSchedule);
        if(sch && sch.assignedGuide) {
          req.assignedGuide = sch.assignedGuide;
          await req.save();
          console.log('Fixed package request:', req._id);
        }
      }
    }
  }
  console.log('Done fixing existing requests');
  process.exit(0);
});
