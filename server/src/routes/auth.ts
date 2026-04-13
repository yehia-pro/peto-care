import { Router } from 'express'
import { z } from 'zod'
import { JsonDb } from '../utils/jsonDb'
const memUsers: any[] = JsonDb.read('users.json', [])
const saveUsers = () => JsonDb.write('users.json', memUsers)

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { validate } from '../middleware/validate'
import { requireAuth } from '../middleware/auth'
import MUserModel from '../models/User'
import MPetStoreModel from '../models/PetStore'
import { sendEmail } from '../services/email'
import upload from '../config/cloudinary'
import mongoose, { Schema, Model } from 'mongoose'
import { AppointmentModel } from './appointments'
import PetRecordModel from '../models/PetRecord'

const router = Router()

// Relaxed password validation - only requires 6+ characters
const strongPassword = (p: string) => p.length >= 6
const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6), // Changed from 8 to 6
    fullName: z.string().min(2),
    role: z.enum(['user', 'vet', 'petstore']).optional(),
    phone: z.string().optional(),
    contact: z.string().optional(),
  })
})



const adminRecipients = (process.env.ADMIN_NOTIFICATION_EMAILS || 'aymanyoussef219@gmail.com,yaheaeldesoky0@gmail.com')
  .split(',')
  .map(e => e.trim())
  .filter(Boolean)

router.post('/register', upload.fields([
  { name: 'syndicateCardImage', maxCount: 1 },
  { name: 'idFrontImage', maxCount: 1 },
  { name: 'idBackImage', maxCount: 1 },
  { name: 'commercialRegImage', maxCount: 1 },
  { name: 'licenseImage', maxCount: 1 },
]), validate(registerSchema), async (req, res) => {
  if (!strongPassword(req.body.password)) {
    return res.status(400).json({ error: 'weak_password', message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
  }
  // Prefer MongoDB (Mongoose) for user storage
  try {
    const existsMongo = await MUserModel.findOne({ email: req.body.email })
    if (existsMongo) return res.status(409).json({ error: 'email_taken', message: 'عذراً، هذا البريد الإلكتروني مسجل مسبقاً.' })
    const passwordHash = await bcrypt.hash(req.body.password, 10)
    const userRole = req.body.role || 'user'
    const files = (req as any).files || {}
    const syndicateCardImageUrl = files?.syndicateCardImage?.[0]?.path
    const idFrontUrl = files?.idFrontImage?.[0]?.path
    const idBackUrl = files?.idBackImage?.[0]?.path
    const licenseImageUrl = files?.licenseImage?.[0]?.path
    const commercialRegImageUrl = files?.commercialRegImage?.[0]?.path || licenseImageUrl
    if (userRole === 'vet') {
      if (!syndicateCardImageUrl || !idFrontUrl || !idBackUrl) {
        return res.status(400).json({ error: 'missing_images', message: 'يجب رفع صور كارنيه النقابة والهوية للطبيب' })
      }
    }
    if (userRole === 'petstore') {
      if (!commercialRegImageUrl) {
        return res.status(400).json({ error: 'missing_images', message: 'يجب رفع صورة السجل التجاري للمتجر' })
      }
      if (!idFrontUrl || !idBackUrl) {
        return res.status(400).json({ error: 'missing_images', message: 'يجب رفع صورة وجه وظهر بطاقة الهوية للمتجر' })
      }
    }
    const created = await MUserModel.create({
      email: req.body.email,
      passwordHash,
      fullName: req.body.fullName,
      role: userRole,
      phone: req.body.phone,
      contact: req.body.contact,
      syndicateCardImageUrl,
      idFrontUrl,
      idBackUrl,
      commercialRegImageUrl,
      isApproved: false,
    })
    if (userRole === 'vet' || userRole === 'petstore') {
      if (userRole === 'petstore') {
        try {
          const storeName = req.body.storeName || req.body.fullName
          await MPetStoreModel.create({
            userId: created._id.toString(),
            storeName,
            description: req.body.description,
            brands: req.body.brands,
            city: req.body.city,
            address: req.body.address,
            commercialRegImageUrl: commercialRegImageUrl || '',
            rating: 0
          })
        } catch (e) { }
      }
      try {
        const subject = userRole === 'vet' ? 'تسجيل طبيب بيطري جديد' : 'تسجيل متجر جديد'
        const html = `<div dir="rtl" style="font-family: Arial, sans-serif;">
          <p>تم تسجيل طلب انضمام جديد (بانتظار الموافقة).</p>
          <p>الاسم: ${req.body.fullName}</p>
          <p>البريد الإلكتروني: ${req.body.email}</p>
          <p>النوع: ${userRole === 'vet' ? 'طبيب' : 'متجر'}</p>
        </div>`
        Promise.all(adminRecipients.map(to => sendEmail(to, subject, html))).catch(() => {})
      } catch (e) { }
      const msg = 'تم التسجيل بنجاح، حسابك قيد المراجعة، يرجى انتظار موافقة الإدارة من لوحة التحكم'
      return res.status(201).json({ message: msg })
    }
    const token = jwt.sign({ id: created._id.toString(), role: created.role }, String(process.env.JWT_SECRET), { expiresIn: '7d' })
    res.setHeader('Set-Cookie', `token=${token}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}; Max-Age=${7 * 24 * 3600}`)
    return res.status(201).json({ token, user: { id: created._id.toString(), email: created.email, fullName: created.fullName, role: created.role } })
  } catch (mongoErr) { }
  const exists = memUsers.find(u => u.email === req.body.email)
  if (exists) return res.status(409).json({ error: 'email_taken', message: 'عذراً، هذا البريد الإلكتروني مسجل مسبقاً.' })
  const passwordHash = await bcrypt.hash(req.body.password, 10)
  const userRole = req.body.role || 'user'
  const id = Math.random().toString(36).slice(2)
  const user = { id, email: req.body.email, passwordHash, fullName: req.body.fullName, role: userRole, phone: req.body.phone, contact: req.body.contact, isApproved: false }
  memUsers.push(user)
  saveUsers()
  if (userRole === 'vet' || userRole === 'petstore') {
    return res.status(201).json({ message: 'تم التسجيل بنجاح، حسابك قيد المراجعة، يرجى انتظار موافقة الإدارة' })
  }
  const token = jwt.sign({ id: user.id, role: user.role }, String(process.env.JWT_SECRET), { expiresIn: '7d' })
  res.setHeader('Set-Cookie', `token=${token}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}; Max-Age=${7 * 24 * 3600}`)
  return res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } })
})

