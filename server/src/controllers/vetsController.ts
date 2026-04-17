import { Request, Response } from 'express'
import { vetsRepository } from '../repositories/vetsRepository'

export const vetsController = {
  async register(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const vet = await vetsRepository.createForUser(userId, req.body)
      return res.json({ vet: { id: vet.id, verified: vet.verified } })
    } catch (error: any) {
      return res.status(400).json({ error: 'vet_register_failed', message: error.message })
    }
  },

  async getAll(req: Request, res: Response) {
    try {
      const vets = await vetsRepository.getAll({
        specialization: req.query.specialization as string | undefined,
        country: req.query.country as string | undefined,
        city: req.query.city as string | undefined,
        name: req.query.name as string | undefined,
        isVerified: req.query.isVerified === 'true' ? true : undefined
      })
      return res.json({ vets })
    } catch (error: any) {
      return res.status(500).json({ error: 'server_error', message: error.message })
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const vet = await vetsRepository.getById(req.params.id)
      if (!vet) return res.status(404).json({ error: 'not_found' })
      return res.json({ vet })
    } catch (error: any) {
      return res.status(500).json({ error: 'server_error', message: error.message })
    }
  },

  async verify(req: Request, res: Response) {
    try {
      await vetsRepository.setVerified(req.params.id, true)
      return res.json({ success: true })
    } catch (error: any) {
      return res.status(400).json({ error: 'verify_failed', message: error.message })
    }
  },

  async approve(req: Request, res: Response) {
    try {
      await vetsRepository.setVerified(req.params.id, true)
      return res.redirect('/doctor-dashboard')
    } catch {
      return res.status(404).send('not_found')
    }
  },

  async adminAdd(req: Request, res: Response) {
    return res.status(501).json({ error: 'admin_add_requires_supabase_auth_user_creation' })
  },

  async update(req: Request, res: Response) {
    try {
      const vet = await vetsRepository.update(req.params.id, req.body)
      return res.json({ vet })
    } catch (error: any) {
      return res.status(400).json({ error: 'update_failed', message: error.message })
    }
  }
}
