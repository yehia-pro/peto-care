const nodemailer = require('nodemailer');
require('dotenv').config();

const port = Number(process.env.SMTP_PORT || 587);

console.log("Configuring transporter...");
console.log("Host:", process.env.SMTP_HOST);
console.log("Port:", port);
console.log("Secure:", port === 465);
console.log("User:", process.env.EMAIL_USER);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_USER || process.env.SMTP_USER,
      pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
    },
});

console.log("\nStarting email test...");
transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.EMAIL_USER || process.env.SMTP_USER || '',
    to: 'aymanyoussef219@gmail.com',
    subject: 'Brevo SMTP Test',
    html: '<p>Testing Brevo Connection</p>'
}).then(info => {
    console.log("✅ Email sent successfully!");
    console.log("Response:", info.response);
    console.log("Message ID:", info.messageId);
    process.exit(0);
}).catch(err => {
    console.error("❌ Failed to send email. SMTP Error Details:");
    console.error(err);
    process.exit(1);
});
