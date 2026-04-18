import { Router } from 'express'
import { z } from 'zod'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { validate } from '../middleware/validate'
import { requireAuth } from '../middleware/auth'
import { supabaseAdmin } from '../lib/supabase'
import { vetsRepository } from '../repositories/vetsRepository'

const router = Router()

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(2),
    role: z.enum(['user', 'vet', 'petstore']).optional(),
    phone: z.string().optional()
  })
})

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6)
  })
})

const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().max(100).optional(),
    phone: z.string().optional(),
    avatarUrl: z.string().optional()
  })
})

const toProfileRole = (role?: 'user' | 'vet' | 'petstore') => {
  if (role === 'vet') return 'vet'
  if (role === 'petstore') return 'store_owner'
  return 'customer'
}

const toLegacyRole = (role?: string | null): 'user' | 'vet' | 'admin' | 'petstore' => {
  if (role === 'vet') return 'vet'
  if (role === 'admin') return 'admin'
  if (role === 'store_owner') return 'petstore'
  return 'user'
}

router.post('/register', validate(registerSchema), async (req, res) => {
  const { email, password, fullName, phone, role } = req.body

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  })

  if (error || !data.user) {
    return res.status(400).json({ error: 'register_failed', message: error?.message || 'فشل إنشاء الحساب' })
  }

  const profileRole = toProfileRole(role)
  const needsApproval = profileRole === 'vet' || profileRole === 'store_owner'

  const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
    id: data.user.id,
    role: profileRole,
    full_name: fullName,
    phone: phone || null,
    metadata: needsApproval ? { approval_status: 'pending' } : {}
  })

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(data.user.id)
    return res.status(400).json({ error: 'profile_create_failed', message: profileError.message })
  }

  if (needsApproval) {
    return res.status(201).json({
      pendingApproval: true,
      message: 'تم استلام طلبك. سيتم إشعارك بعد مراجعة الإدارة.',
      user: {
        id: data.user.id,
        email,
        fullName,
        role: toLegacyRole(profileRole)
      }
    })
  }

  const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({ email, password })
  if (signInError || !signInData.session) {
    await supabaseAdmin.auth.admin.deleteUser(data.user.id)
    return res.status(400).json({ error: 'login_after_register_failed', message: signInError?.message || 'فشل تسجيل الدخول' })
  }

  return res.status(201).json({
    token: signInData.session.access_token,
    user: {
      id: data.user.id,
      email,
      fullName,
      role: toLegacyRole(profileRole)
    }
  })
})

router.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password })

  if (error || !data.user || !data.session) {
    return res.status(401).json({ error: 'invalid_credentials', message: 'بيانات الدخول غير صحيحة' })
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role, full_name, metadata')
    .eq('id', data.user.id)
    .maybeSingle()

  const meta = (profile?.metadata || {}) as Record<string, unknown>
  const pendingApproval = meta.approval_status === 'pending'
  const pr = profile?.role
  if ((pr === 'vet' || pr === 'store_owner') && pendingApproval) {
    return res.status(403).json({
      error: 'account_pending_approval',
      message: 'حسابك قيد المراجعة من قبل الإدارة.'
    })
  }

  return res.json({
    token: data.session.access_token,
    user: {
      id: data.user.id,
      email: data.user.email,
      fullName: profile?.full_name || data.user.user_metadata?.full_name || '',
      role: toLegacyRole(profile?.role)
    }
  })
})

router.post('/refresh', async (_req, res) => {
  return res.status(410).json({
    error: 'refresh_removed',
    message: 'Supabase manages session refresh on the client'
  })
})

router.get('/profile', requireAuth(['user', 'vet', 'admin', 'petstore']), async (req, res) => {
  const userId = (req as any).user.id
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error || !profile) {
    return res.status(404).json({ error: 'not_found', message: 'المستخدم غير موجود' })
  }

    return res.json({
    id: userId,
    email: (req as any).user.email,
    fullName: profile.full_name || '',
    role: toLegacyRole(profile.role),
    phone: profile.phone || null,
    avatarUrl: profile.avatar_url || null,
    country: profile.country || null,
    metadata: profile.metadata || {}
  })
})

router.put('/profile', requireAuth(['user', 'vet', 'admin', 'petstore']), validate(updateProfileSchema), async (req, res) => {
  const userId = (req as any).user.id
  const updates: Record<string, any> = { updated_at: new Date().toISOString() }

  if (req.body.fullName !== undefined) updates.full_name = req.body.fullName
  if (req.body.phone !== undefined) updates.phone = req.body.phone
  if (req.body.avatarUrl !== undefined) updates.avatar_url = req.body.avatarUrl

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('*')
    .single()

  if (error) {
    return res.status(400).json({ error: 'profile_update_failed', message: error.message })
  }

  return res.json({
    id: userId,
    email: (req as any).user.email,
    fullName: data.full_name || '',
    role: toLegacyRole(data.role),
    phone: data.phone || null,
    avatarUrl: data.avatar_url || null
  })
})

