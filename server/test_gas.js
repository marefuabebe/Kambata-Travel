const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby6uIUKlFL1dA1X5PHdffgk0e7bZCAHtPgxPV3Hc_d3X5zxd-T4dNrMImu0q5bIwK0v/exec";
const payload = {
  token: "kambata-secret-12345",
  to: "technovaofficial78@gmail.com",
  subject: "Test from Server",
  html: "<p>Hello</p>"
};

fetch(GOOGLE_SCRIPT_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
})
.then(res => res.text())
.then(console.log)
.catch(console.error);
