const sendEmail = require("./utils/sendEmail.js");
sendEmail({
  to: "technovaofficial78@gmail.com",
  subject: "Testing Backend Code",
  html: "<p>Does this work?</p>"
}).then(() => console.log("Done")).catch(console.error);
