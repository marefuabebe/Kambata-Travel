const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby6uIUKlFL1dA1X5PHdffgk0e7bZCAHtPgxPV3Hc_d3X5zxd-T4dNrMImu0q5bIwK0v/exec";
const payload = {
  token: "kambata-secret-12345",
  to: "technovaofficial78@gmail.com",
  subject: "Kambata Travel System Diagnostics - " + Math.random(),
  html: "<h2>Testing Google Apps Script</h2><p>If you see this, the API works!</p>"
};

fetch(GOOGLE_SCRIPT_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
})
.then(res => res.text())
.then(console.log)
.catch(console.error);
