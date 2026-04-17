import { supabaseAdmin } from '../lib/supabase'

const nestedName = (embed: any): string => {
  if (!embed) return ''
  if (Array.isArray(embed)) return embed[0]?.full_name || ''
  return embed.full_name || ''
}

const mapAppointment = (row: any) => {
  const scheduled = new Date(row.scheduled_at)
  const vetEmbed = row.vets?.profiles
  const custEmbed = row.profiles
  return {
    _id: row.id,
    userId: row.customer_user_id,
    vetId: row.vet_id,
    petId: row.pet_id,
    date: scheduled.toISOString(),
    time: scheduled.toISOString(),
    scheduledAt: scheduled.toISOString(),
    status: row.status,
    reason: row.reason || '',
    notes: row.notes || '',
    vetName: nestedName(vetEmbed),
    userName: nestedName(custEmbed)
  }
}

export const appointmentsRepository = {
  async create(data: {
    customerUserId: string
    vetId: string
    petId: string
    scheduledAt: string
    reason: string
    notes?: string
  }) {
    const { data: inserted, error } = await supabaseAdmin
      .from('appointments')
      .insert({
        customer_user_id: data.customerUserId,
        vet_id: data.vetId,
        pet_id: data.petId,
        scheduled_at: data.scheduledAt,
        reason: data.reason,
        notes: data.notes || null
      })
      .select(`
        *,
        vets:vets!appointments_vet_id_fkey(
          id,
          profiles:profiles!vets_user_id_fkey(full_name)
        ),
        profiles:profiles!appointments_customer_user_id_fkey(full_name)
      `)
      .single()

    if (error) throw error
    return mapAppointment(inserted)
  },

  async list(role: string, userId: string) {
    let query = supabaseAdmin
      .from('appointments')
      .select(`
        *,
        vets:vets!appointments_vet_id_fkey(
          id,
          user_id,
          profiles:profiles!vets_user_id_fkey(full_name)
        ),
        profiles:profiles!appointments_customer_user_id_fkey(full_name)
      `)
      .order('scheduled_at', { ascending: false })

    if (role === 'user') {
      query = query.eq('customer_user_id', userId)
    } else if (role === 'vet') {
      const { data: vet } = await supabaseAdmin.from('vets').select('id').eq('user_id', userId).maybeSingle()
      if (!vet) return []
      query = query.eq('vet_id', vet.id)
    }

    const { data, error } = await query
    if (error) throw error
    return (data || []).map(mapAppointment)
  },

  async getById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        vets:vets!appointments_vet_id_fkey(
          id,
          user_id,
          profiles:profiles!vets_user_id_fkey(full_name)
        ),
        profiles:profiles!appointments_customer_user_id_fkey(full_name)
      `)
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    return mapAppointment(data)
  },

  async delete(id: string) {
    const { error } = await supabaseAdmin.from('appointments').delete().eq('id', id)
    if (error) throw error
  },

  async updateStatus(id: string, patch: any) {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update({
        status: patch.status,
        scheduled_at: patch.scheduledAt || undefined,
        notes: patch.doctorNotes || undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        vets:vets!appointments_vet_id_fkey(
          id,
          user_id,
          profiles:profiles!vets_user_id_fkey(full_name)
        ),
        profiles:profiles!appointments_customer_user_id_fkey(full_name)
      `)
      .single()
    if (error) throw error
    return mapAppointment(data)
  },

  async reschedule(id: string, scheduledAt: string) {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update({
        scheduled_at: scheduledAt,
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        vets:vets!appointments_vet_id_fkey(
          id,
          user_id,
          profiles:profiles!vets_user_id_fkey(full_name)
        ),
        profiles:profiles!appointments_customer_user_id_fkey(full_name)
      `)
      .single()
    if (error) throw error
    return mapAppointment(data)
  },

  async getBookedSlots(vetId: string, startISO: string, endISO: string) {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('scheduled_at')
      .eq('vet_id', vetId)
      .in('status', ['pending', 'confirmed'])
      .gte('scheduled_at', startISO)
      .lte('scheduled_at', endISO)
    if (error) throw error
    return (data || []).map((r: any) => r.scheduled_at)
  }
}
