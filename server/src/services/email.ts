import nodemailer from 'nodemailer'

// Use Brevo (recommended) or Gmail as fallback
// Brevo: free 300 emails/day, professional sender name
// Setup: https://brevo.com → SMTP & API → Generate SMTP Key
const isBrevo = process.env.SMTP_HOST?.includes('brevo') || process.env.EMAIL_PROVIDER === 'brevo';

const port = Number(process.env.SMTP_PORT || 587);

const transporter = nodemailer.createTransport(
  isBrevo
    ? {
        // Brevo SMTP (recommended - free 300/day, professional)
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: port,
        secure: port === 465,
        auth: {
          user: process.env.EMAIL_USER || process.env.SMTP_USER,
          pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
        },
      }
    : {
        // Gmail fallback (needs App Password + 2FA enabled)
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || process.env.SMTP_USER,
          pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
        },
      }
)

export const sendEmail = async (to: string, subject: string, html: string) => {
  const from = process.env.SMTP_FROM || process.env.EMAIL_USER || process.env.SMTP_USER || ''
  
  console.log("--- DEBUGGING SMTP CREDENTIALS ---");
  console.log("USER:", process.env.EMAIL_USER);
  console.log("PASS Length:", process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : "UNDEFINED");
  console.log("PASS Starts with:", process.env.EMAIL_PASS ? process.env.EMAIL_PASS.substring(0, 10) : "UNDEFINED");
  console.log("----------------------------------");

  try {
    return await transporter.sendMail({ from, to, subject, html })
  } catch (error) {
    console.log("SMTP ERROR DETAILS:", error);
    throw error;
  }
}
