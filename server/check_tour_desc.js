const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./models/Tour');

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URI);
    const tours = await Tour.find({}, 'title description shortDescription');
    for (const t of tours) {
      console.log(`Title: ${t.title?.en || t.title}`);
      console.log(`Desc: ${t.description?.en || t.description}`);
      console.log('---');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
run();
