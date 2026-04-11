import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import Coupon from '../models/Coupon'

const router = Router()

// Validate a coupon code
router.post('/validate', requireAuth(['user', 'vet']), async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'invalid_request', message: 'Coupon code is required' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ error: 'not_found', message: 'Coupon code is invalid' });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ error: 'inactive', message: 'This coupon is no longer active' });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'expired', message: 'This coupon has expired' });
    }

    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ 
        error: 'min_amount_not_met', 
        message: `This coupon requires a minimum order amount of ${coupon.minOrderAmount} EGP` 
      });
    }

    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return res.status(400).json({ error: 'max_uses_reached', message: 'This coupon has reached its maximum usage limit' });
    }

    // Calculate discount amount
    let discountCalculated = 0;
    if (coupon.discountType === 'percentage') {
      discountCalculated = (orderAmount * coupon.discountValue) / 100;
    } else if (coupon.discountType === 'fixed') {
      discountCalculated = coupon.discountValue;
    }

    // Cap the discount to not exceed the order amount
    discountCalculated = Math.min(discountCalculated, orderAmount);

    res.json({
      success: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountCalculated: discountCalculated
    });

  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ error: 'server_error', message: 'Failed to validate coupon' });
  }
});

export default router
