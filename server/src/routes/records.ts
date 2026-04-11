import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { requireAuth } from '../middleware/auth'
import PetRecordModel from '../models/PetRecord'

const router = Router()

const createSchema = z.object({
  body: z.object({
    petName: z.string(),
    petType: z.string(),
    breed: z.string().optional().or(z.literal('')),
    petImage: z.string().optional().or(z.literal('')), // Allow empty string or undefined
    summary: z.string(),
    history: z.string(),
    medications: z.string()
  })
})

router.post('/', requireAuth(['user', 'vet', 'petstore', 'admin']), validate(createSchema), async (req, res, next) => {
  try {
    const doc = await PetRecordModel.create({ userId: (req as any).user.id, ...req.body })
    res.json({ record: doc })
  } catch (error) {
    next(error)
  }
})

router.get('/', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res, next) => {
  try {
    const role = (req as any).user.role
    const id = (req as any).user.id
    let where: any = {}
    if (role === 'user') where.userId = id
    if (role !== 'admin' && role !== 'vet') where.userId = id

    const records = await PetRecordModel.find(where).sort({ createdAt: -1 }).lean()
    res.json({ records })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res, next) => {
  try {
    const record = await PetRecordModel.findById(req.params.id).lean()
    if (!record) return res.status(404).json({ error: 'not_found', message: 'السجل غير موجود' })
    res.json({ record })
  } catch (error) {
    next(error)
  }
})

router.put('/:id', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res, next) => {
  try {
    const record = await PetRecordModel.findById(req.params.id)
    if (!record) return res.status(404).json({ error: 'not_found', message: 'السجل غير موجود' })
    const requester = (req as any).user
    if (requester.role !== 'admin' && requester.role !== 'vet' && String(record.userId) !== String(requester.id)) return res.status(403).json({ error: 'forbidden', message: 'غير مصرح لك' })
    Object.assign(record, req.body)
    await record.save()
    res.json({ record })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res, next) => {
  try {
    const record = await PetRecordModel.findById(req.params.id)
    if (!record) return res.status(404).json({ error: 'not_found', message: 'السجل غير موجود' })
    const requester = (req as any).user
    if (requester.role !== 'admin' && String(record.userId) !== String(requester.id)) return res.status(403).json({ error: 'forbidden', message: 'غير مصرح لك' })
    await record.deleteOne()
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export default router
