import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { requireAuth } from '../middleware/auth'
import ReminderModel from '../models/Reminder'

const router = Router()

const createSchema = z.object({
    body: z.object({
        petId: z.string().optional(),
        type: z.enum(['vaccination', 'medication', 'appointment', 'checkup']),
        title: z.string(),
        description: z.string(),
        dueDate: z.string()
    })
})

// Create reminder
router.post('/', requireAuth(['user']), validate(createSchema), async (req, res) => {
    try {
        const userId = (req as any).user.id
        const { petId, type, title, description, dueDate } = req.body

        const reminder = await ReminderModel.create({
            userId,
            petId,
            type,
            title,
            description,
            dueDate: new Date(dueDate)
        })

        res.status(201).json({ reminder })
    } catch (error) {
        console.error('Error creating reminder:', error)
        res.status(500).json({ error: 'server_error', message: 'خطأ في الخادم' })
    }
})

// Get user's reminders
router.get('/', requireAuth(['user']), async (req, res) => {
    try {
        const userId = (req as any).user.id
        const { upcoming } = req.query

        const query: any = { userId }
        if (upcoming === 'true') {
            query.dueDate = { $gte: new Date() }
            query.sent = false
        }

        const reminders = await ReminderModel.find(query).sort({ dueDate: 1 })
        res.json({ reminders })
    } catch (error) {
        console.error('Error fetching reminders:', error)
        res.status(500).json({ error: 'server_error', message: 'خطأ في الخادم' })
    }
})

// Update reminder
router.put('/:id', requireAuth(['user']), async (req, res) => {
    try {
        const { id } = req.params
        const userId = (req as any).user.id

        const reminder = await ReminderModel.findOne({ _id: id, userId })
        if (!reminder) {
            return res.status(404).json({ error: 'not_found', message: 'التذكير غير موجود' })
        }

        Object.assign(reminder, req.body)
        await reminder.save()

        res.json({ reminder })
    } catch (error) {
        console.error('Error updating reminder:', error)
        res.status(500).json({ error: 'server_error', message: 'خطأ في الخادم' })
    }
})

// Delete reminder
router.delete('/:id', requireAuth(['user']), async (req, res) => {
    try {
        const { id } = req.params
        const userId = (req as any).user.id

        const reminder = await ReminderModel.findOne({ _id: id, userId })
        if (!reminder) {
            return res.status(404).json({ error: 'not_found', message: 'التذكير غير موجود' })
        }

        await reminder.deleteOne()
        res.json({ success: true })
    } catch (error) {
        console.error('Error deleting reminder:', error)
        res.status(500).json({ error: 'server_error', message: 'خطأ في الخادم' })
    }
})

export default router
