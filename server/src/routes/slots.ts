import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

const createSlotSchema = z.object({
    body: z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
        time: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)')
    })
});

// Get slots for logged-in vet
router.get('/', requireAuth(['vet']), async (req, res) => {
    try {
        const vetId = (req as any).user.id;
        const { data: slots, error } = await supabaseAdmin
            .from('slots')
            .select('*')
            .eq('vet_id', vetId)
            .order('date', { ascending: true })
            .order('time', { ascending: true });

        if (error) return res.status(500).json({ error: 'Failed to fetch slots', message: error.message });
        return res.json({ slots: slots || [] });
    } catch (error) {
        console.error('Error fetching slots:', error);
        return res.status(500).json({ error: 'Failed to fetch slots' });
    }
});

// Create a new slot
router.post('/', requireAuth(['vet']), validate(createSlotSchema), async (req, res) => {
    try {
        const vetId = (req as any).user.id;
        const { date, time } = req.body;

        // Check if slot exists
        const { data: existing } = await supabaseAdmin
            .from('slots')
            .select('*')
            .eq('vet_id', vetId)
            .eq('date', date)
            .eq('time', time)
            .maybeSingle();

        if (existing) return res.status(409).json({ error: 'Slot already exists' });

        const { data: slot, error } = await supabaseAdmin
            .from('slots')
            .insert({ vet_id: vetId, date, time, is_booked: false })
            .select()
            .single();

        if (error) return res.status(500).json({ error: 'Failed to create slot', message: error.message });
        return res.status(201).json({ slot });
    } catch (error) {
        console.error('Error creating slot:', error);
        return res.status(500).json({ error: 'Failed to create slot' });
    }
});

// Delete a slot
router.delete('/:id', requireAuth(['vet']), async (req, res) => {
    try {
        const vetId = (req as any).user.id;
        const { id } = req.params;

        // Check if slot exists and belongs to vet
        const { data: slot } = await supabaseAdmin
            .from('slots')
            .select('*')
            .eq('id', id)
            .eq('vet_id', vetId)
            .maybeSingle();

        if (!slot) return res.status(404).json({ error: 'Slot not found' });
        if (slot.is_booked) return res.status(400).json({ error: 'Cannot delete a booked slot' });

        const { error } = await supabaseAdmin.from('slots').delete().eq('id', id);
        if (error) return res.status(500).json({ error: 'Failed to delete slot', message: error.message });

        return res.json({ success: true });
    } catch (error) {
        console.error('Error deleting slot:', error);
        return res.status(500).json({ error: 'Failed to delete slot' });
    }
});

// Get available slots for a specific vet (public/user)
router.get('/vet/:vetId', async (req, res) => {
    try {
        const { vetId } = req.params;
        const { data: slots, error } = await supabaseAdmin
            .from('slots')
            .select('*')
            .eq('vet_id', vetId)
            .eq('is_booked', false)
            .order('date', { ascending: true })
            .order('time', { ascending: true });

        if (error) return res.status(500).json({ error: 'Failed to fetch slots', message: error.message });
        return res.json({ slots: slots || [] });
    } catch (error) {
        console.error('Error fetching vet slots:', error);
        return res.status(500).json({ error: 'Failed to fetch slots' });
    }
});

export default router;
