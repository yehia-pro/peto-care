import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import MUserModel from '../models/User'
import MPetStoreModel from '../models/PetStore'
import { sendEmail } from '../services/email'

const router = Router()

// Existing Overview
router.get('/overview', requireAuth(['admin']), async (_req, res) => {
  try {
    // Count from Mongo as well for accuracy if hybrid
    const mongoUsers = await MUserModel.countDocuments({ role: 'user' })
    const mongoVets = await MUserModel.countDocuments({ role: 'vet' })

    const users = mongoUsers
    const vets = mongoVets
    const appointments = 0 // AppointmentModel.countDocuments()
    const payments = 0

    res.json({ users, vets, appointments, payments })
  } catch (e) {
    res.json({ users: 0, vets: 0, appointments: 0, payments: 0 })
  }
})

// --- NEW APPROVAL ROUTES ---

// Get Pending Approvals
router.get('/pending', requireAuth(['admin']), async (_req, res) => {
  try {
    const pendingUsers = await MUserModel.find({
      isApproved: false,
      role: { $in: ['vet', 'petstore'] }
    }).select('-passwordHash') // Exclude password
      .sort({ createdAt: -1 });

    res.json(pendingUsers);
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch pending requests' });
  }
});

// Approve User
router.put('/approve/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const user = await MUserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'not_found', message: 'User not found' });

    user.isApproved = true;
    await user.save();

    // If petstore, ensure a PetStore document exists (safety net in case it failed at registration)
    if (user.role === 'petstore') {
      try {
        const existing = await MPetStoreModel.findOne({ userId: user._id.toString() })
        if (!existing) {
          let contact: any = {}
          try { contact = typeof user.contact === 'string' ? JSON.parse(user.contact) : (user.contact || {}) } catch (_) {}
          const placeholder = 'https://placehold.co/600x400'
          await MPetStoreModel.create({
            userId: user._id.toString(),
            storeName: (user as any).storeName || user.fullName,
            storeType: contact.storeType || 'comprehensive',
            description: contact.description || '',
            phone: (user as any).phone || contact.phone || '',
            whatsapp: contact.whatsapp || '',
            openingTime: contact.openingTime || '09:00',
            closingTime: contact.closingTime || '21:00',
            services: Array.isArray(contact.services) ? contact.services : [],
            brands: Array.isArray(contact.brands) ? contact.brands : [],
            city: contact.city || '',
            address: contact.address || '',
            commercialRegImageUrl: (user as any).commercialRegImageUrl || placeholder,
            rating: 0
          })
          console.log(`[Approve] Auto-created PetStore record for user ${user._id}`)
        }
      } catch (storeErr) {
        console.error('[Approve] Failed to ensure PetStore record:', storeErr)
      }
    }

    // Send approval email to the user
    try {
      const roleLabel = user.role === 'vet' ? 'طبيب بيطري' : 'متجر حيوانات أليفة';
      const subject = '🎉 تم قبول طلبك والترحيب بك في منصتنا!';
      const html = `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🐾 Peto Care</h1>
            <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 14px;">منصة الرعاية البيطرية المتكاملة</p>
          </div>

          <div style="padding: 32px; background: white;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="background: #dcfce7; width: 64px; height: 64px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 32px;">✅</div>
            </div>

            <h2 style="color: #111827; margin: 0 0 8px 0;">مرحباً ${user.fullName}!</h2>
            <p style="color: #6b7280; margin: 0 0 24px 0; font-size: 15px; line-height: 1.6;">
              يسعدنا إخبارك بأن طلب تسجيلك كـ <strong style="color: #2563eb;">${roleLabel}</strong> قد تمت الموافقة عليه بنجاح.
            </p>

            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #166534; margin: 0; font-size: 14px;">
                ✨ يمكنك الآن الدخول إلى حسابك والاستفادة من جميع مميزات المنصة كاملةً.
              </p>
            </div>

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${process.env.APP_URL || 'http://localhost:5173'}/login"
                 style="display: inline-block; padding: 14px 32px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                🚀 تسجيل الدخول الآن
              </a>
            </div>

            <p style="color: #4b5563; font-size: 14px; text-align: center; margin: 32px 0 0 0; line-height: 1.6;">
              مع تحيات،<br>
              <strong>فريق دعم Peto Care</strong>
            </p>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 12px 0 0 0;">
              إذا كان لديك أي استفسار، تواصل معنا على هذا البريد الإلكتروني.
            </p>
          </div>

          <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2025 Peto Care. جميع الحقوق محفوظة.</p>
          </div>
        </div>`;
      await sendEmail(user.email, subject, html);
    } catch (mailError) {
      console.error('Failed to send approval email:', mailError);
    }

    res.json({ success: true, message: 'User approved successfully' });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ error: 'server_error', message: 'Failed to approve user' });
  }
});

