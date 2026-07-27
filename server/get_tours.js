const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./models/Tour');

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    const tours = await Tour.find({});
    for (const t of tours) {
      console.log(`ID: ${t._id}`);
      console.log(`Title EN: ${t.title?.en}`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
run();
