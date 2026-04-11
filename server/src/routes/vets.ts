import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { requireAuth } from '../middleware/auth'

const router = Router()
const memVets: any[] = []

const registerSchema = z.object({
  body: z.object({
    licenseNumber: z.string().min(3),
    clinicName: z.string().min(2),
    specialization: z.string().min(2),
    yearsOfExperience: z.number().int().min(0),
    education: z.string().min(2),
    country: z.string().min(2),
    phone: z.string().min(6)
  })
})

router.post('/register', requireAuth(['user', 'vet']), validate(registerSchema), async (req, res) => {
  const id = Math.random().toString(36).slice(2)
  memVets.push({ id, userId: (req as any).user.id, verified: false, ...req.body })
  return res.json({ vet: { id, verified: false } })
})

// Get all vets (using Mongoose directly for consistency)
router.get('/', async (req, res) => {
  try {
    const { default: User } = await import('../models/User')

    const { specialization, country, name, city } = req.query as any
    const query: any = { role: 'vet', isApproved: true }

    // We can't easily filter valid JSON fields in Mongo query without strict schema, 
    // so we'll fetch all vets and filter in memory, or use regex if needed.
    // For now, fetching all approved vets is fine as the number won't be huge.

    if (name) {
      query.$or = [
        { fullName: { $regex: name, $options: 'i' } },
        { contact: { $regex: name, $options: 'i' } } // rudimentary search in contact string
      ]
    }

    const vets = await User.find(query).lean()

    let formattedVets = vets.map((v: any) => {
      let contact: any = {}
      try { contact = JSON.parse(v.contact || '{}') } catch (e) { }

      return {
        id: v._id.toString(),
        fullName: v.fullName,
        email: v.email,
        phone: v.phone,
        avatarUrl: v.avatarUrl,
        isVerified: v.isApproved,
        specialization: contact.specialization || 'General',
        yearsOfExperience: contact.experienceYears || 0,
        country: contact.country || 'Egypt',
        clinicName: contact.clinicName || v.fullName + "'s Clinic", // fallback
        qualification: contact.qualification,
        consultationFee: contact.consultationFee,
        discountedFee: contact.discountedFee,
        discountExpiresAt: contact.discountExpiresAt,
        clinicAddress: contact.clinicAddress,
        workHours: contact.workHours || '9:00 AM - 5:00 PM', // Default or from contact
        governorate: contact.governorate,
        rating: 0, // Placeholder
        phoneNumbers: contact.phoneNumbers || [],
      }
    })

    // Filter in memory for contact fields
    if (specialization && specialization !== 'الكل') {
      formattedVets = formattedVets.filter((v: any) => v.specialization === specialization)
    }
    if (country && country !== 'الكل') {
      formattedVets = formattedVets.filter((v: any) => v.country === country)
    }
    if (city && city !== 'الكل') {
      formattedVets = formattedVets.filter((v: any) => v.governorate === city || v.country === city)
    }

    return res.json({ vets: formattedVets })
  } catch (error) {
    console.error('Error fetching vets:', error)
    return res.status(500).json({ error: 'server_error' })
  }
})

router.get('/nearest', async (req, res) => {
  const { province, lat, lng } = req.query as any
  const hasCoords = lat && lng

  let vets = memVets
  if (province) {
    const p = String(province).toLowerCase()
    vets = vets.filter(v => (v.province || '').toLowerCase() === p || ((v.country || '').toLowerCase() === 'egypt' && (v.province || '').toLowerCase() === p))
  } else if (hasCoords) {
    const la = Number(lat), ln = Number(lng)
    vets = vets
      .filter(v => typeof v.locationLat === 'number' && typeof v.locationLng === 'number')
      .map(v => ({ v, d: Math.hypot((Number(v.locationLat) - la), (Number(v.locationLng) - ln)) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 20)
      .map(x => x.v)
  }
  return res.json({ vets })
})

router.get('/:id', async (req, res) => {
  const vet = memVets.find(v => v.id === req.params.id)
  if (!vet) return res.status(404).json({ error: 'not_found' })
  return res.json({ vet })
})

router.post('/:id/verify', requireAuth(['admin']), async (req, res) => {
  const idx = memVets.findIndex(v => v.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'not_found' })
  memVets[idx].verified = true
  return res.json({ success: true })
})

// Approval via link
router.get('/:id/approve', requireAuth(['admin']), async (req, res) => {
  const idx = memVets.findIndex(v => v.id === req.params.id)
  if (idx === -1) return res.status(404).send('not_found')
  memVets[idx].verified = true
  return res.redirect('/doctor-dashboard')
})

const adminCreateSchema = z.object({
  body: z.object({
    fullName: z.string().min(2),
    specialization: z.string().min(2),
    education: z.string().min(2),
    yearsOfExperience: z.number().int().min(0),
    country: z.string().min(2),
    clinicName: z.string().min(2),
    phone: z.string().min(6)
  })
})

router.post('/admin/add', requireAuth(['admin']), validate(adminCreateSchema), async (req, res) => {
  const id = Math.random().toString(36).slice(2)
  memVets.push({ id, verified: false, ...req.body })
  return res.status(201).json({ vet: memVets[memVets.length - 1] })
})

router.put('/:id', requireAuth(['admin']), async (req, res) => {
  const idx = memVets.findIndex(v => v.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'not_found' })
  memVets[idx] = { ...memVets[idx], ...req.body }
  return res.json({ vet: memVets[idx] })
})

export default router
