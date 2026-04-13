import nodemailer from 'nodemailer'

// Use Brevo (recommended) or Gmail as fallback
// Brevo: free 300 emails/day, professional sender name
// Setup: https://brevo.com → SMTP & API → Generate SMTP Key
const isBrevo = process.env.SMTP_HOST?.includes('brevo') || process.env.EMAIL_PROVIDER === 'brevo';

const port = Number(process.env.SMTP_PORT || 587);

// Only used for Gmail Fallback now
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER,
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
  },
})

export const sendEmail = async (to: string, subject: string, html: string) => {
  const fromEmail = process.env.SMTP_FROM || process.env.EMAIL_USER || process.env.SMTP_USER || '';
  const passKey = process.env.EMAIL_PASS || process.env.SMTP_PASS || '';
  
  // Decide whether to use HTTP API (if it's a Brevo API Key) or SMTP
  const useHttpApi = isBrevo && passKey.startsWith('xkeysib-');

  console.log("--- DEBUGGING EMAIL ---");
  console.log("Method:", useHttpApi ? "Brevo REST API" : (isBrevo ? "Brevo SMTP" : "Gmail SMTP"));
  console.log("Key Starts with:", passKey.substring(0, 10));
  console.log("------------------------");

  try {
    // If using Brevo HTTP API to avoid Hugging Face Port Blocking (ETIMEDOUT)
    if (useHttpApi) {
      // Extract clean email address if it's formatted like "Name <email@domain.com>"
      const rawEmail = fromEmail.match(/<([^>]+)>/)?.[1] || fromEmail;
      
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': passKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { 
            name: "Euphoria Pet Care", 
            email: rawEmail || "a4bd8d001@smtp-brevo.com" 
          },
          to: [{ email: to }],
          subject: subject,
          htmlContent: html
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Brevo API Failed: ${response.status} ${errorText}`);
      }
      
      return await response.json();
    } else {
      // Normal SMTP via Nodemailer (fallback)
      // Note: If on Hugging Face, Brevo SMTP via 587/465 might timeout.
      // But we will use port 2525 if provided in environment, which HF allows.
      const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER || '';
      const fallbackTransporter = isBrevo ? nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: port === 587 || port === 465 ? 2525 : port, // Force 2525 for HF compatibility
        secure: false, // 2525 doesn't use forced SSL
        auth: {
          user: smtpUser, // Must be EMAIL_USER (e.g. a4bd8d001@smtp-brevo.com), NOT the display From address
          pass: passKey,
        },
      }) : transporter;

      return await fallbackTransporter.sendMail({ from: fromEmail, to, subject, html })
    }
  } catch (error) {
    console.error("🟢 EMAIL SENDING ERROR DETAILS:", error);
    throw error;
  }
}
