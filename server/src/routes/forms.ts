import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

// Create new form
router.post('/', requireAuth(), async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const { data: form, error } = await supabaseAdmin
      .from('consultation_forms')
      .insert({
        user_id: userId,
        ...req.body
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: 'insert_failed', message: error.message });
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

    const { data: forms, error } = await supabaseAdmin
      .from('consultation_forms')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'fetch_failed', message: error.message });
    res.json({ forms: forms || [] });
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

// Delete a form
router.delete('/:id', requireAuth(), async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const { error } = await supabaseAdmin
      .from('consultation_forms')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', userId);

    if (error) return res.status(500).json({ error: 'delete_failed', message: error.message });
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

    const { data: form, error } = await supabaseAdmin
      .from('consultation_forms')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: 'update_failed', message: error.message });
    if (!form) return res.status(404).json({ error: 'Form not found' });
    res.json({ form });
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ error: 'Failed to update form' });
  }
});

export default router;
