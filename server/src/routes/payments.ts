import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { requireAuth } from '../middleware/auth'
import Stripe from 'stripe'
import MUserModel from '../models/User'
import Transaction from '../models/Transaction'
import { Cart } from '../models/Cart'
import { JsonDb } from '../utils/jsonDb'
import bodyParser from 'body-parser'

const router = Router()
const stripe = new Stripe(String(process.env.STRIPE_SECRET_KEY), { apiVersion: '2022-11-15' })

// Create Payment Intent
const createSchema = z.object({
  body: z.object({
    amount: z.number().int().positive(),
    currency: z.string().default('usd'),
    metadata: z.record(z.string()).optional()
  })
})

router.post('/create-intent', requireAuth(['user', 'vet']), validate(createSchema), async (req, res) => {
  try {
    const userId = (req as any).user.id
    const user = await MUserModel.findById(userId)

    if (!user) return res.status(404).json({ error: 'user_not_found', message: 'المستخدم غير موجود' })

    // Create Stripe Payment Intent
    const intent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: req.body.currency,
      metadata: {
        userId: userId,
        shippingAddress: JSON.stringify(req.body.metadata?.shippingAddress || {}),
        ...req.body.metadata
      },
      automatic_payment_methods: { enabled: true }
    })

    // Save pending payment record
    const payment = await Transaction.create({
      userId: user._id,
      type: 'payment',
      amount: req.body.amount,
      currency: req.body.currency,
      stripePaymentIntentId: intent.id,
      paymentMethod: 'card',
      status: 'pending'
    })

    res.json({
      clientSecret: intent.client_secret,
      paymentId: payment._id
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    res.status(500).json({ error: 'payment_creation_failed', message: 'فشل إنشاء عملية الدفع' })
  }
})

// Confirm Payment (Manual check)
router.post('/confirm', requireAuth(['user', 'vet']), async (req, res) => {
  try {
    const { paymentIntentId } = req.body
    const payment = await Transaction.findOne({ stripePaymentIntentId: paymentIntentId })

    if (!payment) return res.status(404).json({ error: 'not_found', message: 'عملية الدفع غير موجودة' })

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (intent.status === 'succeeded' && payment.status !== 'completed') {
      payment.status = 'completed'
      await payment.save()
    }

    res.json({ status: intent.status })
  } catch (error) {
    console.error('Error confirming payment:', error)
    res.status(500).json({ error: 'confirmation_failed', message: 'فشل تأكيد الدفع' })
  }
})

// Stripe Webhook Handler
router.post('/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event: Stripe.Event

  try {
    if (!sig || !endpointSecret) throw new Error('Missing signature or secret')
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle the event

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`✅ CheckoutSession was successful: ${session.id}`)

        // ✅ تحديث حالة الطلب إلى "paid" فقط
        // (المخزن يُخصم مرة واحدة عند إنشاء الطلب في orders.ts)
        const orders = await require('../models/Order').MOrderModel.find({ stripeSessionId: session.id })
        
        if (orders && orders.length > 0) {
          for (const order of orders) {
            order.paymentStatus = 'paid'
            order.stripePaymentIntentId = session.payment_intent as string
            await order.save()
          }

          const userId = session.metadata?.userId
          if (userId) {
            // ✅ تفريغ سلة قاعدة البيانات بعد الدفع
            const cartInfo = await Cart.findOne({ userId })
            if (cartInfo) {
              cartInfo.items = []
              cartInfo.totalAmount = 0
              await cartInfo.save()
              console.log(`🛒 تم تفريغ سلة المستخدم: ${userId}`)
            }
          }
        }
        break

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log(`💰 PaymentIntent was successful: ${paymentIntent.id}`)

        // Update payment status in DB
        const payment = await Transaction.findOne({ stripePaymentIntentId: paymentIntent.id })
        if (payment) {
          payment.status = 'completed'
          await payment.save()

          // Create Order from Cart
          try {
            const userId = paymentIntent.metadata.userId
            const shippingAddress = JSON.parse(paymentIntent.metadata.shippingAddress || '{}')

            const user = await MUserModel.findById(userId)

            const memOrders: any[] = JsonDb.read('orders.json', [])
            const existingOrder = memOrders.find(o => o.paymentIntentId === paymentIntent.id)

            if (existingOrder) {
              console.log(`ℹ️ Order already exists for payment: ${payment.id}`)
              break
            }

            // Find Cart
            const cart = await Cart.findOne({ userId })

            if (user && cart && cart.items.length > 0) {
              const memProducts: any[] = JsonDb.read('products.json', [])
              const orderItems: any[] = []
              let totalAmount = 0

              for (const item of cart.items) {
                const product = memProducts.find((p: any) => p.id === item.productId.toString())
                const storeId = product ? product.storeId : 'unknown'

                orderItems.push({
                  productId: item.productId.toString(),
                  storeId,
                  name: item.name,
                  price: item.price,
                  quantity: item.quantity,
                  image: item.image
                })
                totalAmount += item.price * item.quantity
              }

              const order = {
                id: Math.random().toString(36).slice(2),
                userId,
                user: { id: userId, email: user.email, fullName: user.fullName },
                items: orderItems,
                totalAmount,
                status: 'pending',
                paymentMethod: 'card',
                shippingAddress,
                paymentStatus: 'paid',
                paymentIntentId: paymentIntent.id,
                createdAt: new Date()
              }

              memOrders.push(order)
              JsonDb.write('orders.json', memOrders)
              console.log(`✅ Order created successfully: ${order.id}`)

              // Deduct Stock
              try {
                const updatedProducts = memProducts.map((p: any) => {
                  const orderedItem = orderItems.find(item => item.productId === p.id)
                  if (orderedItem) {
                    return { ...p, stock: Math.max(0, (p.stock || 0) - orderedItem.quantity) }
                  }
                  return p
                })
                JsonDb.write('products.json', updatedProducts)
                console.log('📦 Stock updated successfully')
              } catch (stockError) {
                console.error('Error updating stock:', stockError)
              }

              // Clear Cart
              cart.items = []
              cart.totalAmount = 0
              await cart.save()
            } else {
              console.warn(`⚠️ Could not create order. User: ${!!user}, Cart Items: ${cart?.items?.length}`)
            }
          } catch (orderError) {
            console.error('CRITICAL: Error creating order in webhook:', orderError)
          }
        }
        break

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object as Stripe.PaymentIntent
        console.log(`❌ Payment failed: ${failedIntent.last_payment_error?.message}`)

        const failedPayment = await Transaction.findOne({ stripePaymentIntentId: failedIntent.id })
        if (failedPayment) {
          failedPayment.status = 'failed'
          await failedPayment.save()
        }
        break

      default:
        console.log(`Unhandled event type ${event.type}`)
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
    // Don't fail the webhook response, just log the error
  }

  res.json({ received: true })
})

// Get Payment History
router.get('/history', requireAuth(['user', 'vet', 'admin']), async (req, res) => {
  try {
    const role = (req as any).user.role
    const id = (req as any).user.id

    let payments
    if (role === 'admin') {
      payments = await Transaction.find({ type: 'payment' })
        .sort({ createdAt: -1 })
    } else {
      payments = await Transaction.find({ userId: id, type: 'payment' })
        .sort({ createdAt: -1 })
    }

    res.json({ payments })
  } catch (error) {
    console.error('Error fetching history:', error)
    res.status(500).json({ error: 'fetch_failed', message: 'فشل جلب السجل' })
  }
})

export default router