const loginSchema = z.object({
  body: z.object({ email: z.string().email(), password: z.string().min(6), captchaId: z.string().optional(), captchaAnswer: z.string().optional() })
})

const failedAttempts: { email: string, ip?: string, at: number }[] = []
const captchaMap: Record<string, { q: string, a: string, email: string, expiresAt: number }> = {}
const createCaptcha = (email: string) => {
  const a = Math.floor(Math.random() * 9) + 1
  const b = Math.floor(Math.random() * 9) + 1
  const id = Math.random().toString(36).slice(2)
  captchaMap[id] = { q: `${a} + ${b} = ?`, a: String(a + b), email, expiresAt: Date.now() + 10 * 60 * 1000 }
  return { id, question: captchaMap[id].q }
}

router.post('/login', validate(loginSchema), async (req, res) => {
  // Try MongoDB first
  try {
    const userDoc = await MUserModel.findOne({ email: req.body.email })
    if (!userDoc) {
      failedAttempts.push({ email: req.body.email, ip: req.ip, at: Date.now() })
      const cap = createCaptcha(req.body.email)
      return res.status(401).json({ error: 'user_not_found', message: 'هذا الحساب غير موجود', require_captcha: true, captcha_id: cap.id, captcha_question: cap.question })
    }
    if (userDoc.lockUntil && userDoc.lockUntil.getTime() > Date.now()) {
      return res.status(423).json({ error: 'account_locked', until: userDoc.lockUntil.toISOString() })
    }
    const recentFails = failedAttempts.filter(f => f.email === req.body.email && Date.now() - f.at < 15 * 60 * 1000).length
    if (recentFails >= 3) {
      const c = captchaMap[req.body.captchaId || '']
      if (!c || c.email !== req.body.email || c.expiresAt < Date.now() || c.a !== String(req.body.captchaAnswer || '')) {
        const cap = createCaptcha(req.body.email)
        return res.status(400).json({ error: 'captcha_required', message: 'رمز التحقق مطلوب أو غير صحيح', captcha_id: cap.id, captcha_question: cap.question })
      }
    }
    const ok = await bcrypt.compare(req.body.password, userDoc.passwordHash)
    if (!ok) {
      failedAttempts.push({ email: req.body.email, ip: req.ip, at: Date.now() })
      userDoc.failedLoginCount = (userDoc.failedLoginCount || 0) + 1
      userDoc.lastFailedAt = new Date()
      if (userDoc.failedLoginCount >= 5) {
        userDoc.lockUntil = new Date(Date.now() + 10 * 60 * 1000)
      }
      await userDoc.save()
      const delay = Math.min(2000 + (userDoc.failedLoginCount || 0) * 500, 5000)
      await new Promise(r => setTimeout(r, delay))
      const cap = createCaptcha(req.body.email)
      return res.status(401).json({ error: 'incorrect_password', message: 'كلمة المرور غير صحيحة', require_captcha: true, captcha_id: cap.id, captcha_question: cap.question })
    }
    if ((userDoc.role === 'vet' || userDoc.role === 'petstore') && !userDoc.isApproved) {
      return res.status(403).json({ error: 'account_pending_approval', message: 'حسابك قيد المراجعة، يرجى انتظار موافقة الإدارة' })
    }
    userDoc.failedLoginCount = 0
    userDoc.lockUntil = undefined
    await userDoc.save()
    const token = jwt.sign({ id: userDoc._id.toString(), role: userDoc.role, email: userDoc.email }, String(process.env.JWT_SECRET), { expiresIn: '7d' })
    res.setHeader('Set-Cookie', `token=${token}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}; Max-Age=${7 * 24 * 3600}`)
    return res.json({ token, user: { id: userDoc._id.toString(), email: userDoc.email, fullName: userDoc.fullName, role: userDoc.role } })
  } catch (mongoErr) { }
  const user = memUsers.find(u => u.email === req.body.email)
  if (!user) {
    failedAttempts.push({ email: req.body.email, ip: req.ip, at: Date.now() })
    const cap = createCaptcha(req.body.email)
    return res.status(401).json({ error: 'invalid_credentials', require_captcha: true, captcha_id: cap.id, captcha_question: cap.question })
  }
  const ok = await bcrypt.compare(req.body.password, user.passwordHash)
  if (!ok) {
    failedAttempts.push({ email: req.body.email, ip: req.ip, at: Date.now() })
    const delay = Math.min(2000, 5000)
    await new Promise(r => setTimeout(r, delay))
    const cap = createCaptcha(req.body.email)
    return res.status(401).json({ error: 'invalid_credentials', require_captcha: true, captcha_id: cap.id, captcha_question: cap.question })
  }
  if ((user.role === 'vet' || user.role === 'petstore') && !user.isApproved) {
    return res.status(403).json({ error: 'account_pending_approval', message: 'حسابك قيد المراجعة، يرجى انتظار موافقة الإدارة' })
  }
  const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, String(process.env.JWT_SECRET), { expiresIn: '7d' })
  res.setHeader('Set-Cookie', `token=${token}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}; Max-Age=${7 * 24 * 3600}`)
  return res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } })
})

