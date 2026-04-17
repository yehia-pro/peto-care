import { supabaseAdmin } from '../lib/supabase'

export const storesRepository = {
  async getByOwnerUserId(ownerUserId: string) {
    const { data, error } = await supabaseAdmin.from('stores').select('*').eq('owner_user_id', ownerUserId).maybeSingle()
    if (error) throw error
    return data
  },

  async getById(storeId: string) {
    const { data, error } = await supabaseAdmin.from('stores').select('*').eq('id', storeId).maybeSingle()
    if (error) throw error
    return data
  },

  async createDefault(ownerUserId: string) {
    const { data: profile } = await supabaseAdmin.from('profiles').select('full_name, phone').eq('id', ownerUserId).maybeSingle()
    const name = profile?.full_name ? `متجر ${profile.full_name}` : 'متجري'
    const { data, error } = await supabaseAdmin
      .from('stores')
      .insert({
        owner_user_id: ownerUserId,
        name,
        description: '',
        phone: profile?.phone || '',
        location: {},
        metadata: {
          storeType: 'comprehensive',
          services: [] as string[],
          brands: [] as string[],
          isActive: true,
          verified: false,
          rating: 0,
          reviewCount: 0
        }
      })
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async getOrCreateForOwner(ownerUserId: string) {
    const existing = await this.getByOwnerUserId(ownerUserId)
    if (existing) return existing
    return this.createDefault(ownerUserId)
  },

  async updateForOwner(ownerUserId: string, body: Record<string, unknown>) {
    const store = await this.getByOwnerUserId(ownerUserId)
    if (!store) return null
    const meta = { ...(store.metadata as object) }

    const assignMeta = (key: string, val: unknown) => {
      if (val !== undefined) (meta as any)[key] = val
    }
    assignMeta('storeType', body.storeType)
    assignMeta('website', body.website)
    assignMeta('whatsapp', body.whatsapp)
    assignMeta('openingTime', body.openingTime)
    assignMeta('closingTime', body.closingTime)
    assignMeta('services', body.services)
    assignMeta('brands', body.brands)
    assignMeta('address', body.address)
    assignMeta('city', body.city)
    assignMeta('country', body.country)
    assignMeta('commercialRegImageUrl', body.commercialRegImageUrl)

    const patch: Record<string, unknown> = {
      metadata: meta,
      updated_at: new Date().toISOString()
    }
    if (body.storeName !== undefined) patch.name = body.storeName
    if (body.description !== undefined) patch.description = body.description
    if (body.phone !== undefined) patch.phone = body.phone

    const loc = { ...((store.location as object) || {}) }
    if (body.address !== undefined) (loc as any).address = body.address
    if (body.city !== undefined) (loc as any).city = body.city
    if (body.country !== undefined) (loc as any).country = body.country
    if (Object.keys(loc).length) patch.location = loc

    const { data, error } = await supabaseAdmin.from('stores').update(patch).eq('id', store.id).select('*').single()
    if (error) throw error
    return data
  },

  async listPublic(params: { q?: string; city?: string; page: number; limit: number }) {
    const { q, city, page, limit } = params
    const from = (page - 1) * limit
    let query = supabaseAdmin.from('stores').select('*', { count: 'exact' }).eq('is_active', true)
    if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, from + limit - 1)
    if (error) throw error
    let rows = data || []
    if (city) {
      const c = city.toLowerCase()
      rows = rows.filter((r: any) => String(r.metadata?.city || '').toLowerCase().includes(c))
    }
    return { rows, total: count ?? rows.length }
  }
}

export const mapStoreRowToPetStore = (store: any) => {
  const m = store.metadata || {}
  const loc = store.location || {}
  return {
    _id: store.id,
    id: store.id,
    storeName: store.name,
    storeType: m.storeType || 'comprehensive',
    description: store.description || '',
    phone: store.phone || '',
    website: m.website || '',
    whatsapp: m.whatsapp || '',
    openingTime: m.openingTime || '',
    closingTime: m.closingTime || '',
    services: Array.isArray(m.services) ? m.services : [],
    brands: Array.isArray(m.brands) ? m.brands : [],
    address: m.address || loc.address || '',
    city: m.city || loc.city || '',
    country: m.country || loc.country || '',
    commercialRegImageUrl: m.commercialRegImageUrl || '',
    verified: Boolean(m.verified),
    isActive: m.isActive !== false,
    rating: Number(m.rating || 0),
    reviewCount: Number(m.reviewCount || 0),
    createdAt: store.created_at
  }
}
