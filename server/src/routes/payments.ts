import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { requireAuth } from '../middleware/auth'
import Stripe from 'stripe'
import { supabaseAdmin } from '../lib/supabase'
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

    // Verify profile exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()

    if (userError || !user) return res.status(404).json({ error: 'user_not_found', message: 'المستخدم غير موجود' })

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

    // Save pending payment record to Supabase
    const { data: payment, error: insertError } = await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'payment',
        amount: req.body.amount,
        currency: req.body.currency,
        stripe_payment_intent_id: intent.id,
        payment_method: 'card',
        status: 'pending'
      })
      .select()
      .single()

    if (insertError) {
      return res.status(500).json({ error: 'save_failed', message: insertError.message })
    }

    res.json({
      clientSecret: intent.client_secret,
      paymentId: payment.id
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

    const { data: payment, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .maybeSingle()

    if (error || !payment) return res.status(404).json({ error: 'not_found', message: 'عملية الدفع غير موجودة' })

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (intent.status === 'succeeded' && payment.status !== 'completed') {
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', payment.id)
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
        // Update orders with this session ID
        await supabaseAdmin
          .from('orders')
          .update({ payment_status: 'paid', stripe_payment_intent_id: session.payment_intent as string })
          .eq('stripe_session_id', session.id)
        break

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log(`💰 PaymentIntent was successful: ${paymentIntent.id}`)

        // Update payment status in DB
        await supabaseAdmin
          .from('transactions')
          .update({ status: 'completed' })
          .eq('stripe_payment_intent_id', paymentIntent.id)
        break

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object as Stripe.PaymentIntent
        console.log(`❌ Payment failed: ${failedIntent.last_payment_error?.message}`)

        await supabaseAdmin
          .from('transactions')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', failedIntent.id)
        break

      default:
        console.log(`Unhandled event type ${event.type}`)
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
  }

  res.json({ received: true })
})

// Get Payment History
router.get('/history', requireAuth(['user', 'vet', 'admin']), async (req, res) => {
  try {
    const role = (req as any).user.role
    const id = (req as any).user.id

    let query = supabaseAdmin.from('transactions').select('*').eq('type', 'payment').order('created_at', { ascending: false })

    if (role !== 'admin') {
      query = query.eq('user_id', id)
    }

    const { data: payments, error } = await query

    if (error) return res.status(500).json({ error: 'fetch_failed', message: error.message })
    res.json({ payments: payments || [] })
  } catch (error) {
    console.error('Error fetching history:', error)
    res.status(500).json({ error: 'fetch_failed', message: 'فشل جلب السجل' })
  }
})

export default router
