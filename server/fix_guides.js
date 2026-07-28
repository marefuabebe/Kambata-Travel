require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const Guide = require("./models/Guide");
const User = require("./models/User");

mongoose.connect(process.env.DATABASE_URI)
  .then(async () => {
    const guides = await Guide.updateMany({ status: "verified" }, { $set: { status: "approved" } });
    console.log("Updated guides:", guides);
    const users = await User.updateMany({ guideStatus: "verified" }, { $set: { guideStatus: "approved" } });
    console.log("Updated users:", users);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