// Reject User
router.delete('/reject/:id', requireAuth(['admin']), async (req, res) => {
  try {
    const user = await MUserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'not_found', message: 'User not found' });

    // Send rejection email BEFORE deleting the record
    try {
      const roleLabel = user.role === 'vet' ? 'طبيب بيطري' : 'متجر حيوانات أليفة';
      const subject = 'بخصوص طلب تسجيلك في منصة Peto Care';
      const html = `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="background: linear-gradient(135deg, #374151, #1f2937); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🐾 Peto Care</h1>
            <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 14px;">منصة الرعاية البيطرية المتكاملة</p>
          </div>

          <div style="padding: 32px; background: white;">
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="background: #fef2f2; width: 64px; height: 64px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 32px;">❌</div>
            </div>

            <h2 style="color: #111827; margin: 0 0 8px 0;">مرحباً ${user.fullName}،</h2>
            <p style="color: #6b7280; margin: 0 0 24px 0; font-size: 15px; line-height: 1.6;">
              نأسف لإبلاغك بأنه تم رفض طلب تسجيلك كـ <strong>${roleLabel}</strong> في الوقت الحالي.
            </p>

            <div style="background: #fef9c3; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #92400e; margin: 0; font-size: 14px; font-weight: bold;">الأسباب المحتملة للرفض:</p>
              <ul style="color: #78350f; font-size: 13px; margin: 8px 0 0 0; padding-right: 16px; line-height: 1.8;">
                <li>البيانات المقدمة غير مكتملة أو غير واضحة</li>
                <li>المستندات المرفقة غير مطابقة للمتطلبات</li>
                <li>عدم استيفاء شروط التسجيل في المنصة</li>
              </ul>
            </div>

            <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
              يمكنك إعادة التقديم بعد التأكد من اكتمال بياناتك ووضوح المستندات المطلوبة.
            </p>

            <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
              مع تحيات،<br>
              <strong>فريق دعم Peto Care</strong>
            </p>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 16px 0 0 0;">
              إذا كنت تعتقد أن هناك خطأ، يرجى التواصل معنا عبر الرد على هذا البريد.
            </p>
          </div>

          <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">© 2025 Peto Care. جميع الحقوق محفوظة.</p>
          </div>
        </div>`;
      await sendEmail(user.email, subject, html);
    } catch (mailError) {
      console.error('Failed to send rejection email:', mailError);
    }

    await MUserModel.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'User rejected and removed' });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ error: 'server_error', message: 'Failed to reject user' });
  }
});

// --- END NEW ROUTES ---

import Coupon from '../models/Coupon';

// --- COUPON MANAGEMENT ROUTES ---

// Get all coupons
router.get('/coupons', requireAuth(['admin']), async (_req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch coupons' });
  }
});

// Create new coupon
router.post('/coupons', requireAuth(['admin']), async (req, res) => {
  try {
    const { code, discountType, discountValue, expiresAt, minOrderAmount, maxUses } = req.body;
    
    // Check if code already exists
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ error: 'duplicate_code', message: 'Coupon code already exists' });
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      minOrderAmount: minOrderAmount || 0,
      maxUses: maxUses || 0,
      createdBy: (req as any).user.id,
      isActive: true
    });

    await coupon.save();
    res.status(201).json(coupon);
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({ error: 'server_error', message: 'Failed to create coupon' });
  }
});

// Toggle or update coupon active status
router.patch('/coupons/:id/toggle', requireAuth(['admin']), async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.status(404).json({ error: 'not_found', message: 'Coupon not found' });

    coupon.isActive = !coupon.isActive;
    await coupon.save();
    res.json(coupon);
  } catch (error) {
    console.error('Error toggling coupon:', error);
    res.status(500).json({ error: 'server_error', message: 'Failed to toggle coupon' });
  }
});

// Delete coupon
router.delete('/coupons/:id', requireAuth(['admin']), async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ error: 'server_error', message: 'Failed to delete coupon' });
  }
});

export default router