// Refresh access token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const cookieToken = (req.cookies && req.cookies.token) || req.header('Authorization')?.replace('Bearer ', '')
    if (!cookieToken) return res.status(401).json({ error: 'no_token', message: 'يرجى تسجيل الدخول' })

    let payload: any = null
    try {
      payload = jwt.verify(cookieToken, String(process.env.JWT_SECRET)) as any
    } catch (e) {
      // If token verification failed (expired/invalid), try decode to obtain user id
      payload = jwt.decode(cookieToken) as any
      if (!payload || (!payload.id && !payload.userId)) return res.status(401).json({ error: 'invalid_token' })
    }

    const userId = payload.id || payload.userId
    let userDoc: any = null
    try {
      if (MUserModel) {
        userDoc = await MUserModel.findById(userId)
      }
    } catch (e) { }

    if (!userDoc) {
      // try memory users
      const mem = memUsers.find(u => u.id === userId)
      if (!mem) return res.status(401).json({ error: 'user_not_found' })
      userDoc = mem
    }

    const newToken = jwt.sign({ id: userDoc._id?.toString ? userDoc._id.toString() : userDoc.id, role: userDoc.role }, String(process.env.JWT_SECRET), { expiresIn: '7d' })
    res.setHeader('Set-Cookie', `token=${newToken}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}; Max-Age=${7 * 24 * 3600}`)
    return res.json({ token: newToken })
  } catch (err) {
    console.error('Refresh token error:', err)
    return res.status(500).json({ error: 'server_error' })
  }
})

