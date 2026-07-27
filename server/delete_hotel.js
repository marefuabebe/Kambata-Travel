const mongoose = require('mongoose');
const Hotel = require('./models/Hotel');

mongoose.connect('mongodb://localhost:27017/kambata-travel')
  .then(async () => {
    const result = await Hotel.deleteMany({ name: { $in: [/Aberash/i, /Mintesnot/i] } });
    console.log("Deleted Hotels:", result);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
