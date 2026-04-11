import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import Transaction from '../models/Transaction';

const router = Router();

// Get all transactions (Admin only)
router.get('/', requireAuth(['admin']), async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const transactions = await Transaction.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'fullName email')
            .lean();

        const total = await Transaction.countDocuments();

        res.json({
            transactions,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalTransactions: total
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'server_error' });
    }
});

// Get my transactions (User/Vet/Store)
router.get('/my', requireAuth(['user', 'vet', 'petstore']), async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const transactions = await Transaction.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Transaction.countDocuments({ userId });

        res.json({
            transactions,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalTransactions: total
        });
    } catch (error) {
        console.error('Error fetching user transactions:', error);
        res.status(500).json({ error: 'server_error' });
    }
});

export default router;
