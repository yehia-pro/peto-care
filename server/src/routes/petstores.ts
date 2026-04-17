import { Router } from 'express'
import { petstoresController } from '../controllers/petstoresController'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/', (req, res) => petstoresController.list(req, res))

router.get('/profile', requireAuth(['petstore']), (req, res) => petstoresController.profileGet(req, res))

router.put('/profile', requireAuth(['petstore']), (req, res) => petstoresController.profilePut(req, res))

router.get('/stats', requireAuth(['petstore']), (req, res) => petstoresController.stats(req, res))

router.get('/products', requireAuth(['petstore']), (req, res) => petstoresController.productsList(req, res))

router.post('/products', requireAuth(['petstore']), (req, res) => petstoresController.productsCreate(req, res))

router.delete('/products', requireAuth(['petstore']), (req, res) => petstoresController.productsDeleteAll(req, res))

router.delete('/products/:id', requireAuth(['petstore']), (req, res) => petstoresController.productsDelete(req, res))

router.put('/products/:id', requireAuth(['petstore']), (req, res) => petstoresController.productsPut(req, res))

router.patch('/products/:id/stock', requireAuth(['petstore']), (req, res) => petstoresController.productsPatchStock(req, res))

router.patch('/products/:id/stock-count', requireAuth(['petstore']), (req, res) =>
  petstoresController.productsPatchStockCount(req, res)
)

router.get('/search/nearby', (req, res) => petstoresController.searchNearby(req, res))

router.get('/:id', (req, res) => petstoresController.getById(req, res))

export default router
