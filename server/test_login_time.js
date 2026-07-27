const http = require('http');

console.time('login_req');

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  res.on('data', () => {});
  res.on('end', () => {
    console.timeEnd('login_req');
  });
});

req.write(JSON.stringify({ email: 'test@example.com', password: 'password123' }));
req.end();