router.put('/profile/complete', requireAuth(['user', 'vet', 'admin', 'petstore']), async (req, res) => {
  const userId = (req as any).user.id
  const { phone, altPhone, city, address, location } = req.body

  if (!phone || !city || !address) {
    return res.status(400).json({ error: 'missing_fields', message: 'الهاتف والمحافظة والعنوان مطلوبين' })
  }

  try {
    // Fetch current profile metadata to merge
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('metadata')
      .eq('id', userId)
      .single()

    if (profileErr) {
      return res.status(400).json({ error: 'profile_fetch_failed', message: profileErr.message })
    }

    const newMetadata = {
      ...(profile.metadata as Record<string, any> || {}),
      altPhone,
      address,
      location: location || null
    }

    const updates = {
      phone,
      country: city,
      metadata: newMetadata,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (error) {
      return res.status(400).json({ error: 'profile_update_failed', message: error.message })
    }

    return res.json({ success: true, message: 'تم استكمال البيانات بنجاح' })
  } catch (error: any) {
    return res.status(500).json({ error: 'server_error', message: error.message })
  }
})

router.patch('/profile/image', requireAuth(['user', 'vet', 'admin', 'petstore']), async (req, res) => {
  const userId = (req as any).user.id
  const avatarUrl = req.body?.avatarUrl
  if (!avatarUrl) return res.status(400).json({ error: 'no_image_provided' })

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) return res.status(400).json({ error: 'profile_image_update_failed', message: error.message })

  return res.json({ success: true, avatarUrl, message: 'تم تحديث صورة الملف الشخصي بنجاح' })
})

router.delete('/me', requireAuth(['user', 'vet', 'admin', 'petstore']), async (req, res) => {
  const userId = (req as any).user.id
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) return res.status(400).json({ error: 'delete_user_failed', message: error.message })
  return res.json({ success: true })
})

router.post('/forgot-password', async (req, res) => {
  const email = req.body?.email
  if (!email) return res.status(400).json({ error: 'email_required', message: 'يرجى إدخال البريد الإلكتروني' })

  const redirectTo = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`
  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, { redirectTo })
  if (error) return res.status(400).json({ error: 'reset_email_failed', message: error.message })

      return res.json({ success: true, message: 'إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رابط إعادة التعيين' })
})

router.post('/reset-password', async (req, res) => {
  return res.status(410).json({
    error: 'reset_via_supabase',
    message: 'تغيير كلمة المرور يتم عبر رابط Supabase المرسل للبريد'
  })
})

router.post('/seed-demo-vet', async (_req, res) => {
  return res.status(410).json({ error: 'removed_in_hard_cutover' })
})

router.post('/seed-demo-store', async (_req, res) => {
  return res.status(410).json({ error: 'removed_in_hard_cutover' })
})

router.post('/seed-demo-user', async (_req, res) => {
  return res.status(410).json({ error: 'removed_in_hard_cutover' })
})

const uploadsBase = path.join(__dirname, '..', '..', 'uploads')
const ensureUploadsDir = () => {
  if (!fs.existsSync(uploadsBase)) fs.mkdirSync(uploadsBase, { recursive: true })
}

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadsDir()
    cb(null, uploadsBase)
  },
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${String(file.originalname).replace(/[^\w.\-]/g, '_')}`)
})

const petstoreRegisterUpload = multer({
  storage: diskStorage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      /image\/(jpeg|png|webp|gif|heic|heif)/i.test(file.mimetype) ||
      /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(file.originalname)
    if (ok) cb(null, true)
    else cb(new Error('invalid_image_type'))
  }
}).fields([
  { name: 'commercialRegImage', maxCount: 1 },
  { name: 'idFrontImage', maxCount: 1 },
  { name: 'idBackImage', maxCount: 1 }
])

const vetRegisterUpload = multer({
  storage: diskStorage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype) ||
      /\.(pdf|jpe?g|png|webp)$/i.test(file.originalname)
    if (ok) cb(null, true)
    else cb(new Error('invalid_vet_file_type'))
  }
}).fields([
  { name: 'syndicateCardImage', maxCount: 1 },
  { name: 'idFrontImage', maxCount: 1 },
  { name: 'idBackImage', maxCount: 1 }
])

