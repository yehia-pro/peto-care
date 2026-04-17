import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { requireAuth } from '../middleware/auth'
import { appointmentsController } from '../controllers/appointmentsController'

const router = Router()

const createSchema = z.object({
  body: z.object({
    vetId: z.string(),
    scheduledAt: z.string(),
    reason: z.string().min(2),
    notes: z.string().optional(),
    price: z.number().nonnegative().optional(),
    currency: z.string().optional()
  })
})

router.post('/', requireAuth(['user', 'admin']), validate(createSchema), async (req, res) => {
  return appointmentsController.create(req, res)
})

router.get('/', requireAuth(['user', 'vet', 'admin']), async (req, res) => {
  return appointmentsController.list(req, res)
})

router.get('/my-appointments', requireAuth(['user', 'vet', 'admin']), async (req, res) => {
  return appointmentsController.listMyAppointmentsDashboard(req, res)
})

// Static path segments must be registered before /:id
router.get('/available-slots/:vetId', async (req, res) => {
  return appointmentsController.availableSlots(req, res)
})

router.get('/:id', requireAuth(['user', 'vet', 'admin']), async (req, res) => {
  return appointmentsController.getById(req, res)
})

router.delete('/:id', requireAuth(['user', 'admin']), async (req, res) => {
  return appointmentsController.remove(req, res)
})

const updateSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ 
    status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
    scheduledAt: z.string().optional(),
    entryNumber: z.number().optional(),
    doctorNotes: z.string().optional()
  })
})

router.patch('/:id/status', requireAuth(['vet', 'admin']), validate(updateSchema), async (req, res) => {
  return appointmentsController.updateStatus(req, res)
})

// Reschedule appointment
router.patch('/:id/reschedule', requireAuth(['user', 'admin']), async (req, res) => {
  return appointmentsController.reschedule(req, res)
})

export default router
