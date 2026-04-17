import { supabaseAdmin } from '../lib/supabase'
import { storeProductsRepository } from './storeProductsRepository'

export const dbStatusToLegacy = (s: string): string => {
  switch (s) {
    case 'placed':
    case 'draft':
      return 'pending'
    case 'paid':
      return 'processing'
    case 'shipped':
      return 'shipped'
    case 'delivered':
      return 'delivered'
    case 'cancelled':
    case 'refunded':
      return 'cancelled'
    default:
      return 'pending'
  }
}

export const legacyStatusToDb = (s: string): string => {
  switch (s) {
    case 'pending':
      return 'placed'
    case 'processing':
      return 'paid'
    case 'shipped':
      return 'shipped'
    case 'delivered':
      return 'delivered'
    case 'cancelled':
      return 'cancelled'
    default:
      return 'placed'
  }
}

export const mapOrderRow = (order: any, items: any[], customer?: any) => {
  const meta = order.metadata || {}
  const mappedItems = (items || []).map((it: any) => {
    const m = it.metadata || {}
    return {
      productId: m.product_id || m.productId,
      name: it.name,
      price: (it.unit_price_cents || 0) / 100,
      quantity: it.quantity,
      imageUrl: m.image_url || m.imageUrl || ''
    }
  })
  return {
    _id: order.id,
    id: order.id,
    userId: customer
      ? { _id: customer.id, fullName: customer.full_name || '', email: customer.email || '' }
      : order.customer_user_id,
    storeId: order.store_id,
    items: mappedItems,
    totalAmount: (order.total_cents || 0) / 100,
    currency: order.currency || 'EGP',
    shippingAddress: order.shipping_address || {},
    status: dbStatusToLegacy(order.status),
    paymentStatus: meta.payment_status || 'pending',
    createdAt: order.created_at
  }
}

export const ordersRepository = {
  async fetchItemsForOrders(orderIds: string[]) {
    if (!orderIds.length) return new Map<string, any[]>()
    const { data, error } = await supabaseAdmin.from('order_items').select('*').in('order_id', orderIds)
    if (error) throw error
    const map = new Map<string, any[]>()
    for (const it of data || []) {
      const arr = map.get(it.order_id) || []
      arr.push(it)
      map.set(it.order_id, arr)
    }
    return map
  },

  async listForCustomer(customerUserId: string) {
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('customer_user_id', customerUserId)
      .order('created_at', { ascending: false })
    if (error) throw error
    const ids = (orders || []).map((o: any) => o.id)
    const itemsMap = await this.fetchItemsForOrders(ids)
    return (orders || []).map((o: any) => mapOrderRow(o, itemsMap.get(o.id) || []))
  },

  async listForStoreOwner(ownerUserId: string) {
    const { data: store, error: sErr } = await supabaseAdmin.from('stores').select('id').eq('owner_user_id', ownerUserId).maybeSingle()
    if (sErr) throw sErr
    if (!store) return []
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
    if (error) throw error
    const ids = (orders || []).map((o: any) => o.id)
    const itemsMap = await this.fetchItemsForOrders(ids)
    const out = []
    for (const o of orders || []) {
      const { data: prof } = await supabaseAdmin.from('profiles').select('id, full_name').eq('id', o.customer_user_id).maybeSingle()
      out.push(
        mapOrderRow(o, itemsMap.get(o.id) || [], {
          id: o.customer_user_id,
          full_name: prof?.full_name || '',
          email: ''
        })
      )
    }
    return out
  },

  async updateStatusForStore(orderId: string, storeId: string, legacyStatus: string) {
    const dbStatus = legacyStatusToDb(legacyStatus)
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status: dbStatus as any, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('store_id', storeId)
      .select('*')
      .maybeSingle()
    if (error) throw error
    return data
  },

  async getMappedOrderForStore(orderId: string, storeId: string) {
    const { data: order, error } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).eq('store_id', storeId).maybeSingle()
    if (error) throw error
    if (!order) return null
    const im = await this.fetchItemsForOrders([orderId])
    const { data: prof } = await supabaseAdmin.from('profiles').select('id, full_name').eq('id', order.customer_user_id).maybeSingle()
    return mapOrderRow(order, im.get(orderId) || [], { id: order.customer_user_id, full_name: prof?.full_name || '', email: '' })
  },

  async createCashOrders(
    customerUserId: string,
    shippingAddress: Record<string, unknown>,
    grouped: Record<string, { storeId: string; items: any[]; totalAmount: number }>
  ) {
    const created: any[] = []
    for (const sid of Object.keys(grouped)) {
      const group = grouped[sid]
      const totalCents = Math.round(group.totalAmount * 100)
      const { data: order, error } = await supabaseAdmin
        .from('orders')
        .insert({
          customer_user_id: customerUserId,
          store_id: group.storeId,
          status: 'placed',
          currency: 'EGP',
          subtotal_cents: totalCents,
          total_cents: totalCents,
          shipping_address: shippingAddress,
          metadata: { payment_status: 'pending' }
        })
        .select('*')
        .single()
      if (error) throw error

      const lineRows: any[] = []
      for (const it of group.items) {
        const unitCents = Math.round(Number(it.price) * 100)
        const line = {
          order_id: order.id,
          sku: it.productId || null,
          name: it.name,
          quantity: it.quantity,
          unit_price_cents: unitCents,
          metadata: {
            product_id: it.productId,
            image_url: it.imageUrl || it.image || ''
          }
        }
        await supabaseAdmin.from('order_items').insert(line)
        lineRows.push(line)
        if (it.productId) {
          await storeProductsRepository.decrementStock(group.storeId, String(it.productId), Number(it.quantity) || 1)
        }
      }
      created.push(mapOrderRow(order, lineRows))
    }
    return created
  },

  async createStripeDraftOrders(
    customerUserId: string,
    shippingAddress: Record<string, unknown>,
    grouped: Record<string, { storeId: string; items: any[]; totalAmount: number }>,
    stripeSessionId: string
  ) {
    const created: any[] = []
    for (const sid of Object.keys(grouped)) {
      const group = grouped[sid]
      const totalCents = Math.round(group.totalAmount * 100)
      const { data: order, error } = await supabaseAdmin
        .from('orders')
        .insert({
          customer_user_id: customerUserId,
          store_id: group.storeId,
          status: 'placed',
          currency: 'EGP',
          subtotal_cents: totalCents,
          total_cents: totalCents,
          shipping_address: shippingAddress,
          metadata: { payment_status: 'pending', stripe_session_id: stripeSessionId }
        })
        .select('*')
        .single()
      if (error) throw error
      for (const it of group.items) {
        const unitCents = Math.round(Number(it.price) * 100)
        await supabaseAdmin.from('order_items').insert({
          order_id: order.id,
          sku: it.productId || null,
          name: it.name,
          quantity: it.quantity,
          unit_price_cents: unitCents,
          metadata: {
            product_id: it.productId,
            image_url: it.imageUrl || it.image || ''
          }
        })
        if (it.productId) {
          await storeProductsRepository.decrementStock(group.storeId, String(it.productId), Number(it.quantity) || 1)
        }
      }
      created.push(order)
    }
    return created
  }
}