router.post('/register-store', (req, res, next) => {
  petstoreRegisterUpload(req, res, (err: unknown) => {
    if (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return res.status(400).json({
        error: 'upload_failed',
        message: msg === 'invalid_image_type' ? 'نوع الصورة غير مسموح' : msg
      })
    }
    next()
  })
}, async (req, res) => {
  try {
    const b = req.body as Record<string, string | undefined>
    const email = String(b.email || '')
      .trim()
      .toLowerCase()
    const password = String(b.password || '')
    const fullName = String(b.fullName || b.storeName || '').trim()
    const phone = b.phone ? String(b.phone) : undefined

    if (!email || !password || password.length < 6 || !fullName) {
      return res.status(400).json({ error: 'validation_error', message: 'بيانات التسجيل غير مكتملة' })
    }

    const files = (req as any).files as Record<string, { filename: string }[]> | undefined
    const urlOf = (field: string) => {
      const f = files?.[field]?.[0]
      return f ? `/uploads/${f.filename}` : ''
    }
    const commercialRegImageUrl = urlOf('commercialRegImage')
    const idFrontUrl = urlOf('idFrontImage')
    const idBackUrl = urlOf('idBackImage')
    if (!commercialRegImageUrl || !idFrontUrl || !idBackUrl) {
      return res.status(400).json({
        error: 'documents_required',
        message: 'يجب رفع السجل التجاري وصور الهوية'
      })
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })
    if (error || !data.user) {
      return res.status(400).json({ error: 'register_failed', message: error?.message || 'فشل إنشاء الحساب' })
    }

    const services =
      typeof b.services === 'string' && b.services
        ? b.services.split(',').map((s) => s.trim()).filter(Boolean)
        : []
    const brands =
      typeof b.brands === 'string' && b.brands ? b.brands.split(',').map((s) => s.trim()).filter(Boolean) : []

    const metadata: Record<string, unknown> = {
      approval_status: 'pending',
      commercialRegImageUrl,
      idFrontUrl,
      idBackUrl,
      storeType: b.storeType,
      description: b.description,
      address: b.address,
      city: b.city,
      country: b.country,
      whatsapp: b.whatsapp,
      openingTime: b.openingTime,
      closingTime: b.closingTime,
      services,
      brands
    }

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: data.user.id,
      role: 'store_owner',
      full_name: fullName,
      phone: phone || null,
      metadata
    })

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(data.user.id)
      return res.status(400).json({ error: 'profile_create_failed', message: profileError.message })
    }

    return res.status(201).json({
      pendingApproval: true,
      message: 'تم استلام طلبك. سيتم إشعارك بعد مراجعة الإدارة.',
      user: {
        id: data.user.id,
        email,
        fullName,
        role: 'petstore'
      }
    })
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ error: 'server_error', message: e.message || 'خطأ في الخادم' })
  }
})

router.post('/register-vet', (req, res, next) => {
  vetRegisterUpload(req, res, (err: unknown) => {
    if (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return res.status(400).json({
        error: 'upload_failed',
        message: msg === 'invalid_vet_file_type' ? 'نوع الملف غير مسموح (PDF أو صورة)' : msg
      })
    }
    next()
  })
}, async (req, res) => {
  try {
    const b = req.body as Record<string, string | undefined>
    const email = String(b.email || '')
      .trim()
      .toLowerCase()
    const password = String(b.password || '')
    const fullName = String(b.fullName || '').trim()
    const phone = b.phone ? String(b.phone) : undefined

    if (!email || !password || password.length < 6 || !fullName) {
      return res.status(400).json({ error: 'validation_error', message: 'بيانات التسجيل غير مكتملة' })
    }

    const files = (req as any).files as Record<string, { filename: string }[]> | undefined
    const urlOf = (field: string) => {
      const f = files?.[field]?.[0]
      return f ? `/uploads/${f.filename}` : ''
    }
    const syndicateCardImageUrl = urlOf('syndicateCardImage')
    const idFrontUrl = urlOf('idFrontImage')
    const idBackUrl = urlOf('idBackImage')
    if (!syndicateCardImageUrl || !idFrontUrl || !idBackUrl) {
      return res.status(400).json({
        error: 'documents_required',
        message: 'يجب رفع كارنيه النقابة وصور الهوية'
      })
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })
    if (error || !data.user) {
      return res.status(400).json({ error: 'register_failed', message: error?.message || 'فشل إنشاء الحساب' })
    }

    const userId = data.user.id
    const vetPayload = {
      clinicName: fullName,
      licenseNumber: `PENDING-${userId.slice(0, 8)}`,
      specialization: String(b.specialization || 'General'),
      yearsOfExperience: parseInt(String(b.experienceYears || '0'), 10) || 0,
      education: String(b.qualification || ''),
      country: String(b.country || 'Egypt')
    }

    try {
      await vetsRepository.upsertVetRow(userId, vetPayload, false)
    } catch (ve: any) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return res.status(400).json({ error: 'vet_row_failed', message: ve.message || 'فشل حفظ بيانات الطبيب' })
    }

    const metadata: Record<string, unknown> = {
      approval_status: 'pending',
      syndicateCardImageUrl,
      idFrontUrl,
      idBackUrl
    }

    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: userId,
      role: 'vet',
      full_name: fullName,
      phone: phone || null,
      country: vetPayload.country,
      metadata
    })

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return res.status(400).json({ error: 'profile_create_failed', message: profileError.message })
    }

    return res.status(201).json({
      pendingApproval: true,
      message: 'تم استلام طلبك. سيتم إشعارك بعد مراجعة الإدارة.',
      user: {
        id: userId,
        email,
        fullName,
        role: 'vet'
      }
    })
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ error: 'server_error', message: e.message || 'خطأ في الخادم' })
  }
})

export default router
