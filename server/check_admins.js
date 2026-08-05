const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.DATABASE_URI).then(async () => {
  const User = require('./models/User');
  const admins = await User.find({ role: 'admin' }, 'email name role');
  console.log('ADMIN ACCOUNTS FOUND:', admins.length);
  console.log(JSON.stringify(admins, null, 2));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
