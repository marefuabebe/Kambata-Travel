require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const users = await User.find({ email: { $regex: "devmar" } }, "email isEmailVerified").lean();
    console.log("Users found:", users);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
