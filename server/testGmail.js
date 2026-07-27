const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'kambatatravel@gmail.com',
    pass: 'gnyrrwgtjyzpnqkt'
  }
});
transporter.sendMail({
  from: '"Kambata Travel" <kambatatravel@gmail.com>',
  to: 'devmareab@gmail.com',
  subject: 'Test Email from Gmail SMTP',
  text: 'This is a test from the backend to verify Gmail SMTP works.'
}, function(error, info) {
  if (error) {
    console.log('Send Error:', error);
  } else {
    console.log('Email sent:', info.response);
  }
});
