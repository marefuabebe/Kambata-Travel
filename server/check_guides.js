const mongoose = require('mongoose');

async function checkAvailability() {
  try {
    await mongoose.connect('mongodb://localhost:27017/kambata-travel');
    const Guide = require('./models/Guide');
    const User = require('./models/User');
    const Tour = require('./models/Tour');
    
    // Find all approved guides
    const guides = await Guide.find({ status: 'approved', isVerified: true }).populate('user', 'name email');
    console.log('--- Approved Guides ---');
    guides.forEach(g => console.log(`Guide: ${g.user.name} (${g.user._id})`));
    
    // Find tours overlapping July 6 to July 8, 2026
    const startD = new Date('2026-07-06T00:00:00Z');
    const endD = new Date('2026-07-08T23:59:59Z');
    
    const tours = await Tour.find({});
    console.log('\n--- Conflicting Tour Schedules (July 6-8) ---');
    
    const conflicts = {}; // GuideId -> count
    
    tours.forEach(t => {
      t.schedules.forEach(s => {
        if (s.status === 'cancelled') return;
        const sStart = new Date(s.startDate);
        const sEnd = new Date(s.endDate);
        if (sStart <= endD && sEnd >= startD) {
           console.log(`- ${t.title?.en || t.title} (${sStart.toISOString().split('T')[0]} to ${sEnd.toISOString().split('T')[0]}) -> Guide ID: ${s.guide}`);
           conflicts[s.guide.toString()] = true;
        }
      });
    });
    
    console.log('\n--- Availability Result ---');
    guides.forEach(g => {
       const isAvailable = !conflicts[g.user._id.toString()];
       console.log(`${g.user.name}: ${isAvailable ? 'AVAILABLE ✅' : 'CONFLICT ❌'}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkAvailability();
