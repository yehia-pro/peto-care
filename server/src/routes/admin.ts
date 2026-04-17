import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { supabaseAdmin } from '../lib/supabase'
import { sendEmail } from '../services/email'
import { storesRepository } from '../repositories/storesRepository'
import { vetsRepository } from '../repositories/vetsRepository'

const router = Router()

const mapCouponRow = (row: any) => ({
  _id: row.id,
  id: row.id,
  code: row.code,
  discountType: row.discount_type,
  discountValue: Number(row.discount_value),
  expiresAt: row.expires_at,
  minOrderAmount: Number(row.min_order_amount ?? 0),
  maxUses: Number(row.max_uses ?? 0),
  usedCount: Number(row.used_count ?? 0),
  isActive: row.is_active !== false,
  createdAt: row.created_at
})

router.get('/overview', requireAuth(['admin']), async (_req: Request, res: Response) => {
  try {
    const { count: users } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer')
    const { count: vets } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'vet')
    const { count: appointments } = await supabaseAdmin.from('appointments').select('*', { count: 'exact', head: true })
    res.json({
      users: users ?? 0,
      vets: vets ?? 0,
      appointments: appointments ?? 0,
      payments: 0
    })
  } catch {
    res.json({ users: 0, vets: 0, appointments: 0, payments: 0 })
  }
})

async function profileToPendingPayload(profile: any, email: string) {
  const m = profile.metadata || {}
  return {
    _id: profile.id,
    fullName: profile.full_name || '',
    email,
    role: profile.role === 'store_owner' ? 'petstore' : 'vet',
    phone: profile.phone || '',
    syndicateCardImageUrl: m.syndicateCardImageUrl || m.syndicate_card_image_url,
    idFrontUrl: m.idFrontUrl || m.id_front_url,
    idBackUrl: m.idBackUrl || m.id_back_url,
    commercialRegImageUrl: m.commercialRegImageUrl || m.commercial_reg_image_url,
    createdAt: profile.created_at
  }
}

router.get('/pending', requireAuth(['admin']), async (_req: Request, res: Response) => {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, role, full_name, phone, metadata, created_at')
      .in('role', ['vet', 'store_owner'])
      .order('created_at', { ascending: false })

    if (error) throw error

    const pending = (profiles || []).filter((p: any) => (p.metadata || {}).approval_status === 'pending')
    const out: any[] = []

    for (const p of pending) {
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.getUserById(p.id)
      if (authErr || !authData?.user?.email) continue
      out.push(await profileToPendingPayload(p, authData.user.email))
    }

    res.json(out)
  } catch (e) {
    console.error('Error fetching pending users:', e)
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch pending requests' })
  }
})

