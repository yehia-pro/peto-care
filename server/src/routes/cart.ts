import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { requireAuth } from '../middleware/auth'
import { Cart } from '../models/Cart'
import { Types } from 'mongoose'

const router = Router()

const addToCartSchema = z.object({
  body: z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    price: z.number().min(0),
    name: z.string(),
    image: z.string().optional()
  })
})

// Get user's cart
router.get('/', requireAuth(['user', 'vet']), async (req, res) => {
  const userId = (req as any).user.id
  let cart = await Cart.findOne({ userId })

  if (!cart) {
    cart = await Cart.create({ userId, items: [], totalAmount: 0 })
  }

  res.json({ cart })
})

// Add item to cart
router.post('/add', requireAuth(['user', 'vet']), validate(addToCartSchema), async (req, res) => {
  const userId = (req as any).user.id
  const { productId, quantity, price, name, image } = req.body

  let cart = await Cart.findOne({ userId })
  if (!cart) {
    cart = new Cart({ userId, items: [], totalAmount: 0 })
  }

  const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId)

  if (existingItemIndex > -1) {
    cart.items[existingItemIndex].quantity += quantity
  } else {
    cart.items.push({
      productId: new Types.ObjectId(productId),
      quantity,
      price,
      name,
      image
    })
  }

  await cart.save()
  res.json({ cart })
})

// Remove item from cart
router.delete('/remove/:productId', requireAuth(['user', 'vet']), async (req, res) => {
  const userId = (req as any).user.id
  const { productId } = req.params

  const cart = await Cart.findOne({ userId })
  if (!cart) return res.status(404).json({ error: 'cart_not_found', message: 'السلة غير موجودة' })

  cart.items = cart.items.filter(item => item.productId.toString() !== productId)
  await cart.save()

  res.json({ cart })
})

// Checkout (Mock implementation for now, or link to payment)
router.post('/checkout', requireAuth(['user', 'vet']), async (req, res) => {
  const userId = (req as any).user.id
  const cart = await Cart.findOne({ userId })

  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ error: 'cart_empty', message: 'السلة فارغة' })
  }

  // Here you would integrate with payment gateway
  // For now, we'll just clear the cart and return success

  const orderTotal = cart.totalAmount
  const items = [...cart.items]

  // Clear cart
  cart.items = []
  cart.totalAmount = 0
  await cart.save()

  res.json({ success: true, message: 'تم الطلب بنجاح', orderTotal, items })
})

export default router
