import { Request, Response } from 'express'
import { petsRepository } from '../repositories/petsRepository'

export const petsController = {
  async create(req: Request, res: Response, next: any) {
    try {
      const record = await petsRepository.create((req as any).user.id, req.body)
      return res.json({ record })
    } catch (error) {
      return next(error)
    }
  },

  async list(req: Request, res: Response, next: any) {
    try {
      const records = await petsRepository.list((req as any).user.role, (req as any).user.id)
      return res.json({ records })
    } catch (error) {
      return next(error)
    }
  },

  /** Shape expected by CustomerDashboard (`pets` array, `id` not `_id`) */
  async listMyPetsDashboard(req: Request, res: Response, next: any) {
    try {
      const records = await petsRepository.list((req as any).user.role, (req as any).user.id)
      const pets = records.map((r: any) => ({
        id: r._id,
        petName: r.petName,
        species: r.petType,
        breed: r.breed,
        age: r.age ?? 0,
        weight: r.weight ?? 0,
        gender: r.gender || 'unknown',
        color: r.color || '',
        microchipId: r.microchipId || '',
        description: r.description || '',
        medicalHistory: r.medicalHistory || '',
        vaccinationRecords: r.vaccinationRecords || '',
        allergies: r.allergies || '',
        currentMedications: r.currentMedications || '',
        emergencyContact: r.emergencyContact || '',
        createdAt: r.createdAt,
        updatedAt: r.createdAt
      }))
      return res.json({ pets })
    } catch (error) {
      return next(error)
    }
  },

  async getById(req: Request, res: Response, next: any) {
    try {
      const record = await petsRepository.getById(req.params.id)
      if (!record) return res.status(404).json({ error: 'not_found', message: 'السجل غير موجود' })
      return res.json({ record })
    } catch (error) {
      return next(error)
    }
  },

  async update(req: Request, res: Response, next: any) {
    try {
      const existing = await petsRepository.getById(req.params.id)
      if (!existing) return res.status(404).json({ error: 'not_found', message: 'السجل غير موجود' })
      const requester = (req as any).user
      if (requester.role !== 'admin' && requester.role !== 'vet' && String(existing.userId) !== String(requester.id)) {
        return res.status(403).json({ error: 'forbidden', message: 'غير مصرح لك' })
      }
      const record = await petsRepository.update(req.params.id, req.body)
      return res.json({ record })
    } catch (error) {
      return next(error)
    }
  },

  async remove(req: Request, res: Response, next: any) {
    try {
      const existing = await petsRepository.getById(req.params.id)
      if (!existing) return res.status(404).json({ error: 'not_found', message: 'السجل غير موجود' })
      const requester = (req as any).user
      if (requester.role !== 'admin' && String(existing.userId) !== String(requester.id)) {
        return res.status(403).json({ error: 'forbidden', message: 'غير مصرح لك' })
      }
      await petsRepository.delete(req.params.id)
      return res.json({ success: true })
    } catch (error) {
      return next(error)
    }
  }
}