router.put('/approve/:id', requireAuth(['admin']), async (req: Request, res: Response) => {
  try {
    const id = req.params.id
    const { data: prof, error } = await supabaseAdmin.from('profiles').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    if (!prof) return res.status(404).json({ error: 'not_found', message: 'User not found' })

    const meta = { ...(prof.metadata as object), approval_status: 'approved' as const }
    const { error: upErr } = await supabaseAdmin
      .from('profiles')
      .update({ metadata: meta, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (upErr) throw upErr

    if (prof.role === 'store_owner') {
      try {
        await storesRepository.getOrCreateForOwner(id)
      } catch (e) {
        console.error('[Approve] ensure store row:', e)
      }
    }

    if (prof.role === 'vet') {
      try {
        const { data: v } = await supabaseAdmin.from('vets').select('id').eq('user_id', id).maybeSingle()
        if (v?.id) await vetsRepository.setVerified(v.id, true)
      } catch (e) {
        console.error('[Approve] vet verify:', e)
      }
    }

    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(id)
    const email = authData?.user?.email
    if (email) {
      const roleLabel = prof.role === 'vet' ? 'طبيب بيطري' : 'متجر حيوانات أليفة'
      const subject = '🎉 تم قبول طلبك والترحيب بك في منصتنا!'
      const html = `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p>مرحباً ${prof.full_name || ''}،</p>
          <p>تمت الموافقة على تسجيلك كـ <strong>${roleLabel}</strong>. يمكنك تسجيل الدخول الآن.</p>
          <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login">تسجيل الدخول</a></p>
        </div>`
      try {
        await sendEmail(email, subject, html)
      } catch (mailError) {
        console.error('Failed to send approval email:', mailError)
      }
    }

    res.json({ success: true, message: 'User approved successfully' })
  } catch (error) {
    console.error('Error approving user:', error)
    res.status(500).json({ error: 'server_error', message: 'Failed to approve user' })
  }
})

router.delete('/reject/:id', requireAuth(['admin']), async (req: Request, res: Response) => {
  try {
    const id = req.params.id
    const { data: prof } = await supabaseAdmin.from('profiles').select('*').eq('id', id).maybeSingle()
    const { data: authData } = await supabaseAdmin.auth.admin.getUserById(id)
    const email = authData?.user?.email
    const fullName = prof?.full_name || ''

    if (email) {
      const roleLabel = prof?.role === 'vet' ? 'طبيب بيطري' : 'متجر حيوانات أليفة'
      const subject = 'بخصوص طلب تسجيلك في منصة Peto Care'
      const html = `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p>مرحباً ${fullName}،</p>
          <p>نأسف لإبلاغك بأنه تم رفض طلب تسجيلك كـ <strong>${roleLabel}</strong> في الوقت الحالي.</p>
          <p>يمكنك التواصل مع الدعم لمزيد من التفاصيل.</p>
        </div>`
      try {
        await sendEmail(email, subject, html)
      } catch (mailError) {
        console.error('Failed to send rejection email:', mailError)
      }
    }

    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (delErr) return res.status(400).json({ error: 'delete_failed', message: delErr.message })

    res.json({ success: true, message: 'User rejected and removed' })
  } catch (error) {
    console.error('Error rejecting user:', error)
    res.status(500).json({ error: 'server_error', message: 'Failed to reject user' })
  }
})

router.get('/stores', requireAuth(['admin']), async (_req: Request, res: Response) => {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, phone, metadata, created_at, role')
      .eq('role', 'store_owner')
      .order('created_at', { ascending: false })

    if (error) throw error

    const { data: storeRows } = await supabaseAdmin.from('stores').select('id, owner_user_id, name, metadata, created_at')

    const byOwner = new Map<string, any>()
    for (const s of storeRows || []) {
      byOwner.set(s.owner_user_id, s)
    }

    const stores = (profiles || []).map((p: any) => {
      const m = p.metadata || {}
      const pending = m.approval_status === 'pending'
      const row = byOwner.get(p.id)
      return {
        userId: p.id,
        fullName: p.full_name || 'بدون اسم',
        email: '',
        phone: p.phone || '',
        isApproved: !pending,
        createdAt: p.created_at,
        hasStoreRecord: !!row,
        store: row
          ? {
              storeName: row.name,
              storeType: row.metadata?.storeType,
              city: row.metadata?.city,
              address: row.metadata?.address,
              phone: row.phone,
              openingTime: row.metadata?.openingTime,
              closingTime: row.metadata?.closingTime,
              rating: row.metadata?.rating,
              createdAt: row.created_at
            }
          : null
      }
    })

    for (const s of stores) {
      const { data: authData } = await supabaseAdmin.auth.admin.getUserById(s.userId)
      if (authData?.user?.email) s.email = authData.user.email
    }

    res.json({ stores })
  } catch (error) {
    console.error('Error fetching admin stores:', error)
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch stores' })
  }
})

router.post('/stores/:userId/fix-store', requireAuth(['admin']), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const { data: prof } = await supabaseAdmin.from('profiles').select('id, role').eq('id', userId).maybeSingle()
    if (!prof) return res.status(404).json({ error: 'not_found', message: 'User not found' })
    if (prof.role !== 'store_owner') {
      return res.status(400).json({ error: 'wrong_role', message: 'User is not a petstore' })
    }

    const existing = await storesRepository.getByOwnerUserId(userId)
    if (existing) {
      return res.json({ success: true, message: 'Store record already exists', store: existing, alreadyExisted: true })
    }

    const created = await storesRepository.getOrCreateForOwner(userId)
    res.json({ success: true, message: 'Store record created successfully', store: created })
  } catch (error) {
    console.error('Error fixing store:', error)
    res.status(500).json({ error: 'server_error', message: 'Failed to fix store record' })
  }
})

