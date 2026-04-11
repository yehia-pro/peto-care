import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { requireAuth } from '../middleware/auth'
import { Cart } from '../models/Cart'
import MUserModel from '../models/User'
import MPetStoreModel from '../models/PetStore'
import { MOrderModel } from '../models/Order'
import Coupon from '../models/Coupon'
import Stripe from 'stripe'

const router = Router()
const stripe = new Stripe(String(process.env.STRIPE_SECRET_KEY), { apiVersion: '2022-11-15' })

const createOrderSchema = z.object({
  body: z.object({
    shippingAddress: z.object({
      fullName: z.string(),
      phone: z.string(),
      city: z.string(),
      address: z.string(),
      notes: z.string().optional()
    }),
    paymentMethod: z.enum(['card', 'cash']),
    items: z.array(z.any()).optional(),
    couponCode: z.string().optional()
  })
})

/**
 * دالة مساعدة لتحويل السلة إلى تفاصيل طلبات مقسمة حسب المتجر
 */
async function processCartItems(userId: string, reqItems?: any[]) {
  let itemsToProcess = reqItems;
  let cart = null;

  if (!itemsToProcess || itemsToProcess.length === 0) {
    cart = await Cart.findOne({ userId })
    if (cart && cart.items) {
      itemsToProcess = cart.items
    }
  }

  if (!itemsToProcess || itemsToProcess.length === 0) {
    throw new Error('cart_empty')
  }

  // تجميع المنتجات حسب حساب المتجر
  const groupedByStore: Record<string, { storeId: string, items: any[], totalAmount: number }> = {}

  for (const item of itemsToProcess) {
    const storeObjId = item.storeId?.toString()
    if (!storeObjId) continue;

    if (!groupedByStore[storeObjId]) {
      groupedByStore[storeObjId] = { storeId: storeObjId, items: [], totalAmount: 0 }
    }

    groupedByStore[storeObjId].items.push({
      productId: item.productId?.toString() || item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.image || item.imageUrl
    })
    groupedByStore[storeObjId].totalAmount += item.price * item.quantity
  }

  return { cart, groupedByStore }
}

/**
 * ✅ دالة خصم المخزن فوراً عند إنشاء الطلب
 * تُستخدم لكلا طريقتي الدفع (COD + Stripe)
 */
async function deductStock(groupedByStore: Record<string, { storeId: string, items: any[], totalAmount: number }>) {
  for (const storeId in groupedByStore) {
    try {
      const store = await MPetStoreModel.findById(storeId)
      if (!store || !store.products) continue

      let modified = false
      for (const item of groupedByStore[storeId].items) {
        const productIndex = store.products.findIndex((p: any) =>
          p._id?.toString() === item.productId?.toString() || p.id === item.productId
        )
        if (productIndex !== -1) {
          const product = store.products[productIndex]
          const currentStock = Number(product.stock) || 0
          const newStock = Math.max(0, currentStock - item.quantity)
          ;(store.products as any)[productIndex].stock = newStock
          if (newStock === 0) {
            ;(store.products as any)[productIndex].inStock = false
            console.log(`⚠️ نفذ المخزن تلقائياً: ${product.name}`)
          }
          modified = true
        }
      }

      if (modified) {
        store.markModified('products')
        await store.save()
        console.log(`📦 تم خصم المخزن للمتجر: ${storeId}`)
      }
    } catch (err) {
      console.error(`❌ خطأ في خصم مخزون المتجر ${storeId}:`, err)
    }
  }
}

// 1. الدفع عند الاستلام (Cash on Delivery)
router.post('/', requireAuth(['user', 'vet']), validate(createOrderSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    if (req.body.paymentMethod !== 'cash') {
      return res.status(400).json({ error: 'invalid_method', message: 'للدفع بالبطاقة يرجى استخدام مسار /checkout-session' })
    }

    const { cart, groupedByStore } = await processCartItems(userId, req.body.items)
    const createdOrders = []

    let totalOverallAmount = 0
    for (const storeId in groupedByStore) {
      totalOverallAmount += groupedByStore[storeId].totalAmount
    }

    let discountProportion = 0
    if (req.body.couponCode) {
      const coupon = await Coupon.findOne({ code: req.body.couponCode.toUpperCase() })
      if (coupon && coupon.isActive && (!coupon.expiresAt || new Date(coupon.expiresAt) > new Date())) {
        if (!coupon.minOrderAmount || totalOverallAmount >= coupon.minOrderAmount) {
          if (coupon.discountType === 'percentage') {
            discountProportion = coupon.discountValue / 100
          } else if (coupon.discountType === 'fixed') {
            discountProportion = coupon.discountValue / totalOverallAmount
          }
          coupon.usedCount += 1
          await coupon.save()
        }
      }
    }

    // إنشاء طلب منفصل لكل متجر
    for (const storeId in groupedByStore) {
      const group = groupedByStore[storeId]
      const groupTotal = group.totalAmount
      const discountedGroupTotal = groupTotal - (groupTotal * discountProportion)

      const newOrder = await MOrderModel.create({
        userId,
        storeId,
        items: group.items,
        totalAmount: discountedGroupTotal,
        currency: 'EGP',
        shippingAddress: req.body.shippingAddress,
        status: 'pending',
        paymentStatus: 'pending' // الدفع عند الاستلام
      })
      createdOrders.push(newOrder)
    }

    // ✅ خصم المخزن فوراً عند الطلب (COD)
    await deductStock(groupedByStore)

    // إفراغ السلة إن وجدت
    if (cart) {
      cart.items = []
      cart.totalAmount = 0
      await cart.save()
    }

    res.status(201).json({ success: true, orders: createdOrders })
  } catch (error: any) {
    console.error('Error creating cash order:', error)
    if (error.message === 'cart_empty') return res.status(400).json({ error: 'cart_empty', message: 'السلة فارغة' })
    res.status(500).json({ error: 'order_creation_failed', message: 'فشل إنشاء الطلب' })
  }
})

