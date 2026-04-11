import nodemailer from 'nodemailer';

// Configure email service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password' // Use App Password for Gmail
  }
});

export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'your-email@gmail.com',
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>إعادة تعيين كلمة المرور</h2>
        <p>مرحباً،</p>
        <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. إذا لم تكن أنت من طلب ذلك، فيمكنك تجاهل هذه الرسالة.</p>
        <p>لإعادة تعيين كلمة المرور الخاصة بك، يرجى النقر على الرابط التالي:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            إعادة تعيين كلمة المرور
          </a>
        </p>
        <p>أو انسخ والصق الرابط التالي في متصفحك:</p>
        <p style="word-break: break-all;">${resetUrl}</p>
        <p>هذا الرابط سيكون صالحاً لمدة ساعة واحدة فقط.</p>
        <hr>
        <p>مع أطيب التمنيات،<br>فريق التطبيق</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Failed to send reset email' };
  }
};

export const sendPasswordChangedEmail = async (email) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'your-email@gmail.com',
    to: email,
    subject: 'تم تغيير كلمة المرور بنجاح',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>تم تغيير كلمة المرور بنجاح</h2>
        <p>مرحباً،</p>
        <p>تم تغيير كلمة المرور الخاصة بحسابك بنجاح.</p>
        <p>إذا لم تقم بهذا التغيير، يرجى الاتصال بفريق الدعم على الفور.</p>
        <hr>
        <p>مع أطيب التمنيات،<br>فريق التطبيق</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending password changed email:', error);
  }
};
