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
  
  console.log("--- DEBUGGING EMAIL ---");
  console.log("Method:", isBrevo ? "Brevo REST API" : "Gmail SMTP");
  console.log("------------------------");

  try {
    // If using Brevo, use their HTTP API directly to avoid Hugging Face Port Blocking (ETIMEDOUT)
    if (isBrevo && passKey.startsWith('xsmtpsib-')) {
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
      // Normal SMTP via Nodemailer
      return await transporter.sendMail({ from: fromEmail, to, subject, html })
    }
  } catch (error) {
    console.error("🟢 EMAIL SENDING ERROR DETAILS:", error);
    throw error;
  }
}
