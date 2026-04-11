import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import mongoose, { Schema, Model } from 'mongoose';

const SlotSchema = new Schema({
    vetId: {
        type: String,
        required: true,
        index: true
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true
    },
    time: {
        type: String, // HH:mm
        required: true
    },
    isBooked: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to prevent duplicate slots for same vet at same time
SlotSchema.index({ vetId: 1, date: 1, time: 1 }, { unique: true });

export const SlotModel: Model<any> = mongoose.models.Slot || mongoose.model('Slot', SlotSchema);

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
        const slots = await SlotModel.find({ vetId }).sort({ date: 1, time: 1 });
        return res.json({ slots });
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

        const existingSlot = await SlotModel.findOne({ vetId, date, time });
        if (existingSlot) {
            return res.status(409).json({ error: 'Slot already exists' });
        }

        const slot = await SlotModel.create({
            vetId,
            date,
            time
        });

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
        const slot = await SlotModel.findOne({ _id: req.params.id, vetId });

        if (!slot) {
            return res.status(404).json({ error: 'Slot not found' });
        }

        if (slot.isBooked) {
            return res.status(400).json({ error: 'Cannot delete a booked slot' });
        }

        await slot.deleteOne();
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
        const slots = await SlotModel.find({ vetId, isBooked: false }).sort({ date: 1, time: 1 });
        return res.json({ slots });
    } catch (error) {
        console.error('Error fetching vet slots:', error);
        return res.status(500).json({ error: 'Failed to fetch slots' });
    }
});

export default router;
