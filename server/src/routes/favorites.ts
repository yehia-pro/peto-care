import express from 'express';
import { requireAuth } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';

const router = express.Router();

// Toggle Favorite
router.post('/toggle', requireAuth(), async (req, res) => {
  try {
    const { itemId, itemType } = req.body;

    if (!itemId || !['product', 'service', 'disease'].includes(itemType)) {
      return res.status(400).json({ error: 'Invalid itemId or itemType' });
    }

    const userId = (req as any).user?.id || (req as any).user?.userId;

    // Check if favorite exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .eq('item_type', itemType)
      .maybeSingle();

    if (checkError) {
      return res.status(500).json({ error: 'check_failed', message: checkError.message });
    }

    if (existing) {
      // Remove favorite
      const { error: deleteError } = await supabaseAdmin
        .from('favorites')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        return res.status(500).json({ error: 'delete_failed', message: deleteError.message });
      }
    } else {
      // Add favorite
      const { error: insertError } = await supabaseAdmin
        .from('favorites')
        .insert({ user_id: userId, item_id: itemId, item_type: itemType });

      if (insertError) {
        return res.status(500).json({ error: 'insert_failed', message: insertError.message });
      }
    }

    // Get updated favorites
    const { data: favorites, error: fetchError } = await supabaseAdmin
      .from('favorites')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) {
      return res.status(500).json({ error: 'fetch_failed', message: fetchError.message });
    }

    res.json({ success: true, favorites: favorites || [] });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get My Favorites
router.get('/', requireAuth(), async (req, res) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;

    const { data: favorites, error } = await supabaseAdmin
      .from('favorites')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ error: 'fetch_failed', message: error.message });
    }

    res.json({ favorites: favorites || [] });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get My Favorites with Details
router.get('/details', requireAuth(), async (req, res) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;

    // Get favorites
    const { data: favorites, error: favError } = await supabaseAdmin
      .from('favorites')
      .select('*')
      .eq('user_id', userId);

    if (favError) {
      return res.status(500).json({ error: 'fetch_failed', message: favError.message });
    }

    // For now, return empty arrays - can be enhanced to join with products/services tables
    res.json({
      products: [],
      services: []
    });
  } catch (error) {
    console.error('Get favorites details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
