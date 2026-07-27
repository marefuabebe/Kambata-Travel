require('dotenv').config({ path: 'c:/kambata-travel/server/.env' });
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
transporter.sendMail({
  from: '"Kambata Travel" <' + process.env.EMAIL_USER + '>',
  to: 'kambatatravel@gmail.com',
  subject: 'Test Email from Node',
  text: 'This is a test email'
}).then(info => console.log('Success:', info.messageId))
  .catch(err => console.error('Error:', err));
