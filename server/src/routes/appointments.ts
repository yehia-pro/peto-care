import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import mongoose, { Schema, Model } from 'mongoose';
import MInvoiceModel from '../models/Invoice';
import { Message } from '../models/Message';

const AppointmentSchema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  vetId: {
    type: String,
    required: true,
    index: true
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  chatSessionId: {
    type: String,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export const AppointmentModel: Model<any> = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema)

const router = Router()

const createSchema = z.object({
  body: z.object({
    vetId: z.string(),
    scheduledAt: z.string(),
    reason: z.string().min(2),
    notes: z.string().optional(),
    price: z.number().nonnegative().optional(),
    currency: z.string().optional()
  })
})

router.post('/', requireAuth(['user', 'admin']), validate(createSchema), async (req, res) => {
  const doc = await AppointmentModel.create({
    userId: (req as any).user.id,
    vetId: req.body.vetId,
    scheduledAt: new Date(req.body.scheduledAt),
    reason: req.body.reason,
    notes: req.body.notes
  })
  try {
    const amount = typeof req.body.price === 'number' ? req.body.price : 250
    const currency = req.body.currency || 'USD'
    await MInvoiceModel.create({
      userId: (req as any).user.id,
      type: 'appointment',
      referenceId: doc._id?.toString() || doc.id,
      amount,
      currency,
      status: 'pending',
      description: `Appointment with vet ${req.body.vetId}`
    })

    // Create Transaction Log
    const { default: Transaction } = await import('../models/Transaction');
    await Transaction.create({
      userId: (req as any).user.id,
      type: 'appointment',
      amount,
      currency,
      status: 'pending',
      paymentMethod: 'cash', // Default to cash for now, update if payment integrated
      referenceId: doc._id,
      description: `Booking appointment with ${req.body.vetId}`
    });
  } catch (e) {
    console.error('Error creating invoice/transaction:', e)
  }

  // Send real-time notification to Vet
  try {
    const io = (req as any).app.get('io');
    if (io) {
      const { sendNotification } = await import('../socket');
      const user = await import('../models/User').then(m => m.default.findById((req as any).user.id));

      sendNotification(
        io,
        req.body.vetId,
        'حجز جديد 📅',
        `طلب حجز جديد من ${user?.fullName || 'عميل'}: ${req.body.reason}`,
        'info',
        { appointmentId: doc._id, type: 'new_appointment' }
      );
    }
  } catch (notifError) {
    console.error('Failed to send new appointment notification:', notifError);
  }

  return res.json({ appointment: doc })
})

router.get('/', requireAuth(['user', 'vet', 'admin']), async (req, res) => {
  const role = (req as any).user.role
  const id = (req as any).user.id
  let where: any = {}
  if (role === 'user') where.userId = id
  else if (role === 'vet') where.vetId = id
  const appointments = await AppointmentModel.find(where).sort({ scheduledAt: -1 }).lean()
  return res.json({ appointments })
})

router.get('/:id', requireAuth(['user', 'vet', 'admin']), async (req, res) => {
  try {
    const appt = await AppointmentModel.findById(req.params.id).lean() as any;
    if (!appt || Array.isArray(appt)) return res.status(404).json({ error: 'not_found' });

    // Check if the user has permission to view this appointment
    const userId = (req as any).user.id;
    const role = (req as any).user.role;

    if (role === 'user' && String(appt.userId) !== userId) {
      return res.status(403).json({ error: 'forbidden' });
    }

    if (role === 'vet' && String(appt.vetId) !== userId) {
      return res.status(403).json({ error: 'forbidden' });
    }

    // If the appointment is confirmed, include chat session info
    let chatSession = null;
    if (appt.status === 'confirmed' && appt.chatSessionId) {
      chatSession = {
        id: appt.chatSessionId,
        messages: await Message.find({
          $or: [
            { sender: appt.userId, receiver: appt.vetId },
            { sender: appt.vetId, receiver: appt.userId }
          ],
          appointmentId: appt._id
        })
          .sort({ createdAt: 1 })
          .lean()
      };
    }

    return res.json({
      appointment: {
        ...appt,
        chatSession
      }
    });

  } catch (error) {
    console.error('Error fetching appointment:', error);
    return res.status(500).json({ error: 'Failed to fetch appointment' });
  }
})

router.delete('/:id', requireAuth(['user', 'admin']), async (req, res) => {
  const appt = await AppointmentModel.findById(req.params.id)
  if (!appt) return res.status(404).json({ error: 'not_found' })
  const requester = (req as any).user
  if (requester.role !== 'admin' && String(appt.userId) !== String(requester.id)) return res.status(403).json({ error: 'forbidden' })
  await appt.deleteOne()
  return res.json({ success: true })
})

const updateSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ 
    status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
    scheduledAt: z.string().optional(),
    entryNumber: z.number().optional(),
    doctorNotes: z.string().optional()
  })
})