router.post('/seed-demo-vet', async (_req, res) => {
  const email = 'demo_vet@example.local'
  let userDoc = await MUserModel.findOne({ email })
  const placeholder = 'https://placehold.co/600x400'
  if (!userDoc) {
    const passwordHash = await bcrypt.hash('Demo@1234', 10)
    userDoc = await MUserModel.create({
      email,
      passwordHash,
      fullName: 'Demo Vet',
      role: 'vet',
      isApproved: true,
      syndicateCardImageUrl: placeholder,
      idFrontUrl: placeholder,
      idBackUrl: placeholder
    })
  } else {
    userDoc.isApproved = true
    userDoc.passwordHash = await bcrypt.hash('Demo@1234', 10)
    userDoc.syndicateCardImageUrl = userDoc.syndicateCardImageUrl || placeholder
    userDoc.idFrontUrl = userDoc.idFrontUrl || placeholder
    userDoc.idBackUrl = userDoc.idBackUrl || placeholder
    userDoc.contact = JSON.stringify({ qualification: 'بكالوريوس الطب البيطري - جامعة القاهرة', experienceYears: 5, country: 'Egypt', specialization: 'General' })
    await userDoc.save()
  }

  // Removing TypeORM logic

  // Create demo user for appointments
  const demoUserEmail = 'demo_user@example.local'
  let demoUser = await MUserModel.findOne({ email: demoUserEmail })
  if (!demoUser) {
    const passwordHash = await bcrypt.hash('Demo@1234', 10)
    demoUser = await MUserModel.create({
      email: demoUserEmail,
      passwordHash,
      fullName: 'Demo Pet Owner',
      role: 'user'
    })
  }

  // Create demo appointments
  const existingAppts = await AppointmentModel.find({ vetId: userDoc._id.toString() })
  if (existingAppts.length === 0) {
    await AppointmentModel.create([
      {
        userId: demoUser._id.toString(),
        vetId: userDoc._id.toString(),
        scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
        reason: 'فحص دوري',
        status: 'confirmed',
        notes: 'الكلب يعاني من قلة الشهية'
      },
      {
        userId: demoUser._id.toString(),
        vetId: userDoc._id.toString(),
        scheduledAt: new Date(Date.now() - 86400000), // Yesterday
        reason: 'تطعيم',
        status: 'completed',
        notes: 'تم إعطاء التطعيم بنجاح'
      }
    ])
  }

  // Create demo pet records
  const existingRecords = await PetRecordModel.find({ userId: demoUser._id.toString() })
  if (existingRecords.length === 0) {
    await PetRecordModel.create([
      {
        userId: demoUser._id.toString(),
        petName: 'Rex',
        petType: 'كلب',
        summary: 'كلب جيرمان شيبرد صحي',
        history: 'تطعيمات كاملة',
        medications: 'لا يوجد'
      },
      {
        userId: demoUser._id.toString(),
        petName: 'Bella',
        petType: 'قطة',
        summary: 'قطة سيامي',
        history: 'حساسية موسمية',
        medications: 'مضاد هيستامين عند الحاجة'
      }
    ])
  }

  try {
    const subject = 'دخول طبيب تجريبي جديد'
    const html = `<div dir="rtl" style="font-family: Arial, sans-serif;">
        <p>تم دخول حساب طبيب تجريبي.</p>
        <p>الاسم: ${userDoc.fullName}</p>
        <p>البريد الإلكتروني: ${userDoc.email}</p>
      </div>`
    await Promise.all(adminRecipients.map(to => sendEmail(to, subject, html)))
  } catch (e) {
    console.error('Failed to send demo vet email notification:', e)
  }
  const token = jwt.sign({ id: userDoc._id.toString(), role: userDoc.role }, String(process.env.JWT_SECRET), { expiresIn: '7d' })
  res.json({ token, user: { id: userDoc._id.toString(), email: userDoc.email, fullName: userDoc.fullName, role: userDoc.role } })
})

