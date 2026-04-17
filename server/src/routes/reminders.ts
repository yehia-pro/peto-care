import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { requireAuth } from '../middleware/auth'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

const createSchema = z.object({
    body: z.object({
        petId: z.string().uuid().optional(),
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

        const { data: reminder, error } = await supabaseAdmin
            .from('reminders')
            .insert({
                user_id: userId,
                pet_id: petId,
                type,
                title,
                description,
                due_date: dueDate,
                sent: false
            })
            .select()
            .single()

        if (error) return res.status(500).json({ error: 'insert_failed', message: error.message })
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

        let query = supabaseAdmin.from('reminders').select('*').eq('user_id', userId)

        if (upcoming === 'true') {
            query = query.gte('due_date', new Date().toISOString()).eq('sent', false)
        }

        const { data: reminders, error } = await query.order('due_date', { ascending: true })

        if (error) return res.status(500).json({ error: 'fetch_failed', message: error.message })
        res.json({ reminders: reminders || [] })
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

        const { data: reminder, error } = await supabaseAdmin
            .from('reminders')
            .update(req.body)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single()

        if (error) return res.status(500).json({ error: 'update_failed', message: error.message })
        if (!reminder) return res.status(404).json({ error: 'not_found', message: 'التذكير غير موجود' })

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

        const { error } = await supabaseAdmin
            .from('reminders')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)

        if (error) return res.status(500).json({ error: 'delete_failed', message: error.message })
        res.json({ success: true })
    } catch (error) {
        console.error('Error deleting reminder:', error)
        res.status(500).json({ error: 'server_error', message: 'خطأ في الخادم' })
    }
})

export default router