router.delete('/stores/:userId', requireAuth(['admin']), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) return res.status(400).json({ error: 'delete_failed', message: error.message })
    res.json({ success: true, message: 'PetStore removed successfully' })
  } catch (error) {
    console.error('Error deleting store:', error)
    res.status(500).json({ error: 'server_error', message: 'Failed to delete store record' })
  }
})

router.get('/coupons', requireAuth(['admin']), async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin.from('admin_coupons').select('*').order('created_at', { ascending: false })
    if (error) throw error
    res.json({ coupons: (data || []).map(mapCouponRow) })
  } catch (error) {
    console.error('Error fetching coupons:', error)
    res.status(500).json({ error: 'server_error', message: 'Failed to fetch coupons' })
  }
})

router.post('/coupons', requireAuth(['admin']), async (req: Request, res: Response) => {
  try {
    const { code, discountType, discountValue, expiresAt, minOrderAmount, maxUses } = req.body
    if (!code || !['percentage', 'fixed'].includes(discountType)) {
      return res.status(400).json({ error: 'validation_error', message: 'بيانات غير صالحة' })
    }

    const upper = String(code).toUpperCase()
    const { data: dup } = await supabaseAdmin.from('admin_coupons').select('id').eq('code', upper).maybeSingle()
    if (dup) return res.status(400).json({ error: 'duplicate_code', message: 'Coupon code already exists' })

    const adminId = (req as any).user.id
    const { data, error } = await supabaseAdmin
      .from('admin_coupons')
      .insert({
        code: upper,
        discount_type: discountType,
        discount_value: Number(discountValue),
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        min_order_amount: minOrderAmount ?? 0,
        max_uses: maxUses ?? 0,
        used_count: 0,
        is_active: true,
        created_by: adminId
      })
      .select('*')
      .single()

    if (error) throw error
    res.status(201).json(mapCouponRow(data))
  } catch (error) {
    console.error('Error creating coupon:', error)
    res.status(500).json({ error: 'server_error', message: 'Failed to create coupon' })
  }
})

router.patch('/coupons/:id/toggle', requireAuth(['admin']), async (req: Request, res: Response) => {
  try {
    const { data: row, error: fErr } = await supabaseAdmin.from('admin_coupons').select('*').eq('id', req.params.id).maybeSingle()
    if (fErr) throw fErr
    if (!row) return res.status(404).json({ error: 'not_found', message: 'Coupon not found' })

    const { data, error } = await supabaseAdmin
      .from('admin_coupons')
      .update({ is_active: !row.is_active, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('*')
      .single()

    if (error) throw error
    res.json(mapCouponRow(data))
  } catch (error) {
    console.error('Error toggling coupon:', error)
    res.status(500).json({ error: 'server_error', message: 'Failed to toggle coupon' })
  }
})

router.delete('/coupons/:id', requireAuth(['admin']), async (req: Request, res: Response) => {
  try {
    const { error } = await supabaseAdmin.from('admin_coupons').delete().eq('id', req.params.id)
    if (error) throw error
    res.json({ success: true, message: 'Coupon deleted' })
  } catch (error) {
    console.error('Error deleting coupon:', error)
    res.status(500).json({ error: 'server_error', message: 'Failed to delete coupon' })
  }
})

export default router
