import express from 'express';
import User from '../models/user.model.js';
import { sendPasswordResetEmail, sendPasswordChangedEmail } from '../utils/emailService.js';
import crypto from 'crypto';

const router = express.Router();

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'البريد الإلكتروني مطلوب' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // For security, don't reveal if the email exists or not
      return res.json({ 
        message: 'إذا كان البريد الإلكتروني مسجلاً، سيصلك رابط إعادة تعيين كلمة المرور' 
      });
    }

    // Generate and save password reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Send email
    const emailResult = await sendPasswordResetEmail(user.email, resetToken);

    if (!emailResult.success) {
      // Reset the token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      return res.status(500).json({ 
        message: 'حدث خطأ في إرسال البريد الإلكتروني، يرجى المحاولة مرة أخرى' 
      });
    }

    res.json({ 
      success: true, 
      message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      message: 'حدث خطأ في معالجة طلبك' 
    });
  }
});

// Reset password
router.put('/reset-password/:resetToken', async (req, res) => {
  try {
    const { resetToken } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ 
        message: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل' 
      });
    }

    // Hash token to compare with stored token
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية' 
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    // Send confirmation email
    await sendPasswordChangedEmail(user.email);

    res.json({ 
      success: true, 
      message: 'تم تحديث كلمة المرور بنجاح' 
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      message: 'حدث خطأ أثناء إعادة تعيين كلمة المرور' 
    });
  }
});

export default router;
