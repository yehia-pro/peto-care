import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { requireAuth } from '../middleware/auth'
import { petsController } from '../controllers/petsController'

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
  return petsController.create(req, res, next)
})

router.get('/', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res, next) => {
  return petsController.list(req, res, next)
})

router.get('/my-pets', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res, next) => {
  return petsController.listMyPetsDashboard(req, res, next)
})

router.get('/:id', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res, next) => {
  return petsController.getById(req, res, next)
})

router.put('/:id', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res, next) => {
  return petsController.update(req, res, next)
})

router.delete('/:id', requireAuth(['user', 'vet', 'petstore', 'admin']), async (req, res, next) => {
  return petsController.remove(req, res, next)
})

export default router
