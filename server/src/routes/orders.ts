import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { requireAuth } from '../middleware/auth'
import { ordersController } from '../controllers/ordersController'

const router = Router()

const createOrderSchema = z.object({
  body: z.object({
    shippingAddress: z.object({
      fullName: z.string(),
      phone: z.string(),
      city: z.string(),
      address: z.string(),
      notes: z.string().optional()
    }),
    paymentMethod: z.enum(['card', 'cash']),
    items: z.array(z.any()).optional(),
    couponCode: z.string().optional()
  })
})

router.post('/', requireAuth(['user', 'vet']), validate(createOrderSchema), (req, res) =>
  ordersController.createCash(req, res)
)

router.post('/checkout-session', requireAuth(['user', 'vet']), validate(createOrderSchema), (req, res) =>
  ordersController.checkoutSession(req, res)
)

router.get('/my-orders', requireAuth(['user', 'vet']), (req, res) => ordersController.myOrders(req, res))

router.get('/store-orders', requireAuth(['petstore']), (req, res) => ordersController.storeOrders(req, res))

router.patch('/:id/status', requireAuth(['petstore']), (req, res) => ordersController.patchStatus(req, res))

export default router
