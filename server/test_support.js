const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const axios = require("axios");
require("dotenv").config();
const User = require("./models/User");

mongoose.connect(process.env.DATABASE_URI).then(async () => {
  const user = await User.findOne();
  if (!user) { console.log("No user found"); process.exit(1); }
  
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
  try {
    const res = await axios.post("http://localhost:5000/api/support", {
      subject: "booking",
      message: "Test message"
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log(res.data);
  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
  }
  process.exit(0);
}).catch(console.error);
