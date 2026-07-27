const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: 'process.env.TEST_EMAIL_USER',
    pass: 'process.env.TEST_EMAIL_PASS'
  }
});
transporter.sendMail({
  from: '"Kambata Travel" <noreply@kambatatravel.com>',
  to: 'b0ee08001@smtp-brevo.com',
  subject: 'Test Email',
  text: 'This is a test'
}, function(error, info) {
  if (error) {
    console.log('Send Error:', error);
  } else {
    console.log('Email sent:', info.response);
  }
});
