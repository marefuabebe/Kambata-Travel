const bcrypt = require("bcryptjs");
console.time("hash");
bcrypt.hash("password", 10).then(h => {
  console.timeEnd("hash");
  console.time("compare");
  bcrypt.compare("password", h).then(r => {
    console.timeEnd("compare");
  });
});
