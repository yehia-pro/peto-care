import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { requireAuth } from '../middleware/auth'
import { vetsController } from '../controllers/vetsController'
import { vetsRepository } from '../repositories/vetsRepository'

const router = Router()

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
  return vetsController.register(req, res)
})

router.get('/', async (req, res) => {
  return vetsController.getAll(req, res)
})

router.get('/nearest', async (req, res) => {
  const { province } = req.query as any
  const vets = await vetsRepository.getAll({ city: province as string | undefined, isVerified: true })
  return res.json({ vets })
})

router.get('/:id', async (req, res) => {
  return vetsController.getById(req, res)
})

router.post('/:id/verify', requireAuth(['admin']), async (req, res) => {
  return vetsController.verify(req, res)
})

// Approval via link
router.get('/:id/approve', requireAuth(['admin']), async (req, res) => {
  return vetsController.approve(req, res)
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
  return vetsController.adminAdd(req, res)
})

router.put('/:id', requireAuth(['admin']), async (req, res) => {
  return vetsController.update(req, res)
})

export default router
