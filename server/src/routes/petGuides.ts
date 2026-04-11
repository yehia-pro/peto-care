import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import PetGuide from '../models/PetGuide';

const router = Router();

// Get all pet guides (Public)
router.get('/', async (req, res) => {
    try {
        const guides = await PetGuide.find().sort({ createdAt: -1 });
        res.json(guides);
    } catch (error) {
        console.error('Error fetching pet guides:', error);
        res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء جلب دليل الحيوانات' });
    }
});

// Create a new pet guide (Admin Only)
router.post('/', requireAuth(['admin']), async (req, res) => {
    try {
        const { title, description, imageUrl, careTips } = req.body;
        const newGuide = await PetGuide.create({ title, description, imageUrl, careTips });
        res.status(201).json(newGuide);
    } catch (error) {
        console.error('Error creating pet guide:', error);
        res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء إضافة الحيوان' });
    }
});

// Update a pet guide (Admin Only)
router.put('/:id', requireAuth(['admin']), async (req, res) => {
    try {
        const updatedGuide = await PetGuide.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        if (!updatedGuide) return res.status(404).json({ error: 'not_found', message: 'الحيوان غير موجود' });
        res.json(updatedGuide);
    } catch (error) {
        console.error('Error updating pet guide:', error);
        res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء تحديث بيانات الحيوان' });
    }
});

// Delete a pet guide (Admin Only)
router.delete('/:id', requireAuth(['admin']), async (req, res) => {
    try {
        const deletedGuide = await PetGuide.findByIdAndDelete(req.params.id);
        if (!deletedGuide) return res.status(404).json({ error: 'not_found', message: 'الحيوان غير موجود' });
        res.json({ message: 'تم الحذف بنجاح' });
    } catch (error) {
        console.error('Error deleting pet guide:', error);
        res.status(500).json({ error: 'server_error', message: 'حدث خطأ أثناء حذف الحيوان' });
    }
});

export default router;
