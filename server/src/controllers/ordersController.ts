import { Request, Response } from 'express'
import Stripe from 'stripe'
import { supabaseAdmin } from '../lib/supabase'
import { ordersRepository } from '../repositories/ordersRepository'

const stripeKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeKey ? new Stripe(String(stripeKey), { apiVersion: '2022-11-15' }) : null

async function processCartItems(userId: string, reqItems?: any[]) {
  const itemsToProcess = reqItems
  if (!itemsToProcess || itemsToProcess.length === 0) {
    throw new Error('cart_empty')
  }
  const groupedByStore: Record<string, { storeId: string; items: any[]; totalAmount: number }> = {}
  for (const item of itemsToProcess) {
    const storeId = String(item.storeId || '')
    if (!storeId) continue
    if (!groupedByStore[storeId]) groupedByStore[storeId] = { storeId, items: [], totalAmount: 0 }
    groupedByStore[storeId].items.push({
      productId: item.productId?.toString() || item.id,
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity) || 1,
      imageUrl: item.image || item.imageUrl
    })
    groupedByStore[storeId].totalAmount += Number(item.price) * (Number(item.quantity) || 1)
  }
  if (Object.keys(groupedByStore).length === 0) throw new Error('cart_empty')
  return { groupedByStore }
}

export const ordersController = {
  async createCash(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      if (req.body.paymentMethod !== 'cash') {
        return res.status(400).json({ error: 'invalid_method', message: 'للدفع بالبطاقة استخدم checkout-session' })
      }
      const { groupedByStore } = await processCartItems(userId, req.body.items)
      const orders = await ordersRepository.createCashOrders(userId, req.body.shippingAddress, groupedByStore)
      return res.status(201).json({ success: true, orders })
    } catch (e: any) {
      console.error(e)
      if (e.message === 'cart_empty') return res.status(400).json({ error: 'cart_empty', message: 'السلة فارغة' })
      return res.status(500).json({ error: 'order_creation_failed', message: e.message || 'فشل إنشاء الطلب' })
    }
  },

  async checkoutSession(req: Request, res: Response) {
    try {
      if (!stripe) return res.status(503).json({ error: 'stripe_not_configured', message: 'Stripe غير مُعد' })
      const userId = (req as any).user.id
      const email = (req as any).user.email || ''
      const { groupedByStore } = await processCartItems(userId, req.body.items)

      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
      for (const storeId in groupedByStore) {
        for (const item of groupedByStore[storeId].items) {
          lineItems.push({
            price_data: {
              currency: 'egp',
              product_data: {
                name: item.name,
                images: item.imageUrl && String(item.imageUrl).startsWith('http') ? [item.imageUrl] : []
              },
              unit_amount: Math.max(100, Math.round(Number(item.price) * 100))
            },
            quantity: item.quantity
          })
        }
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: email || undefined,
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/checkout/cancel`,
        metadata: { userId, shippingAddress: JSON.stringify(req.body.shippingAddress || {}) }
      })

      await ordersRepository.createStripeDraftOrders(userId, req.body.shippingAddress || {}, groupedByStore, session.id)

      return res.json({ sessionId: session.id, url: session.url })
    } catch (e: any) {
      console.error(e)
      if (e.message === 'cart_empty') return res.status(400).json({ error: 'cart_empty', message: 'السلة فارغة' })
      return res.status(500).json({ error: 'checkout_failed', message: e.message || 'فشل إعداد الدفع' })
    }
  },

  async myOrders(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const orders = await ordersRepository.listForCustomer(userId)
      return res.json({ orders })
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ error: 'fetch_failed' })
    }
  },

  async storeOrders(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const orders = await ordersRepository.listForStoreOwner(userId)
      return res.json({ orders })
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ error: 'fetch_failed' })
    }
  },

  async patchStatus(req: Request, res: Response) {
    try {
      const ownerUserId = (req as any).user.id
      const orderId = req.params.id
      const status = req.body.status
      if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'invalid_status' })
      }
      const { data: store } = await supabaseAdmin.from('stores').select('id').eq('owner_user_id', ownerUserId).maybeSingle()
      if (!store) return res.status(404).json({ error: 'store_not_found' })
      const row = await ordersRepository.updateStatusForStore(orderId, store.id, status)
      if (!row) return res.status(404).json({ error: 'not_found' })
      const order = await ordersRepository.getMappedOrderForStore(orderId, store.id)
      return res.json({ success: true, order })
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ error: 'update_failed' })
    }
  }
}
