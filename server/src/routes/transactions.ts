import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/', requireAuth(['admin']), async (req: Request, res: Response) => {
  const page = parseInt(String(req.query.page || '1'), 10) || 1
  const limit = parseInt(String(req.query.limit || '20'), 10) || 20
  res.json({
    transactions: [],
    currentPage: page,
    totalPages: 0,
    totalTransactions: 0
  })
})

router.get('/my', requireAuth(['user', 'vet', 'petstore']), async (req: Request, res: Response) => {
  const page = parseInt(String(req.query.page || '1'), 10) || 1
  const limit = parseInt(String(req.query.limit || '20'), 10) || 20
  res.json({
    transactions: [],
    currentPage: page,
    totalPages: 0,
    totalTransactions: 0
  })
})

export default router
