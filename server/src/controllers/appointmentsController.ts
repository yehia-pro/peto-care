import { Request, Response } from 'express'
import { appointmentsRepository } from '../repositories/appointmentsRepository'
import { petsRepository } from '../repositories/petsRepository'
import { supabaseAdmin } from '../lib/supabase'

const canAccess = async (appointment: any, requester: any) => {
  if (requester.role === 'admin') return true
  if (requester.role === 'user') return String(appointment.userId) === String(requester.id)
  if (requester.role === 'vet') {
    const { data: vet } = await supabaseAdmin.from('vets').select('id').eq('user_id', requester.id).maybeSingle()
    return Boolean(vet && String(vet.id) === String(appointment.vetId))
  }
  return false
}

export const appointmentsController = {
  async create(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      let petId = req.body.petId

      if (!petId) {
        const firstPet = await petsRepository.getFirstByOwner(userId)
        if (!firstPet) {
          return res.status(400).json({ error: 'no_pet_found', message: 'أضف حيوان أليف أولاً قبل الحجز' })
        }
        petId = firstPet.id
      }

      const appointment = await appointmentsRepository.create({
        customerUserId: userId,
        vetId: req.body.vetId,
        petId,
        scheduledAt: req.body.scheduledAt,
        reason: req.body.reason,
        notes: req.body.notes
      })

      return res.json({ appointment })
    } catch (error: any) {
      return res.status(400).json({ error: 'create_failed', message: error.message })
    }
  },

  async list(req: Request, res: Response) {
    try {
      const appointments = await appointmentsRepository.list((req as any).user.role, (req as any).user.id)
      return res.json({ appointments })
    } catch (error: any) {
      return res.status(500).json({ error: 'server_error', message: error.message })
    }
  },

  /** Shape expected by CustomerDashboard */
  async listMyAppointmentsDashboard(req: Request, res: Response) {
    try {
      const appointments = await appointmentsRepository.list((req as any).user.role, (req as any).user.id)
      const mapped = appointments.map((a: any) => ({
        id: a._id,
        title: a.reason?.trim() ? a.reason : 'موعد بيطري',
        description: a.notes || '',
        scheduledTime: a.scheduledAt,
        status: a.status,
        vetName: a.vetName || '',
        vetSpecialization: '',
        price: 0,
        createdAt: a.scheduledAt
      }))
      return res.json({ appointments: mapped })
    } catch (error: any) {
      return res.status(500).json({ error: 'server_error', message: error.message })
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const appointment = await appointmentsRepository.getById(req.params.id)
      if (!appointment) return res.status(404).json({ error: 'not_found' })
      const allowed = await canAccess(appointment, (req as any).user)
      if (!allowed) return res.status(403).json({ error: 'forbidden' })
      return res.json({ appointment: { ...appointment, chatSession: null } })
    } catch (error: any) {
      return res.status(500).json({ error: 'server_error', message: error.message })
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const appointment = await appointmentsRepository.getById(req.params.id)
      if (!appointment) return res.status(404).json({ error: 'not_found' })
      const requester = (req as any).user
      if (requester.role !== 'admin' && String(appointment.userId) !== String(requester.id)) {
        return res.status(403).json({ error: 'forbidden' })
      }
      await appointmentsRepository.delete(req.params.id)
      return res.json({ success: true })
    } catch (error: any) {
      return res.status(400).json({ error: 'delete_failed', message: error.message })
    }
  },

  async updateStatus(req: Request, res: Response) {
    try {
      const appointment = await appointmentsRepository.getById(req.params.id)
      if (!appointment) return res.status(404).json({ error: 'not_found' })
      const requester = (req as any).user
      if (requester.role === 'vet') {
        const allowed = await canAccess(appointment, requester)
        if (!allowed) return res.status(403).json({ error: 'forbidden' })
      }
      const updated = await appointmentsRepository.updateStatus(req.params.id, req.body)
      return res.json({ appointment: updated, message: 'Appointment updated' })
    } catch (error: any) {
      return res.status(400).json({ error: 'update_failed', message: error.message })
    }
  },

  async reschedule(req: Request, res: Response) {
    try {
      const appointment = await appointmentsRepository.getById(req.params.id)
      if (!appointment) return res.status(404).json({ error: 'not_found' })
      const requester = (req as any).user
      if (requester.role !== 'admin' && String(appointment.userId) !== String(requester.id)) {
        return res.status(403).json({ error: 'forbidden' })
      }
      const updated = await appointmentsRepository.reschedule(req.params.id, req.body.scheduledAt)
      return res.json({ appointment: updated, message: 'تم إعادة جدولة الموعد بنجاح' })
    } catch (error: any) {
      return res.status(400).json({ error: 'reschedule_failed', message: error.message })
    }
  },

  async availableSlots(req: Request, res: Response) {
    try {
      const { vetId } = req.params
      const { date } = req.query as any
      if (!date) return res.status(400).json({ error: 'date_required' })

      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const booked = await appointmentsRepository.getBookedSlots(vetId, startOfDay.toISOString(), endOfDay.toISOString())
      const bookedSet = new Set(booked.map(d => new Date(d).getTime()))
      const slots: Array<{ time: string; available: boolean }> = []

      for (let hour = 9; hour < 17; hour++) {
        for (const minute of [0, 30]) {
          const slotTime = new Date(date)
          slotTime.setHours(hour, minute, 0, 0)
          const ts = slotTime.getTime()
          const isTaken = Array.from(bookedSet).some(b => Math.abs(b - ts) < 30 * 60 * 1000)
          const isFuture = ts > Date.now()
          if (!isTaken && isFuture) slots.push({ time: slotTime.toISOString(), available: true })
        }
      }

      return res.json({ slots, date })
    } catch (error: any) {
      return res.status(500).json({ error: 'server_error', message: error.message })
    }
  }
}
