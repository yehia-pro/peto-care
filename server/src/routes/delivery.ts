import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { requireAuth } from '../middleware/auth'

const router = Router()

const createOrderSchema = z.object({
  body: z.object({
    pickupAddress: z.string().min(3),
    dropoffAddress: z.string().min(3),
    pickupLat: z.number().optional(),
    pickupLng: z.number().optional(),
    dropoffLat: z.number().optional(),
    dropoffLng: z.number().optional(),
    distanceMeters: z.number().int().optional(),
    paymentMethod: z.enum(['card', 'cod', 'wallet']).default('card'),
    items: z.array(z.object({ id: z.string(), name: z.string(), price: z.number(), quantity: z.number().int().min(1) })).optional(),
    totalAmount: z.number().nonnegative().optional()
  })
})

router.post('/orders', requireAuth(['user']), validate(createOrderSchema), async (req, res) => {
  res.status(501).json({ error: 'not_implemented' })
})

router.get('/orders', requireAuth(['user', 'admin']), async (req, res) => {
  res.json({ orders: [] })
})

router.get('/orders/:id', requireAuth(['user', 'admin']), async (req, res) => {
  res.status(404).json({ error: 'not_found' })
})

const updateStatusSchema = z.object({ params: z.object({ id: z.string().uuid() }), body: z.object({ status: z.enum(['assigned', 'en_route', 'delivered', 'cancelled']) }) })

router.patch('/orders/:id/status', requireAuth(['admin']), validate(updateStatusSchema), async (req, res) => {
  res.status(501).json({ error: 'not_implemented' })
})

const assignSchema = z.object({ params: z.object({ id: z.string().uuid() }), body: z.object({ driverId: z.string().uuid() }) })

router.post('/orders/:id/assign', requireAuth(['admin']), validate(assignSchema), async (req, res) => {
  res.status(501).json({ error: 'not_implemented' })
})

const driverCreateSchema = z.object({ body: z.object({ name: z.string(), phone: z.string().optional(), vehiclePlate: z.string().optional() }) })

router.post('/drivers', requireAuth(['admin']), validate(driverCreateSchema), async (req, res) => {
  res.status(501).json({ error: 'not_implemented' })
})

router.get('/drivers', requireAuth(['admin']), async (_req, res) => {
  res.json({ drivers: [] })
})

const driverLocSchema = z.object({ params: z.object({ id: z.string().uuid() }), body: z.object({ lat: z.number(), lng: z.number(), orderId: z.string().uuid().optional() }) })

router.patch('/drivers/:id/location', requireAuth(['admin']), validate(driverLocSchema), async (req, res) => {
  res.status(501).json({ error: 'not_implemented' })
})

const tariffSchema = z.object({ body: z.object({ city: z.string(), baseFee: z.number().int(), perKmFee: z.number().int(), currency: z.string().default('EGP') }) })

router.post('/tariffs', requireAuth(['admin']), validate(tariffSchema), async (req, res) => {
  res.status(501).json({ error: 'not_implemented' })
})

router.get('/tariffs', requireAuth(['admin']), async (_req, res) => {
  res.json({ tariffs: [] })
})

const rateSchema = z.object({ params: z.object({ id: z.string().uuid() }), body: z.object({ rating: z.number().int().min(1).max(5), comment: z.string().optional() }) })
router.post('/orders/:id/rate', requireAuth(['user']), validate(rateSchema), async (req, res) => {
  res.status(501).json({ error: 'not_implemented' })
})

const zoneSchema = z.object({ body: z.object({ name: z.string(), cities: z.array(z.string()).optional(), active: z.boolean().optional() }) })
router.post('/zones', requireAuth(['admin']), validate(zoneSchema), async (req, res) => {
  res.status(501).json({ error: 'not_implemented' })
})
router.get('/zones', requireAuth(['admin']), async (_req, res) => {
  res.json({ zones: [] })
})

export default router
