import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import Disease from '../models/Disease';

const router = Router();

// Get all diseases (Public)
router.get('/', async (req, res) => {
    try {
        const diseases = await Disease.find().sort({ createdAt: -1 });
        res.json(diseases);
    } catch (error) {
        console.error('Error fetching diseases:', error);
        res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء جلب الأمراض' });
    }
});

// Create a new disease (Admin Only)
router.post('/', requireAuth(['admin']), async (req, res) => {
    try {
        const { name, description, symptoms, imageUrl, isRare } = req.body;
        const newDisease = await Disease.create({ name, description, symptoms, imageUrl, isRare });
        res.status(201).json(newDisease);
    } catch (error) {
        console.error('Error creating disease:', error);
        res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء إضافة المرض' });
    }
});

// Update a disease (Admin Only)
router.put('/:id', requireAuth(['admin']), async (req, res) => {
    try {
        const updatedDisease = await Disease.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!updatedDisease) return res.status(404).json({ error: 'not_found', message: 'المرض غير موجود' });
        res.json(updatedDisease);
    } catch (error) {
        console.error('Error updating disease:', error);
        res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء تحديث بيانات المرض' });
    }
});

// Delete a disease (Admin Only)
router.delete('/:id', requireAuth(['admin']), async (req, res) => {
    try {
        const deletedDisease = await Disease.findByIdAndDelete(req.params.id);
        if (!deletedDisease) return res.status(404).json({ error: 'not_found', message: 'المرض غير موجود' });
        res.json({ message: 'تم الحذف بنجاح' });
    } catch (error) {
        console.error('Error deleting disease:', error);
        res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء حذف المرض' });
    }
});

export default router;
