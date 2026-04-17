import { supabaseAdmin } from '../lib/supabase'

const mapPetRecord = (row: any) => {
  const mh = row.medical_history || {}
  return {
    _id: row.id,
    userId: row.owner_user_id,
    petName: row.name,
    petType: row.species || '',
    breed: row.breed || '',
    petImage: mh.petImage || '',
    summary: mh.summary || '',
    history: mh.history || '',
    medications: mh.medications || '',
    createdAt: row.created_at,
    age: typeof mh.age === 'number' ? mh.age : 0,
    weight: typeof mh.weight === 'number' ? mh.weight : 0,
    gender: mh.gender || 'unknown',
    color: mh.color || '',
    microchipId: mh.microchipId || '',
    description: mh.description || '',
    medicalHistory: mh.medicalHistory || mh.summary || '',
    vaccinationRecords: mh.vaccinationRecords || '',
    allergies: mh.allergies || '',
    currentMedications: mh.currentMedications || mh.medications || '',
    emergencyContact: mh.emergencyContact || ''
  }
}

const buildMedicalHistory = (payload: any, existing: Record<string, any> = {}) => {
  const mh = { ...existing }
  if (payload.summary !== undefined) mh.summary = payload.summary
  if (payload.history !== undefined) mh.history = payload.history
  if (payload.medications !== undefined) mh.medications = payload.medications
  if (payload.petImage !== undefined) mh.petImage = payload.petImage
  if (payload.age !== undefined) mh.age = payload.age
  if (payload.weight !== undefined) mh.weight = payload.weight
  if (payload.gender !== undefined) mh.gender = payload.gender
  if (payload.color !== undefined) mh.color = payload.color
  if (payload.microchipId !== undefined) mh.microchipId = payload.microchipId
  if (payload.description !== undefined) mh.description = payload.description
  if (payload.medicalHistory !== undefined) mh.medicalHistory = payload.medicalHistory
  if (payload.vaccinationRecords !== undefined) mh.vaccinationRecords = payload.vaccinationRecords
  if (payload.allergies !== undefined) mh.allergies = payload.allergies
  if (payload.currentMedications !== undefined) mh.currentMedications = payload.currentMedications
  if (payload.emergencyContact !== undefined) mh.emergencyContact = payload.emergencyContact
  return mh
}

export const petsRepository = {
  async create(ownerUserId: string, payload: any) {
    const medical_history = buildMedicalHistory(payload, {
      summary: payload.summary,
      history: payload.history,
      medications: payload.medications,
      petImage: payload.petImage || null
    })
    const { data, error } = await supabaseAdmin
      .from('pets')
      .insert({
        owner_user_id: ownerUserId,
        name: payload.petName,
        species: payload.petType,
        breed: payload.breed || null,
        medical_history
      })
      .select('*')
      .single()
    if (error) throw error
    return mapPetRecord(data)
  },

  async list(role: string, userId: string) {
    let query = supabaseAdmin.from('pets').select('*').order('created_at', { ascending: false })
    if (role !== 'admin' && role !== 'vet') query = query.eq('owner_user_id', userId)
    const { data, error } = await query
    if (error) throw error
    return (data || []).map(mapPetRecord)
  },

  async getById(id: string) {
    const { data, error } = await supabaseAdmin.from('pets').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    if (!data) return null
    return mapPetRecord(data)
  },

  async update(id: string, payload: any) {
    const { data: current, error: currentError } = await supabaseAdmin
      .from('pets')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (currentError) throw currentError
    if (!current) return null

    const nextMedicalHistory = buildMedicalHistory(payload, current.medical_history || {})

    const { data, error } = await supabaseAdmin
      .from('pets')
      .update({
        name: payload.petName ?? current.name,
        species: payload.petType ?? current.species,
        breed: payload.breed ?? current.breed,
        medical_history: nextMedicalHistory,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single()
    if (error) throw error
    return mapPetRecord(data)
  },

  async delete(id: string) {
    const { error } = await supabaseAdmin.from('pets').delete().eq('id', id)
    if (error) throw error
  },

  async getFirstByOwner(ownerUserId: string) {
    const { data, error } = await supabaseAdmin
      .from('pets')
      .select('*')
      .eq('owner_user_id', ownerUserId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return data
  }
}