router.patch('/:id/status', requireAuth(['vet', 'admin']), validate(updateSchema), async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const appt = await AppointmentModel.findById(req.params.id).session(session);
    if (!appt) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'not_found' });
    }

    const oldStatus = appt.status;
    appt.status = req.body.status;
    
    if (req.body.status === 'confirmed') {
      if (req.body.scheduledAt) appt.scheduledAt = new Date(req.body.scheduledAt);
      if (req.body.entryNumber) appt.entryNumber = req.body.entryNumber;
      if (req.body.doctorNotes) appt.doctorNotes = req.body.doctorNotes;
    }

    // If status is being changed to 'confirmed', create a chat session and send notification
    if (req.body.status === 'confirmed' && oldStatus !== 'confirmed') {
      // Create a welcome message for the chat session
      const welcomeMessage = new Message({
        sender: new mongoose.Types.ObjectId(appt.vetId),
        receiver: new mongoose.Types.ObjectId(appt.userId),
        content: `مرحباً! شكراً لحجز موعدك معنا. كيف يمكنني مساعدتك اليوم؟`,
        appointmentId: appt._id,
        read: false
      });

      await welcomeMessage.save({ session });

      // Store the chat session ID in the appointment
      appt.chatSessionId = `appt_${appt._id}`;

      // Send confirmation email notification
      try {
        const { sendEmail } = await import('../services/email');
        const userModel = mongoose.models.User || mongoose.model('User', new Schema({}, { strict: false }));
        const user = await userModel.findById(appt.userId);

        if (user && user.email) {
          const appointmentDate = new Date(appt.scheduledAt).toLocaleDateString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          const appointmentTime = new Date(appt.scheduledAt).toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit'
          });

          const subject = 'تأكيد موعدك - بيتو كير';
          const html = `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🐾 بيتو كير</h1>
              </div>
              <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #10b981; margin-top: 0;">✅ تم تأكيد موعدك!</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                  عزيزي ${user.fullName || 'العميل'},
                </p>
                <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                  يسعدنا إبلاغك بأن موعدك قد تم تأكيده بنجاح.
                </p>
                <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #3b82f6;">
                  <p style="margin: 5px 0; color: #1f2937;"><strong>📅 التاريخ:</strong> ${appointmentDate}</p>
                  <p style="margin: 5px 0; color: #1f2937;"><strong>🕐 الوقت:</strong> ${appointmentTime}</p>
                  ${appt.entryNumber ? `<p style="margin: 5px 0; color: #1f2937;"><strong>🔢 رقم الدخول:</strong> ${appt.entryNumber}</p>` : ''}
                  <p style="margin: 5px 0; color: #1f2937;"><strong>📝 السبب:</strong> ${appt.reason}</p>
                  ${appt.notes ? `<p style="margin: 5px 0; color: #1f2937;"><strong>💬 ملاحظات:</strong> ${appt.notes}</p>` : ''}
                </div>
                <p style="font-size: 14px; line-height: 1.6; color: #eab308; margin-top: 20px; font-weight: bold;">
                  ⚠️ برجاء الحضور قبل الموعد بربع ساعة (15 دقيقة).
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #6b7280;">
                  سنرسل لك تذكيراً قبل موعدك بـ 6 ساعات.
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #6b7280;">
                  شكراً لثقتك في بيتو كير! 🐶🐱
                </p>
              </div>
            </div>
          `;

          await sendEmail(user.email, subject, html);
        }
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Send cancellation/rejection notification
    if (req.body.status === 'cancelled' && oldStatus === 'pending') {
      try {
        const { sendEmail } = await import('../services/email');
        const userModel = mongoose.models.User || mongoose.model('User', new Schema({}, { strict: false }));
        const user = await userModel.findById(appt.userId);

        if (user && user.email) {
          const subject = 'تحديث بخصوص موعدك - بيتو كير';
          const html = `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
              <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🐾 بيتو كير</h1>
              </div>
              <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #dc2626; margin-top: 0;">❌ عذراً، لم يتم قبول الموعد</h2>
                <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                  عزيزي ${user.fullName || 'العميل'},
                </p>
                <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                  نأسف لإبلاغك بأن موعدك المطلوب غير متاح حالياً. يرجى اختيار موعد آخر أو التواصل معنا مباشرة.
                </p>
                <p style="font-size: 14px; line-height: 1.6; color: #6b7280; margin-top: 20px;">
                  نعتذر عن أي إزعاج. نحن هنا لخدمتك دائماً! 🐶🐱
                </p>
              </div>
            </div>
          `;

          await sendEmail(user.email, subject, html);
        }
      } catch (emailError) {
        console.error('Failed to send cancellation email:', emailError);
      }
    }

    await appt.save({ session });
    await session.commitTransaction();

    // Real-time notification
    try {
      const io = (req as any).app.get('io');
      if (io) {
        const { sendNotification } = await import('../socket');

        if (req.body.status === 'confirmed') {
          sendNotification(
            io,
            appt.userId,
            'تم تأكيد موعدك! ✅',
            `تم تأكيد موعدك بنجاح. برجاء الحضور قبل الموعد بـ 15 دقيقة.`,
            'success',
            { appointmentId: appt._id, status: 'confirmed' }
          );
        } else if (req.body.status === 'cancelled') {
          sendNotification(
            io,
            appt.userId,
            'تم إلغاء الموعد ❌',
            `نأسف لإبلاغك بأن موعدك قد تم إلغاؤه. يرجى حجز موعد آخر.`,
            'warning',
            { appointmentId: appt._id, status: 'cancelled' }
          );
        } else if (req.body.status === 'completed') {
          sendNotification(
            io,
            appt.userId,
            'تم إكمال الموعد ✓',
            `شكراً لزيارتك! نتمنى أن تكون تجربتك ممتازة.`,
            'info',
            { appointmentId: appt._id, status: 'completed' }
          );
        }
      }
    } catch (notifError) {
      console.error('Failed to send real-time notification:', notifError);
      // Don't fail the request if notification fails
    }

    return res.json({
      appointment: appt,
      message: req.body.status === 'confirmed' ? 'Appointment confirmed and chat session started' : 'Appointment updated'
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating appointment status:', error);
    return res.status(500).json({ error: 'Failed to update appointment status' });
  } finally {
    session.endSession();
  }
})

