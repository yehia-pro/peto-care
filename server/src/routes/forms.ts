import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import ConsultationFormModel from '../models/ConsultationForm';

const router = Router();

// Create new form
router.post('/', requireAuth(), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const form = await ConsultationFormModel.create({
      ...req.body,
      userId
    });
    res.json({ form });
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({ error: 'Failed to save form' });
  }
});

// Get user's forms
router.get('/', requireAuth(), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const forms = await ConsultationFormModel.find({ userId }).sort({ createdAt: -1 });
    res.json({ forms });
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

// Delete a form
router.delete('/:id', requireAuth(), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const form = await ConsultationFormModel.findOneAndDelete({ _id: req.params.id, userId });
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

// Update a form
router.put('/:id', requireAuth(), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const form = await ConsultationFormModel.findOneAndUpdate(
      { _id: req.params.id, userId },
      { ...req.body },
      { new: true }
    );
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    res.json({ form });
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ error: 'Failed to update form' });
  }
});

export default router;
