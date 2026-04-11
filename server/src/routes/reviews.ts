import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import Review from '../models/Review';
import MUserModel from '../models/User';
import MPetStoreModel from '../models/PetStore';
import mongoose from 'mongoose';

const router = Router();

const createReviewSchema = z.object({
  body: z.object({
    targetId: z.string().min(1),
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

    // Verify target exists
    if (targetType === 'vet') {
      const vet = await MUserModel.findById(targetId);
      if (!vet || vet.role !== 'vet') return res.status(404).json({ error: 'vet_not_found' });
    } else if (targetType === 'petstore') {
      const store = await MPetStoreModel.findById(targetId);
      if (!store) return res.status(404).json({ error: 'store_not_found' });
    }
    // Product verification could be added here

    const review = new Review({
      reviewerId,
      targetId,
      targetType,
      rating,
      comment
    });

    await review.save();

    // Calculate new average rating
    const stats = await Review.aggregate([
      { $match: { targetId: new mongoose.Types.ObjectId(targetId) } },
      { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    const newRating = stats.length > 0 ? Number(stats[0].average.toFixed(1)) : 0;
    const newCount = stats.length > 0 ? stats[0].count : 0;

    // Update target entity
    if (targetType === 'vet') {
      await MUserModel.findByIdAndUpdate(targetId, {
        rating: newRating,
        reviewCount: newCount
      });
    } else if (targetType === 'petstore') {
      await MPetStoreModel.findByIdAndUpdate(targetId, {
        rating: newRating,
        reviewCount: newCount
      });
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
    const skip = (pageNum - 1) * limitNum;

    const reviews = await Review.find({ targetId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('reviewerId', 'fullName avatarUrl')
      .lean();

    const total = await Review.countDocuments({ targetId });

    // Calculate average rating
    const stats = await Review.aggregate([
      { $match: { targetId: new mongoose.Types.ObjectId(targetId) } },
      { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    const averageRating = stats.length > 0 ? stats[0].average : 0;
    const totalReviews = stats.length > 0 ? stats[0].count : 0;

    res.json({
      reviews,
      averageRating,
      totalReviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'server_error' });
  }
});

export default router;