router.post('/seed-demo-store', async (_req, res) => {
  const email = 'demo_store@example.local'
  let userDoc = await MUserModel.findOne({ email })
  const placeholder = 'https://placehold.co/600x400'
  if (!userDoc) {
    const passwordHash = await bcrypt.hash('Demo@1234', 10)
    userDoc = await MUserModel.create({
      email,
      passwordHash,
      fullName: 'متجر تجريبي',
      role: 'petstore',
      isApproved: true,
      commercialRegImageUrl: placeholder,
      idFrontUrl: placeholder,
      idBackUrl: placeholder,
      phone: '01000000000',
      contact: JSON.stringify({ description: 'متجر تجريبي للتجربة.', brands: '', city: 'القاهرة', address: 'شارع التجربة 1' })
    })
    try {
      await MPetStoreModel.create({
        userId: userDoc._id.toString(),
        storeName: 'متجر تجريبي',
        description: 'متجر تجريبي للتجربة.',
        brands: '',
        city: 'القاهرة',
        address: 'شارع التجربة 1',
        commercialRegImageUrl: placeholder,
        rating: 0,
        products: []
      })
    } catch (e) { }
  } else {
    userDoc.isApproved = true
    userDoc.passwordHash = await bcrypt.hash('Demo@1234', 10)
    await userDoc.save()
    try {
      const existing = await MPetStoreModel.findOne({ userId: userDoc._id.toString() })
      if (!existing) {
        await MPetStoreModel.create({
          userId: userDoc._id.toString(),
          storeName: 'متجر تجريبي',
          description: 'متجر تجريبي للتجربة.',
          brands: '',
          city: 'القاهرة',
          address: 'شارع التجربة 1',
          commercialRegImageUrl: placeholder,
          rating: 0,
          products: []
        })
      }
    } catch (e) { }
  }
  const token = jwt.sign({ id: userDoc._id.toString(), role: userDoc.role }, String(process.env.JWT_SECRET), { expiresIn: '7d' })
  res.json({ token, user: { id: userDoc._id.toString(), email: userDoc.email, fullName: userDoc.fullName, role: userDoc.role } })
})


router.post('/seed-demo-user', async (_req, res) => {
  const email = 'demo_user@example.local'

  // Try MongoDB first
  try {
    let userDoc = await MUserModel.findOne({ email })
    if (!userDoc) {
      const passwordHash = await bcrypt.hash('Demo@1234', 10)
      userDoc = await MUserModel.create({
        email,
        passwordHash,
        fullName: 'Demo User',
        role: 'user',
        isApproved: true,
        phone: '01000000000'
      })
    } else {
      userDoc.passwordHash = await bcrypt.hash('Demo@1234', 10)
      userDoc.isApproved = true
      await userDoc.save()
    }
    const token = jwt.sign({ id: userDoc._id.toString(), role: userDoc.role }, String(process.env.JWT_SECRET), { expiresIn: '7d' })
    return res.json({ token, user: { id: userDoc._id.toString(), email: userDoc.email, fullName: userDoc.fullName, role: userDoc.role } })
  } catch (e) { }

  // Fallback to JSON DB
  const exists = memUsers.find(u => u.email === email)
  if (!exists) {
    const passwordHash = await bcrypt.hash('Demo@1234', 10)
    const id = Math.random().toString(36).slice(2)
    const user = { id, email, passwordHash, fullName: 'Demo User', role: 'user', isApproved: true, phone: '01000000000' }
    memUsers.push(user)
    saveUsers()
    const token = jwt.sign({ id: user.id, role: user.role }, String(process.env.JWT_SECRET), { expiresIn: '7d' })
    return res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } })
  } else {
    exists.passwordHash = await bcrypt.hash('Demo@1234', 10)
    exists.isApproved = true
    saveUsers()
    const token = jwt.sign({ id: exists.id, role: exists.role }, String(process.env.JWT_SECRET), { expiresIn: '7d' })
    return res.json({ token, user: { id: exists.id, email: exists.email, fullName: exists.fullName, role: exists.role } })
  }
})

router.get('/test-email', async (_req, res) => {
  const subject = 'إيميل تجريبي'
  const html = '<div dir="rtl" style="font-family: Arial, sans-serif;">هذا إيميل تجريبي للتأكد من عمل الإرسال.</div>'
  await Promise.all(adminRecipients.map(r => sendEmail(r, subject, html).catch(() => { })))
  res.json({ success: true })
})


