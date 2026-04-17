import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

router.post('/validate', requireAuth(['user', 'vet', 'petstore']), async (req: Request, res: Response) => {
  try {
    const { code, orderAmount } = req.body
    if (!code) {
      return res.status(400).json({ error: 'invalid_request', message: 'Coupon code is required' })
    }

    const upper = String(code).toUpperCase()
    const { data: coupon, error } = await supabaseAdmin.from('admin_coupons').select('*').eq('code', upper).maybeSingle()
    if (error) throw error

    if (!coupon) {
      return res.status(404).json({ error: 'not_found', message: 'Coupon code is invalid' })
    }

    if (!coupon.is_active) {
      return res.status(400).json({ error: 'inactive', message: 'This coupon is no longer active' })
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ error: 'expired', message: 'This coupon has expired' })
    }

    const minAmt = Number(coupon.min_order_amount || 0)
    const amt = Number(orderAmount) || 0
    if (minAmt > 0 && amt < minAmt) {
      return res.status(400).json({
        error: 'min_amount_not_met',
        message: `This coupon requires a minimum order amount of ${minAmt} EGP`
      })
    }

    const maxUses = Number(coupon.max_uses || 0)
    const used = Number(coupon.used_count || 0)
    if (maxUses > 0 && used >= maxUses) {
      return res.status(400).json({ error: 'max_uses_reached', message: 'This coupon has reached its maximum usage limit' })
    }

    const discountType = coupon.discount_type
    const discountValue = Number(coupon.discount_value)
    let discountCalculated = 0
    if (discountType === 'percentage') {
      discountCalculated = (amt * discountValue) / 100
    } else if (discountType === 'fixed') {
      discountCalculated = discountValue
    }
    discountCalculated = Math.min(discountCalculated, amt)

    res.json({
      success: true,
      code: coupon.code,
      discountType,
      discountValue,
      discountCalculated
    })
  } catch (error) {
    console.error('Error validating coupon:', error)
    res.status(500).json({ error: 'server_error', message: 'Failed to validate coupon' })
  }
})

export default router
