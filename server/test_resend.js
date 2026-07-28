const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY || 'your_resend_api_key_here');
resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'abebetegegn63@gmail.com',
  subject: 'Test Email',
  html: '<p>Test</p>'
}).then(console.log).catch(console.error);