router.get('/profile', requireAuth(['user', 'vet', 'admin', 'petstore']), async (req, res) => {
  try {
    const userDoc = await MUserModel.findById((req as any).user.id)
    if (!userDoc) return res.status(404).json({ error: 'not_found', message: 'المستخدم غير موجود' })
    const AppointmentModel: Model<any> = mongoose.models.Appointment || mongoose.model('Appointment', new Schema({
      userId: { type: String, required: true, index: true },
      vetId: { type: String, required: true, index: true },
      scheduledAt: { type: Date, required: true },
      reason: { type: String, required: true },
      notes: { type: String },
      status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
      createdAt: { type: Date, default: Date.now }
    }))

    const [appointments, records, petStore] = await Promise.all([
      AppointmentModel.find({ userId: userDoc._id.toString() }).sort({ scheduledAt: -1 }).lean(),
      PetRecordModel.find({ userId: userDoc._id.toString() }).sort({ createdAt: -1 }).lean(),
      userDoc.role === 'petstore' ? MPetStoreModel.findOne({ userId: userDoc._id.toString() }).lean() : Promise.resolve(null)
    ])
    return res.json({
      id: userDoc._id.toString(),
      email: userDoc.email,
      fullName: userDoc.fullName,
      role: userDoc.role,
      phone: userDoc.phone,
      birthDate: userDoc.birthDate,
      avatarUrl: userDoc.avatarUrl,
      syndicateCardImageUrl: userDoc.syndicateCardImageUrl,
      idFrontUrl: userDoc.idFrontUrl,
      idBackUrl: userDoc.idBackUrl,
      contact: userDoc.contact,
      petStore,
      appointments,
      records
    })
  } catch (_) { }
  const user = memUsers.find(u => u.id === (req as any).user.id)
  if (!user) return res.status(404).json({ error: 'not_found' })
  return res.json({ id: user.id, email: user.email, fullName: user.fullName, role: user.role })
})

const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(), // Relaxed validation to avoid blocking local numbers
    birthDate: z.string().optional(),
    avatarUrl: z.string().optional(),
    syndicateCardImageUrl: z.string().optional(),
    commercialRegImageUrl: z.string().optional(),
    idFrontUrl: z.string().optional(),
    idBackUrl: z.string().optional(),
    // PetStore specific
    storeName: z.string().optional(),
    description: z.string().optional(),
    brands: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    // Vet specific (stored in contact)
    specialization: z.string().optional(),
    experienceYears: z.number().optional(),
    country: z.string().optional(),
    qualification: z.string().optional(),
    consultationFee: z.number().optional(),
    discountedFee: z.number().optional(),
    discountExpiresAt: z.string().optional(),
    clinicAddress: z.string().optional(),
    governorate: z.string().optional(),
    phoneNumbers: z.array(z.object({
      number: z.string(),
      label: z.string()
    })).optional(),
  })
})

router.put('/profile', requireAuth(['user', 'vet', 'admin', 'petstore']), validate(updateProfileSchema), async (req, res) => {
  try {
    const userDoc = await MUserModel.findById((req as any).user.id)
    if (!userDoc) return res.status(404).json({ error: 'not_found' })

    if (req.body.email && req.body.email !== userDoc.email) {
      const exists = await MUserModel.findOne({ email: req.body.email })
      if (exists) return res.status(409).json({ error: 'email_taken', message: 'عذراً، هذا البريد الإلكتروني مسجل مسبقاً.' })
      userDoc.email = req.body.email
    }

    if (req.body.fullName) userDoc.fullName = req.body.fullName
    if (req.body.phone) userDoc.phone = req.body.phone
    if (req.body.birthDate) userDoc.birthDate = req.body.birthDate
    if (req.body.avatarUrl) userDoc.avatarUrl = req.body.avatarUrl

    // Update Vet specific data
    if ((req as any).user.role === 'vet') {
      if (req.body.syndicateCardImageUrl) userDoc.syndicateCardImageUrl = req.body.syndicateCardImageUrl
      if (req.body.idFrontUrl) userDoc.idFrontUrl = req.body.idFrontUrl
      if (req.body.idBackUrl) userDoc.idBackUrl = req.body.idBackUrl

      // Update contact info (JSON)
      let contact: any = {}
      try { contact = JSON.parse(userDoc.contact || '{}') } catch (e) { }

      if (req.body.specialization) contact.specialization = req.body.specialization
      if (req.body.experienceYears) contact.experienceYears = req.body.experienceYears
      if (req.body.country) contact.country = req.body.country
      if (req.body.qualification) contact.qualification = req.body.qualification
      if (req.body.consultationFee !== undefined) contact.consultationFee = req.body.consultationFee
      if (req.body.discountedFee !== undefined) contact.discountedFee = req.body.discountedFee
      if (req.body.discountExpiresAt !== undefined) contact.discountExpiresAt = req.body.discountExpiresAt
      if (req.body.clinicAddress) contact.clinicAddress = req.body.clinicAddress
      if (req.body.governorate) contact.governorate = req.body.governorate
      if (req.body.phoneNumbers !== undefined) contact.phoneNumbers = req.body.phoneNumbers

      userDoc.contact = JSON.stringify(contact)
    }

    // Update PetStore specific data
    if ((req as any).user.role === 'petstore') {
      if (req.body.commercialRegImageUrl) userDoc.commercialRegImageUrl = req.body.commercialRegImageUrl

      // Update PetStore model
      let store = await MPetStoreModel.findOne({ userId: userDoc._id.toString() })
      if (!store) {
        store = new MPetStoreModel({ userId: userDoc._id.toString() })
      }

      if (req.body.storeName) store.storeName = req.body.storeName
      if (req.body.description) store.description = req.body.description
      if (req.body.brands) store.brands = req.body.brands
      if (req.body.city) store.city = req.body.city
      if (req.body.address) store.address = req.body.address
      if (req.body.commercialRegImageUrl) store.commercialRegImageUrl = req.body.commercialRegImageUrl

      await store.save()
    }

    await userDoc.save();

    // Return the updated user object
    const updatedUser = {
      id: userDoc._id.toString(),
      email: userDoc.email,
      fullName: userDoc.fullName,
      role: userDoc.role,
      phone: userDoc.phone,
      birthDate: userDoc.birthDate,
      avatarUrl: userDoc.avatarUrl,
      // Include any other relevant fields
      ...(userDoc.role === 'vet' ? { contact: userDoc.contact } : {}),
      ...(userDoc.role === 'petstore' ? {
        storeName: req.body.storeName,
        description: req.body.description,
        address: req.body.address,
        city: req.body.city
      } : {})
    };

    return res.json(updatedUser);
  } catch (err) {
    console.error('Error in profile update:', err);
    return res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء تحديث البيانات' });
  }
} // Ending the route here, removing the confusing fallbacks which were likely causing issues
);

