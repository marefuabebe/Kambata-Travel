const mongoose = require('mongoose');
const User = require('./models/User');
const Guide = require('./models/Guide');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

async function fixStuckGuides() {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    console.log('Connected to DB');

    // Find all pending guides
    const pendingGuides = await User.find({ role: 'guide', guideStatus: 'pending' });
    let fixed = 0;

    for (const user of pendingGuides) {
      const guide = await Guide.findOne({ user: user._id });
      
      const bio = guide?.bio?.en || guide?.bio || "";
      const hasBio = bio.trim().length >= 50;
      const hasContact = Boolean(user.phone && user.location);
      const hasSpecialties = Array.isArray(guide?.specialties) && guide.specialties.length >= 1;
      const hasLanguages = Array.isArray(guide?.languages) && guide.languages.length >= 1;
      const hasNationalId = Boolean(guide?.nationalId?.url);
      const hasLicense = Boolean(guide?.license?.url);
      
      const isReady = hasBio && hasContact && hasSpecialties && hasLanguages && hasNationalId && hasLicense;

      // If they are pending but NOT ready, they bypassed the flow. Reset them to 'none'.
      if (!isReady) {
        console.log(`Fixing user: ${user.email}`);
        user.guideStatus = 'none';
        await user.save();
        fixed++;
      }
    }

    console.log(`Fixed ${fixed} users.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixStuckGuides();
