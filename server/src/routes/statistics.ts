import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import mongoose, { Schema } from 'mongoose'
import { AppointmentModel } from './appointments'
import PetRecordModel from '../models/PetRecord'
import MPetStoreModel from '../models/PetStore'

const router = Router()

// Get customer statistics
router.get('/customer', requireAuth(['user']), async (req, res) => {
    try {
        const userId = (req as any).user.id

        const [appointments, pets, reminders] = await Promise.all([
            AppointmentModel.find({ userId }).lean(),
            PetRecordModel.find({ userId }).lean(),
            mongoose.models.Reminder
                ? mongoose.models.Reminder.find({ userId }).lean()
                : Promise.resolve([])
        ])

        const now = new Date()
        const upcomingAppointments = appointments.filter(a =>
            new Date(a.scheduledAt) > now && a.status !== 'cancelled'
        )

        const stats = {
            totalAppointments: appointments.length,
            upcomingAppointments: upcomingAppointments.length,
            completedAppointments: appointments.filter(a => a.status === 'completed').length,
            pendingAppointments: appointments.filter(a => a.status === 'pending').length,
            totalPets: pets.length,
            totalReminders: reminders.length,
            upcomingReminders: reminders.filter((r: any) =>
                new Date(r.dueDate) > now && !r.sent
            ).length,
            recentActivity: appointments
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map(a => ({
                    type: 'appointment',
                    date: a.scheduledAt,
                    status: a.status,
                    reason: a.reason
                }))
        }

        return res.json({ statistics: stats })
    } catch (error) {
        console.error('Error fetching customer statistics:', error)
        return res.status(500).json({ error: 'server_error' })
    }
})

// Get vet statistics
router.get('/vet', requireAuth(['vet']), async (req, res) => {
    try {
        const vetId = (req as any).user.id

        const appointments = await AppointmentModel.find({ vetId }).lean()

        const now = new Date()
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const thisMonth = new Date()
        thisMonth.setDate(1)
        thisMonth.setHours(0, 0, 0, 0)

        const stats = {
            totalAppointments: appointments.length,
            todayAppointments: appointments.filter(a => {
                const apptDate = new Date(a.scheduledAt)
                return apptDate >= today && apptDate < tomorrow
            }).length,
            upcomingAppointments: appointments.filter(a =>
                new Date(a.scheduledAt) > now && a.status !== 'cancelled'
            ).length,
            pendingAppointments: appointments.filter(a => a.status === 'pending').length,
            completedAppointments: appointments.filter(a => a.status === 'completed').length,
            thisMonthAppointments: appointments.filter(a => {
                const apptDate = new Date(a.scheduledAt)
                return apptDate >= thisMonth
            }).length,
            averageRating: 4.5 + Math.random() * 0.5, // Mock for now
            totalReviews: Math.floor(Math.random() * 50) + 10,
            weeklyData: generateWeeklyData(appointments)
        }

        return res.json({ statistics: stats })
    } catch (error) {
        console.error('Error fetching vet statistics:', error)
        return res.status(500).json({ error: 'server_error' })
    }
})

// Get store statistics
router.get('/store', requireAuth(['petstore']), async (req, res) => {
    try {
        const userId = (req as any).user.id

        const store = await MPetStoreModel.findOne({ userId }).lean() as any

        if (!store) {
            return res.status(404).json({ error: 'store_not_found' })
        }

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const thisMonth = new Date()
        thisMonth.setDate(1)
        thisMonth.setHours(0, 0, 0, 0)

        // Mock order data (in real app, would come from orders collection)
        const totalOrders = Math.floor(Math.random() * 100) + 20
        const todayOrders = Math.floor(Math.random() * 10) + 1
        const monthlyRevenue = Math.floor(Math.random() * 50000) + 10000

        const stats = {
            storeName: store.storeName,
            totalProducts: store.products?.length || 0,
            rating: store.rating || 0,
            totalOrders,
            todayOrders,
            monthlyRevenue,
            averageOrderValue: totalOrders > 0 ? Math.floor(monthlyRevenue / totalOrders) : 0,
            topProducts: (store.products || [])
                .sort((a: any, b: any) => (b.sales || 0) - (a.sales || 0))
                .slice(0, 5)
                .map((p: any) => ({
                    name: p.name,
                    sales: p.sales || Math.floor(Math.random() * 50),
                    revenue: p.price * (p.sales || Math.floor(Math.random() * 50))
                }))
        }

        return res.json({ statistics: stats })
    } catch (error) {
        console.error('Error fetching store statistics:', error)
        return res.status(500).json({ error: 'server_error' })
    }
})

// Get admin statistics
router.get('/admin', requireAuth(['admin']), async (req, res) => {
    try {
        const MUserModel = mongoose.models.User || mongoose.model('User', new Schema({}, { strict: false }))

        const [users, appointments, stores] = await Promise.all([
            MUserModel.find({}).lean(),
            AppointmentModel.find({}).lean(),
            MPetStoreModel.find({}).lean()
        ])

        const thisMonth = new Date()
        thisMonth.setDate(1)
        thisMonth.setHours(0, 0, 0, 0)

        const stats = {
            totalUsers: users.length,
            totalCustomers: users.filter((u: any) => u.role === 'user').length,
            totalVets: users.filter((u: any) => u.role === 'vet').length,
            totalStores: stores.length,
            totalAppointments: appointments.length,
            thisMonthAppointments: appointments.filter(a =>
                new Date(a.createdAt) >= thisMonth
            ).length,
            pendingApprovals: users.filter((u: any) =>
                (u.role === 'vet' || u.role === 'petstore') && !u.isApproved
            ).length,
            recentRegistrations: users
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 10)
                .map((u: any) => ({
                    fullName: u.fullName,
                    email: u.email,
                    role: u.role,
                    createdAt: u.createdAt
                }))
        }

        return res.json({ statistics: stats })
    } catch (error) {
        console.error('Error fetching admin statistics:', error)
        return res.status(500).json({ error: 'server_error' })
    }
})

// Helper function to generate weekly appointment data
function generateWeeklyData(appointments: any[]) {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    const weekData = days.map(day => ({ day, count: 0 }))

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    appointments.forEach(appt => {
        const apptDate = new Date(appt.scheduledAt)
        if (apptDate >= weekAgo && apptDate <= now) {
            const dayIndex = apptDate.getDay()
            weekData[dayIndex].count++
        }
    })

    return weekData
}

export default router
