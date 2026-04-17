import { supabaseAdmin } from '../lib/supabase'

type VetFilters = {
  specialization?: string
  country?: string
  city?: string
  name?: string
  isVerified?: boolean
}

const mapVet = (row: any) => {
  const profile = row.profiles || {}
  const location = row.location || {}
  return {
    id: row.id,
    userId: row.user_id,
    fullName: profile.full_name || '',
    email: profile.email || null,
    phone: profile.phone || null,
    avatarUrl: profile.avatar_url || null,
    isVerified: Boolean(row.verified),
    verified: Boolean(row.verified),
    specialization: row.specialties?.[0] || 'General',
    country: profile.country || location.country || 'Egypt',
    clinicName: row.clinic_name || profile.full_name || 'Vet Clinic',
    yearsOfExperience: row.years_experience || 0,
    consultationFee: location.consultationFee || null,
    discountedFee: location.discountedFee || null,
    discountExpiresAt: location.discountExpiresAt || null,
    clinicAddress: location.clinicAddress || null,
    governorate: location.governorate || null,
    phoneNumbers: location.phoneNumbers || [],
    rating: location.rating || 0
  }
}

const buildVetUpsertPayload = (userId: string, payload: any, verified: boolean) => {
  const specialties = payload.specialization ? [payload.specialization] : ['General']
  const location = {
    country: payload.country || 'Egypt',
    governorate: payload.city || payload.country || null,
    clinicAddress: payload.clinicAddress || null,
    consultationFee: payload.consultationFee || null
  }
  return {
    user_id: userId,
    clinic_name: payload.clinicName,
    license_number: payload.licenseNumber,
    specialties,
    years_experience: payload.yearsOfExperience || 0,
    bio: payload.education || null,
    location,
    verified
  }
}

export const vetsRepository = {
  /** Inserts/updates vets row only (no profile changes). */
  async upsertVetRow(userId: string, payload: any, verified: boolean) {
    const { data, error } = await supabaseAdmin
      .from('vets')
      .upsert(buildVetUpsertPayload(userId, payload, verified), { onConflict: 'user_id' })
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async createForUser(userId: string, payload: any) {
    const { data: existingVet } = await supabaseAdmin.from('vets').select('id, verified').eq('user_id', userId).maybeSingle()
    const keepVerified = existingVet?.verified === true
    const data = await this.upsertVetRow(userId, payload, keepVerified)

    const { data: existingProf } = await supabaseAdmin.from('profiles').select('metadata').eq('id', userId).maybeSingle()
    const prevMeta = (existingProf?.metadata || {}) as Record<string, unknown>
    const alreadyApproved = prevMeta.approval_status === 'approved'
    const nextMeta = alreadyApproved ? { ...prevMeta } : { ...prevMeta, approval_status: 'pending' }

    const { error: pErr } = await supabaseAdmin
      .from('profiles')
      .update({
        role: 'vet',
        metadata: nextMeta,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
    if (pErr) throw pErr

    return data
  },

  async getAll(filters: VetFilters) {
    let query = supabaseAdmin
      .from('vets')
      .select('*, profiles!vets_user_id_fkey(full_name, phone, country, avatar_url)')

    if (typeof filters.isVerified === 'boolean') {
      query = query.eq('verified', filters.isVerified)
    }

    const { data, error } = await query
    if (error) throw error

    let vets = (data || []).map(mapVet)

    if (filters.specialization && filters.specialization !== 'الكل') {
      vets = vets.filter(v => v.specialization === filters.specialization)
    }
    if (filters.country && filters.country !== 'الكل') {
      vets = vets.filter(v => (v.country || '').toLowerCase().includes(String(filters.country).toLowerCase()))
    }
    if (filters.city && filters.city !== 'الكل') {
      vets = vets.filter(v => (v.governorate || '').toLowerCase().includes(String(filters.city).toLowerCase()))
    }
    if (filters.name) {
      const n = String(filters.name).toLowerCase()
      vets = vets.filter(v => (v.fullName || '').toLowerCase().includes(n) || (v.clinicName || '').toLowerCase().includes(n))
    }
    return vets
  },

  async getById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('vets')
      .select('*, profiles!vets_user_id_fkey(full_name, phone, country, avatar_url)')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return mapVet(data)
  },

  async setVerified(id: string, verified: boolean) {
    const { data, error } = await supabaseAdmin
      .from('vets')
      .update({ verified, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, body: any) {
    const patch: any = { updated_at: new Date().toISOString() }
    if (body.clinicName !== undefined) patch.clinic_name = body.clinicName
    if (body.licenseNumber !== undefined) patch.license_number = body.licenseNumber
    if (body.specialization !== undefined) patch.specialties = [body.specialization]
    if (body.yearsOfExperience !== undefined) patch.years_experience = body.yearsOfExperience
    if (body.education !== undefined) patch.bio = body.education
    if (body.verified !== undefined) patch.verified = Boolean(body.verified)

    const { data, error } = await supabaseAdmin
      .from('vets')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return data
  }
}
