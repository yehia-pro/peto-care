import { supabaseAdmin } from '../lib/supabase'

export const mapProductRow = (row: any) => {
  const price = (row.price_cents || 0) / 100
  const salePrice = row.sale_price_cents != null ? row.sale_price_cents / 100 : undefined
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    description: row.description || '',
    category: row.category || 'food',
    imageUrl: row.image_url || '',
    price,
    stock: row.stock ?? 0,
    inStock: row.in_stock !== false,
    salePrice: salePrice && salePrice > 0 ? salePrice : undefined,
    saleExpiresAt: row.sale_expires_at || undefined
  }
}

export const storeProductsRepository = {
  async listByStoreId(storeId: string) {
    const { data, error } = await supabaseAdmin
      .from('store_products')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(mapProductRow)
  },

  async getById(productId: string) {
    const { data, error } = await supabaseAdmin.from('store_products').select('*').eq('id', productId).maybeSingle()
    if (error) throw error
    if (!data) return null
    return data
  },

  async create(storeId: string, payload: any) {
    const priceCents = Math.round(Number(payload.price) * 100)
    const saleCents =
      payload.salePrice !== undefined && payload.salePrice !== null && Number(payload.salePrice) > 0
        ? Math.round(Number(payload.salePrice) * 100)
        : null
    const stock = Number(payload.stock) || 0
    const { data, error } = await supabaseAdmin
      .from('store_products')
      .insert({
        store_id: storeId,
        name: payload.name,
        description: payload.description || '',
        category: payload.category || 'food',
        image_url: payload.imageUrl || null,
        price_cents: priceCents,
        sale_price_cents: saleCents,
        sale_expires_at: payload.saleExpiresAt || null,
        stock,
        in_stock: stock > 0
      })
      .select('*')
      .single()
    if (error) throw error
    return mapProductRow(data)
  },

  async update(storeId: string, productId: string, payload: any) {
    const priceCents = Math.round(Number(payload.price) * 100)
    const stock = Number(payload.stock) || 0
    const patch: Record<string, unknown> = {
      name: payload.name,
      description: payload.description || '',
      category: payload.category || 'food',
      image_url: payload.imageUrl || null,
      price_cents: priceCents,
      stock,
      in_stock: stock > 0,
      updated_at: new Date().toISOString()
    }
    if (payload.salePrice !== undefined && payload.salePrice !== null && Number(payload.salePrice) > 0) {
      patch.sale_price_cents = Math.round(Number(payload.salePrice) * 100)
      patch.sale_expires_at = payload.saleExpiresAt || null
    } else {
      patch.sale_price_cents = null
      patch.sale_expires_at = null
    }
    const { data, error } = await supabaseAdmin
      .from('store_products')
      .update(patch)
      .eq('id', productId)
      .eq('store_id', storeId)
      .select('*')
      .single()
    if (error) throw error
    return mapProductRow(data)
  },

  async delete(storeId: string, productId: string) {
    const { error } = await supabaseAdmin.from('store_products').delete().eq('id', productId).eq('store_id', storeId)
    if (error) throw error
  },

  async deleteAllForStore(storeId: string) {
    const { error } = await supabaseAdmin.from('store_products').delete().eq('store_id', storeId)
    if (error) throw error
  },

  async setInStock(storeId: string, productId: string, inStock: boolean) {
    const { data, error } = await supabaseAdmin
      .from('store_products')
      .update({ in_stock: inStock, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .eq('store_id', storeId)
      .select('*')
      .single()
    if (error) throw error
    return mapProductRow(data)
  },

  async setStockCount(storeId: string, productId: string, stock: number) {
    const { data, error } = await supabaseAdmin
      .from('store_products')
      .update({
        stock,
        in_stock: stock > 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .eq('store_id', storeId)
      .select('*')
      .single()
    if (error) throw error
    return mapProductRow(data)
  },

  async decrementStock(storeId: string, productId: string, qty: number) {
    const row = await this.getById(productId)
    if (!row || row.store_id !== storeId) return false
    const next = Math.max(0, (row.stock || 0) - qty)
    const { error } = await supabaseAdmin
      .from('store_products')
      .update({
        stock: next,
        in_stock: next > 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .eq('store_id', storeId)
    if (error) throw error
    return true
  }
}
