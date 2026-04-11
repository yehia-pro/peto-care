import { Router, Request, Response } from 'express'
import mongoose from 'mongoose'
import { requireAuth } from '../middleware/auth'
import Appointment from '../models/Appointment'
import PetRecord from '../models/PetRecord'
import User from '../models/User'

const router = Router()

// Doctor Dashboard
router.get('/doctor/dashboard', requireAuth(['vet']), async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id

        // Get doctor's stats
        const totalAppointments = await Appointment.countDocuments({
            vetId: userId
        })

        const upcomingAppointments = await Appointment.countDocuments({
            vetId: userId,
            date: { $gte: new Date() },
            status: { $in: ['pending', 'confirmed'] }
        })

        const completedAppointments = await Appointment.countDocuments({
            vetId: userId,
            status: 'completed'
        })

        // Get recent appointments
        const recentAppointments = await Appointment.find({ vetId: userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('userId', 'name email')

        // Calculate unique patients
        const uniquePatients = await Appointment.distinct('userId', { vetId: userId });
        const totalPatients = uniquePatients.length;

        // Calculate real rating
        const { default: Review } = await import('../models/Review');
        const ratingStats = await Review.aggregate([
            { $match: { targetId: new mongoose.Types.ObjectId(userId) } },
            { $group: { _id: null, average: { $avg: '$rating' } } }
        ]);
        const rating = ratingStats.length > 0 ? Number(ratingStats[0].average.toFixed(1)) : 0;

        // Calculate revenue
        const revenueStats = await Appointment.aggregate([
            {
                $match: {
                    vetId: new mongoose.Types.ObjectId(userId),
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$price' }
                }
            }
        ]);
        const revenue = revenueStats.length > 0 ? revenueStats[0].total : 0;

        res.json({
            stats: {
                totalAppointments,
                upcomingAppointments,
                completedAppointments,
                totalPatients,
                rating,
                revenue
            },
            recentAppointments
        })
    } catch (error) {
        console.error('Error fetching doctor dashboard:', error)
        res.status(500).json({ error: 'Failed to fetch dashboard data' })
    }
})

// Customer Dashboard
router.get('/customer/dashboard', requireAuth(['user']), async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id

        // Get customer's stats
        const totalPets = await PetRecord.countDocuments({ userId })

        const totalAppointments = await Appointment.countDocuments({
            userId
        })

        const upcomingAppointments = await Appointment.countDocuments({
            userId,
            date: { $gte: new Date() },
            status: { $in: ['pending', 'confirmed'] }
        })

        // Get recent pets
        const recentPets = await PetRecord.find({ userId })
            .sort({ createdAt: -1 })
            .limit(5)

        // Get recent appointments
        const recentAppointments = await Appointment.find({ userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('vetId', 'name email')

        res.json({
            stats: {
                totalPets,
                totalAppointments,
                upcomingAppointments
            },
            recentPets,
            recentAppointments
        })
    } catch (error) {
        console.error('Error fetching customer dashboard:', error)
        res.status(500).json({ error: 'Failed to fetch dashboard data' })
    }
})

// Store Dashboard
router.get('/store/dashboard', requireAuth(['petstore']), async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id
        const { default: MPetStoreModel } = await import('../models/PetStore')

        const { default: Review } = await import('../models/Review')

        const store = await MPetStoreModel.findOne({ userId })
        if (!store) {
            return res.status(404).json({ error: 'Store not found' })
        }

        // Aggregate real rating and review count from the Review collection
        const reviewStats = await Review.aggregate([
            { $match: { targetId: store._id, targetType: 'petstore' } },
            { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]);

        const rating = reviewStats.length > 0 ? Number(reviewStats[0].average.toFixed(1)) : 0;
        const reviewCount = reviewStats.length > 0 ? reviewStats[0].count : 0;

        // Stats
        const productsCount = store.products?.length || 0
        // Revenue is 0 for now as Order system is not active (TypeORM issue)
        const revenue = 0
        const ordersCount = 0

        res.json({
            stats: {
                productsCount,
                rating,
                reviewCount,
                revenue,
                ordersCount
            },
            recentOrders: []
        })
    } catch (error) {
        console.error('Error fetching store dashboard:', error)
        res.status(500).json({ error: 'Failed to fetch dashboard data' })
    }
})

export default router