// 2. إنشاء جلسة دفع عن طريق بوابة Stripe (الدفع بالبطاقة)
router.post('/checkout-session', requireAuth(['user', 'vet']), validate(createOrderSchema), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const user = await MUserModel.findById(userId)
    const { cart, groupedByStore } = await processCartItems(userId, req.body.items)

    const lineItems = []
    let totalOverallAmount = 0

    // Calculate overall total to apply proportional discount
    for (const storeId in groupedByStore) {
      for (const item of groupedByStore[storeId].items) {
        totalOverallAmount += (item.price * item.quantity)
      }
    }

    let discountProportion = 0
    if (req.body.couponCode) {
      const coupon = await Coupon.findOne({ code: req.body.couponCode.toUpperCase() })
      if (coupon && coupon.isActive && (!coupon.expiresAt || new Date(coupon.expiresAt) > new Date())) {
        if (!coupon.minOrderAmount || totalOverallAmount >= coupon.minOrderAmount) {
          if (coupon.discountType === 'percentage') {
            discountProportion = coupon.discountValue / 100
          } else if (coupon.discountType === 'fixed') {
            discountProportion = coupon.discountValue / totalOverallAmount
          }
          coupon.usedCount += 1
          await coupon.save()
        }
      }
    }

    // تجهيز المنتجات لواجهة الدفع الخاصة بـ Stripe مع الخصم إن وجد
    for (const storeId in groupedByStore) {
      for (const item of groupedByStore[storeId].items) {
        const itemDiscountedPrice = item.price - (item.price * discountProportion)
        lineItems.push({
          price_data: {
            currency: 'egp',
            product_data: {
              name: item.name,
              images: item.imageUrl && item.imageUrl.startsWith('http') ? [item.imageUrl] : []
            },
            unit_amount: Math.max(100, Math.round(itemDiscountedPrice * 100)) // Stripe يتعامل بالقروش وحد أدنى 1 جنيه
          },
          quantity: item.quantity
        })
      }
    }

    // ✅ خصم المخزن فوراً عند إنشاء جلسة Stripe (قبل الدفع)
    // هذا يمنع تكرار الطلب على نفس المنتج
    await deductStock(groupedByStore)

    // إنشاء جلسة Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: user?.email,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/cancel`,
      metadata: {
        userId: userId,
        shippingAddress: JSON.stringify(req.body.shippingAddress)
      }
    })

    // الحفظ في قاعدة البيانات كطلبات "معلقة (Pending)" باستخدام الـ Session ID
    const createdOrders = []
    for (const storeId in groupedByStore) {
      const group = groupedByStore[storeId]
      const groupTotal = group.totalAmount
      const discountedGroupTotal = groupTotal - (groupTotal * discountProportion)

      const newOrder = await MOrderModel.create({
        userId,
        storeId,
        items: group.items,
        totalAmount: discountedGroupTotal,
        currency: 'EGP',
        shippingAddress: req.body.shippingAddress,
        status: 'pending',
        paymentStatus: 'pending',
        stripeSessionId: session.id
      })
      createdOrders.push(newOrder)
    }

    res.json({ sessionId: session.id, url: session.url })
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    if (error.message === 'cart_empty') return res.status(400).json({ error: 'cart_empty', message: 'السلة فارغة' })
    res.status(500).json({ error: 'checkout_failed', message: 'فشل إعداد صفحة الدفع' })
  }
})

// 3. جلب طلبات المستخدم (للعملاء العاديين)
router.get('/my-orders', requireAuth(['user', 'vet']), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id
    const orders = await MOrderModel.find({ userId }).sort({ createdAt: -1 })
    res.json({ orders })
  } catch (error) {
    res.status(500).json({ error: 'fetch_failed' })
  }
})

// 4. جلب طلبات المتجر (لأصحاب المتاجر Petstores)
router.get('/store-orders', requireAuth(['petstore']), async (req: Request, res: Response) => {
  try {
    const storeId = (req as any).user.id
    const orders = await MOrderModel.find({ storeId }).sort({ createdAt: -1 }).populate('userId', 'fullName email')
    res.json({ orders })
  } catch (error) {
    res.status(500).json({ error: 'fetch_failed' })
  }
})

// 5. تحديث حالة الطلب من قبل صاحب المتجر (Vendor)
router.patch('/:id/status', requireAuth(['petstore']), async (req: Request, res: Response) => {
  try {
    const storeId = (req as any).user.id
    const orderId = req.params.id
    const status = req.body.status

    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'invalid_status' })
    }

    const order = await MOrderModel.findOneAndUpdate(
      { _id: orderId, storeId },
      { status },
      { new: true }
    )

    if (!order) return res.status(404).json({ error: 'not_found' })
    res.json({ success: true, order })
  } catch (error) {
    res.status(500).json({ error: 'update_failed' })
  }
})

export default router
