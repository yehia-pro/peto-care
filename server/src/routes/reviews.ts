import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

const createReviewSchema = z.object({
  body: z.object({
    targetId: z.string().uuid(),
    targetType: z.enum(['vet', 'petstore', 'product']),
    rating: z.number().min(1).max(5),
    comment: z.string().optional()
  })
});

// Create a review
router.post('/', requireAuth(['user']), validate(createReviewSchema), async (req, res) => {
  try {
    const { targetId, targetType, rating, comment } = req.body;
    const reviewerId = (req as any).user.id;

    // Insert review into Supabase
    const { data: review, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        reviewer_id: reviewerId,
        target_id: targetId,
        target_type: targetType,
        rating,
        comment
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'review_creation_failed', message: error.message });
    }

    res.status(201).json({ success: true, review });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'server_error' });
  }
});

// Get reviews for a target
router.get('/:targetId', async (req, res) => {
  try {
    const { targetId } = req.params;
    const { page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    // Get reviews from Supabase
    const { data: reviews, error, count } = await supabaseAdmin
      .from('reviews')
      .select('*', { count: 'exact' })
      .eq('target_id', targetId)
      .order('created_at', { ascending: false })
      .range((pageNum - 1) * limitNum, pageNum * limitNum - 1);

    if (error) {
      return res.status(500).json({ error: 'fetch_failed', message: error.message });
    }

    // Calculate average rating
    const { data: stats } = await supabaseAdmin
      .from('reviews')
      .select('rating')
      .eq('target_id', targetId);

    const averageRating = stats?.length
      ? stats.reduce((sum: number, r: any) => sum + r.rating, 0) / stats.length
      : 0;

    res.json({
      reviews: reviews || [],
      averageRating,
      totalReviews: count || 0,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        pages: Math.ceil((count || 0) / limitNum)
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'server_error' });
  }
});

export default router;