// Reschedule appointment
router.patch('/:id/reschedule', requireAuth(['user', 'admin']), async (req, res) => {
  try {
    const { id } = req.params
    const { scheduledAt } = req.body
    const userId = (req as any).user.id

    const appt = await AppointmentModel.findOne({ _id: id, userId })
    if (!appt) {
      return res.status(404).json({ error: 'not_found' })
    }

    if (appt.status === 'completed') {
      return res.status(400).json({ error: 'cannot_reschedule_completed' })
    }

    appt.scheduledAt = new Date(scheduledAt)
    appt.status = 'pending' // Reset to pending for vet to confirm
    await appt.save()

    // Send email notification
    try {
      const { sendEmail } = await import('../services/email')
      const userModel = mongoose.models.User || mongoose.model('User', new Schema({}, { strict: false }))
      const user = await userModel.findById(userId)

      if (user && user.email) {
        const appointmentDate = new Date(scheduledAt).toLocaleDateString('ar-EG')
        const appointmentTime = new Date(scheduledAt).toLocaleTimeString('ar-EG')

        await sendEmail(
          user.email,
          'تم إعادة جدولة موعدك - بيتو كير',
          `<div dir="rtl"><h2>تم إعادة جدولة موعدك</h2><p>الموعد الجديد: ${appointmentDate} في ${appointmentTime}</p><p>في انتظار تأكيد الطبيب.</p></div>`
        )
      }
    } catch (e) {
      console.error('Email error:', e)
    }

    res.json({ appointment: appt, message: 'تم إعادة جدولة الموعد بنجاح' })
  } catch (error) {
    console.error('Error rescheduling appointment:', error)
    res.status(500).json({ error: 'server_error' })
  }
})

// Get available time slots for a vet
router.get('/available-slots/:vetId', async (req, res) => {
  try {
    const { vetId } = req.params
    const { date } = req.query // Format: YYYY-MM-DD

    if (!date) {
      return res.status(400).json({ error: 'date_required' })
    }

    const startOfDay = new Date(date as string)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date as string)
    endOfDay.setHours(23, 59, 59, 999)

    // Get all appointments for this vet on this day
    const appointments = await AppointmentModel.find({
      vetId,
      scheduledAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['pending', 'confirmed'] }
    }).select('scheduledAt')

    // Generate available slots (9 AM to 5 PM, 30-minute intervals)
    const slots = []
    const workStart = 9 // 9 AM
    const workEnd = 17 // 5 PM

    for (let hour = workStart; hour < workEnd; hour++) {
      for (let minute of [0, 30]) {
        const slotTime = new Date(date as string)
        slotTime.setHours(hour, minute, 0, 0)

        // Check if slot is not taken
        const isTaken = appointments.some(appt => {
          const apptTime = new Date(appt.scheduledAt)
          return Math.abs(apptTime.getTime() - slotTime.getTime()) < 30 * 60 * 1000 // Within 30 minutes
        })

        // Check if slot is in the future
        const isInFuture = slotTime.getTime() > Date.now()

        if (!isTaken && isInFuture) {
          slots.push({
            time: slotTime.toISOString(),
            available: true
          })
        }
      }
    }

    res.json({ slots, date })
  } catch (error) {
    console.error('Error fetching available slots:', error)
    res.status(500).json({ error: 'server_error' })
  }
})

export default router