// Separate TypeORM profile update if needed, but for now MongoDB is primary
// (Removing the old fallback code that followed)


router.delete('/me', requireAuth(['user', 'vet', 'admin', 'petstore']), async (req, res) => {
  try {
    const userDoc = await MUserModel.findById((req as any).user.id)
    if (!userDoc) return res.status(404).json({ error: 'not_found', message: 'المستخدم غير موجود' })
    await userDoc.deleteOne()
    res.setHeader('Set-Cookie', `token=; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}; Max-Age=0`)
    return res.json({ success: true })
  } catch (_) { }
  const idx = memUsers.findIndex(u => u.id === (req as any).user.id)
  if (idx === -1) return res.status(404).json({ error: 'not_found' })
  memUsers.splice(idx, 1)
  res.setHeader('Set-Cookie', `token=; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}; Max-Age=0`)
  return res.json({ success: true })
})

// Upload profile image
router.patch('/profile/image', requireAuth(['user', 'vet', 'admin', 'petstore']), upload.single('image'), async (req, res) => {
  try {
    const userDoc = await MUserModel.findById((req as any).user.id)
    if (!userDoc) return res.status(404).json({ error: 'not_found' })

    const file = (req as any).file
    if (!file || !file.path) {
      return res.status(400).json({ error: 'no_image_provided' })
    }

    // Update avatar URL with Cloudinary URL
    userDoc.avatarUrl = file.path
    await userDoc.save()

    return res.json({
      success: true,
      avatarUrl: file.path,
      message: 'تم تحديث صورة الملف الشخصي بنجاح'
    })
  } catch (error) {
    console.error('Error uploading profile image:', error)
    return res.status(500).json({ error: 'server_error' })
  }
})

