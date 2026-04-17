import { Router } from 'express'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/my-videos', requireAuth(['vet']), (_req, res) => {
  res.json({ videos: [] })
})

router.post('/upload', requireAuth(['vet']), (_req, res) => {
  res.status(501).json({ message: 'ميزة رفع الفيديو غير مفعّلة حالياً على الخادم.' })
})

router.delete('/:id', requireAuth(['vet']), (_req, res) => {
  res.status(404).json({ error: 'not_found' })
})

router.patch('/:id/visibility', requireAuth(['vet']), (_req, res) => {
  res.status(404).json({ error: 'not_found' })
})

export default router
