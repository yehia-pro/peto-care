import mongoose, { Schema } from 'mongoose';
import { AppointmentModel } from '../routes/appointments';

export const startAutoRejectJob = (io: any) => {
  // Run every hour
  setInterval(async () => {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const pendingAppointments = await AppointmentModel.find({
        status: 'pending',
        createdAt: { $lte: twentyFourHoursAgo }
      });

      if (pendingAppointments.length === 0) return;

      console.log(`Auto-rejecting ${pendingAppointments.length} pending appointments older than 24 hours.`);

      const { sendEmail } = await import('../services/email');
      const userModel = mongoose.models.User || mongoose.model('User', new Schema({}, { strict: false }));
      const { default: Notification } = await import('../models/Notification');
      const { sendNotification } = await import('../socket');

      for (const appt of pendingAppointments) {
        appt.status = 'cancelled';
        appt.autoRejected = true;
        await appt.save();

        // Send email notification
        try {
          const user = await userModel.findById(appt.userId);
          if (user && user.email) {
            const subject = 'رفض تلقائي لطلبك - بيتو كير';
            const html = `
              <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #dc2626;">❌ تم رفض طلب الكشف الخاص بك تلقائياً</h2>
                <p>عزيزي ${user.fullName || 'العميل'},</p>
                <p>نأسف لإبلاغك بأن طلب الكشف الخاص بك قد تم إلغاؤه تلقائياً لعدم وجود رد من الطبيب خلال 24 ساعة.</p>
                <p>يرجى اختيار موعد آخر أو التواصل مع طبيب مختلف.</p>
              </div>
            `;
            await sendEmail(user.email, subject, html);
          }
        } catch (emailError) {
          console.error(`Failed to send auto-reject email to user for appt ${appt._id}:`, emailError);
        }

        // Send Notification
        try {
          await Notification.create({
            userId: appt.userId,
            title: 'إلغاء تلقائي ❌',
            message: 'تم إلغاء طلبك لعدم استجابة الطبيب خلال 24 ساعة.',
            type: 'warning',
            isRead: false
          });

          if (io) {
            sendNotification(
              io,
              String(appt.userId),
              'إلغاء تلقائي ❌',
              'تم إلغاء طلبك لعدم استجابة الطبيب خلال 24 ساعة.',
              'warning',
              { appointmentId: appt._id, status: 'cancelled' }
            );
          }
        } catch (notifError) {
          console.error(`Failed to create notification for auto-reject for appt ${appt._id}:`, notifError);
        }
      }
    } catch (error) {
      console.error('Error running autoRejectJob:', error);
    }
  }, 60 * 60 * 1000); // 1 hour interval
};