// Get user statistics
router.get('/profile/statistics', requireAuth(['user', 'vet', 'admin', 'petstore']), async (req, res) => {
  try {
    const userId = (req as any).user.id
    const role = (req as any).user.role

    const stats: any = {
      role,
      totalAppointments: 0,
      upcomingAppointments: 0,
      completedAppointments: 0,
      pendingAppointments: 0,
      totalPets: 0,
      totalReminders: 0,
      upcomingReminders: 0
    }

    // Get appointments based on role
    if (role === 'user') {
      const appointments = await AppointmentModel.find({ userId }).lean()
      stats.totalAppointments = appointments.length
      stats.upcomingAppointments = appointments.filter(a =>
        a.status !== 'completed' && a.status !== 'cancelled' && new Date(a.scheduledAt) > new Date()
      ).length
      stats.completedAppointments = appointments.filter(a => a.status === 'completed').length
      stats.pendingAppointments = appointments.filter(a => a.status === 'pending').length

      // Get pet records
      const pets = await PetRecordModel.find({ userId }).lean()
      stats.totalPets = pets.length

      // Get reminders
      const ReminderModel = mongoose.models.Reminder || mongoose.model('Reminder', new Schema({
        userId: { type: String, required: true },
        dueDate: { type: Date, required: true },
        sent: { type: Boolean, default: false }
      }))
      const reminders = await ReminderModel.find({ userId }).lean()
      stats.totalReminders = reminders.length
      stats.upcomingReminders = reminders.filter((r: any) =>
        new Date(r.dueDate) > new Date() && !r.sent
      ).length

    } else if (role === 'vet') {
      const appointments = await AppointmentModel.find({ vetId: userId }).lean()
      stats.totalAppointments = appointments.length
      stats.upcomingAppointments = appointments.filter(a =>
        a.status !== 'completed' && a.status !== 'cancelled' && new Date(a.scheduledAt) > new Date()
      ).length
      stats.completedAppointments = appointments.filter(a => a.status === 'completed').length
      stats.pendingAppointments = appointments.filter(a => a.status === 'pending').length

      // Calculate today's appointments
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      stats.todayAppointments = appointments.filter(a => {
        const apptDate = new Date(a.scheduledAt)
        return apptDate >= today && apptDate < tomorrow
      }).length

      // Calculate this month's appointments
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)

      stats.thisMonthAppointments = appointments.filter(a => {
        const apptDate = new Date(a.scheduledAt)
        return apptDate >= thisMonth
      }).length

    } else if (role === 'petstore') {
      // Get store info
      const store = await MPetStoreModel.findOne({ userId }).lean() as any
      if (store) {
        stats.storeName = store.storeName
        stats.totalProducts = store.products?.length || 0
        stats.rating = store.rating || 0
      }
    }

    return res.json({ statistics: stats })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return res.status(500).json({ error: 'server_error' })
  }
})

// Forgot Password - Send reset email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'email_required', message: 'يرجى إدخال البريد الإلكتروني' })

  try {
    // Try MongoDB first
    const userDoc = await MUserModel.findOne({ email })
    if (!userDoc) {
      // Don't reveal if email exists or not for security
      return res.json({ success: true, message: 'إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رابط إعادة التعيين' })
    }

    // Generate reset token (1 hour expiry)
    const resetToken = jwt.sign({ id: userDoc._id.toString(), email: userDoc.email, purpose: 'password_reset' }, String(process.env.JWT_SECRET), { expiresIn: '1h' })

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`
    const subject = 'إعادة تعيين كلمة المرور'
    const html = `<div dir="rtl" style="font-family: Arial, sans-serif;">
      <h2>مرحباً ${userDoc.fullName}</h2>
      <p>تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
      <p>إذا لم تطلب ذلك، يرجى تجاهل هذا البريد.</p>
      <p>لإعادة تعيين كلمة المرور، اضغط على الرابط التالي:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">إعادة تعيين كلمة المرور</a>
      <p style="margin-top: 20px; color: #666; font-size: 12px;">هذا الرابط صالح لمدة ساعة واحدة فقط.</p>
    </div>`

    await sendEmail(userDoc.email, subject, html)
    return res.json({ success: true, message: 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني' })
  } catch (error: any) {
    console.log("FORGOT PASSWORD CONTROLLER ERROR:", error);
    console.error('Forgot password error:', error)
    return res.status(500).json({ 
      error: 'server_error', 
      message: 'فشل إرسال البريد الإلكتروني. يرجى التحقق من إعدادات خادم البريد (SMTP) والمحاولة لاحقاً.',
      details: error.message || 'Unknown error'
    })
  }
})

// Reset Password - Update password with token
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'missing_fields', message: 'يرجى إدخال جميع الحقول المطلوبة' })
  }

  if (!strongPassword(newPassword)) {
    return res.status(400).json({ error: 'weak_password', message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
  }

  try {
    // Verify token
    const payload = jwt.verify(token, String(process.env.JWT_SECRET)) as any
    if (payload.purpose !== 'password_reset') {
      return res.status(400).json({ error: 'invalid_token', message: 'رابط غير صالح' })
    }

    // Find user and update password
    const userDoc = await MUserModel.findById(payload.id)
    if (!userDoc) {
      return res.status(404).json({ error: 'user_not_found', message: 'المستخدم غير موجود' })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    userDoc.passwordHash = passwordHash
    await userDoc.save()

    return res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح، يمكنك الآن تسجيل الدخول' })
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'token_expired', message: 'انتهت صلاحية الرابط، يرجى طلب رابط جديد' })
    }
    console.error('Reset password error:', error)
    return res.status(500).json({ error: 'server_error', message: 'حدث خطأ، يرجى المحاولة لاحقاً' })
  }
})

export default router
