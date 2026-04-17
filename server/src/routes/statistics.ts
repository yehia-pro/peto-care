import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

// Get customer statistics
router.get('/customer', requireAuth(['user']), async (req, res) => {
    try {
        const userId = (req as any).user.id

        const nowIso = new Date().toISOString()

        const { count: totalAppointments } = await supabaseAdmin
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)

        const { count: upcomingAppointments } = await supabaseAdmin
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('scheduled_at', nowIso)
            .in('status', ['pending', 'confirmed'])

        const { count: completedAppointments } = await supabaseAdmin
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed')

        const { count: pendingAppointments } = await supabaseAdmin
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'pending')

        const { count: totalPets } = await supabaseAdmin
            .from('pets')
            .select('*', { count: 'exact', head: true })
            .or(`owner_user_id.eq.${userId},user_id.eq.${userId}`)

        const { count: totalReminders } = await supabaseAdmin
            .from('reminders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)

        const { count: upcomingReminders } = await supabaseAdmin
            .from('reminders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('sent', false)
            .gte('due_date', nowIso)

        const stats = {
            totalAppointments: totalAppointments || 0,
            upcomingAppointments: upcomingAppointments || 0,
            completedAppointments: completedAppointments || 0,
            pendingAppointments: pendingAppointments || 0,
            totalPets: totalPets || 0,
            totalReminders: totalReminders || 0,
            upcomingReminders: upcomingReminders || 0,
            recentActivity: []
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
        const now = new Date()
        const todayStart = new Date(now)
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date(now)
        todayEnd.setHours(23, 59, 59, 999)
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        const { count: totalAppointments } = await supabaseAdmin
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('vet_id', vetId)

        const { count: todayAppointments } = await supabaseAdmin
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('vet_id', vetId)
            .gte('scheduled_at', todayStart.toISOString())
            .lte('scheduled_at', todayEnd.toISOString())

        const { count: upcomingAppointments } = await supabaseAdmin
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('vet_id', vetId)
            .gte('scheduled_at', now.toISOString())
            .in('status', ['pending', 'confirmed'])

        const { count: pendingAppointments } = await supabaseAdmin
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('vet_id', vetId)
            .eq('status', 'pending')

        const { count: completedAppointments } = await supabaseAdmin
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('vet_id', vetId)
            .eq('status', 'completed')

        const { count: thisMonthAppointments } = await supabaseAdmin
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('vet_id', vetId)
            .gte('scheduled_at', monthStart.toISOString())

        const { data: reviewRows } = await supabaseAdmin
            .from('reviews')
            .select('rating')
            .eq('target_type', 'vet')
            .eq('target_id', vetId)

        const totalReviews = (reviewRows || []).length
        const averageRating = totalReviews > 0
            ? Number(
                ((reviewRows || []).reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) / totalReviews).toFixed(2)
            )
            : 0

        const stats = {
            totalAppointments: totalAppointments || 0,
            todayAppointments: todayAppointments || 0,
            upcomingAppointments: upcomingAppointments || 0,
            pendingAppointments: pendingAppointments || 0,
            completedAppointments: completedAppointments || 0,
            thisMonthAppointments: thisMonthAppointments || 0,
            averageRating,
            totalReviews,
            weeklyData: []
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
        const now = new Date()
        const todayStart = new Date(now)
        todayStart.setHours(0, 0, 0, 0)
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        // Get store
        const { data: store } = await supabaseAdmin
            .from('stores')
            .select('*')
            .or(`owner_user_id.eq.${userId},user_id.eq.${userId}`)
            .maybeSingle()

        if (!store) {
            return res.status(404).json({ error: 'store_not_found' })
        }

        // Get products count
        const { count: totalProducts } = await supabaseAdmin
            .from('store_products')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', store.id)

        // Get orders and compute aggregates
        const { count: totalOrders } = await supabaseAdmin
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', store.id)

        const { count: todayOrders } = await supabaseAdmin
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', store.id)
            .gte('created_at', todayStart.toISOString())

        const { data: monthOrders } = await supabaseAdmin
            .from('orders')
            .select('total_amount')
            .eq('store_id', store.id)
            .gte('created_at', monthStart.toISOString())
            .in('payment_status', ['paid', 'refunded'])

        const monthlyRevenue = (monthOrders || []).reduce(
            (sum: number, order: any) => sum + Number(order.total_amount || 0),
            0
        )
        const averageOrderValue = (totalOrders || 0) > 0 ? Number((monthlyRevenue / (totalOrders || 1)).toFixed(2)) : 0

        const stats = {
            storeName: store.name,
            totalProducts: totalProducts || 0,
            rating: store.metadata?.rating || 0,
            totalOrders: totalOrders || 0,
            todayOrders: todayOrders || 0,
            monthlyRevenue,
            averageOrderValue,
            topProducts: []
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
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        const { count: totalUsers } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })

        const { count: totalCustomers } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'customer')

        const { count: totalVets } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'vet')

        const { count: totalStores } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'store_owner')

        const { count: totalAppointments } = await supabaseAdmin
            .from('appointments')
            .select('*', { count: 'exact', head: true })

        const { count: thisMonthAppointments } = await supabaseAdmin
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', monthStart)

        const { data: pendingProfiles } = await supabaseAdmin
            .from('profiles')
            .select('id, metadata')
            .in('role', ['vet', 'store_owner'])

        const pendingApprovals = (pendingProfiles || []).filter(
            (p: any) => p?.metadata?.approval_status === 'pending'
        ).length

        const stats = {
            totalUsers: totalUsers || 0,
            totalCustomers: totalCustomers || 0,
            totalVets: totalVets || 0,
            totalStores: totalStores || 0,
            totalAppointments: totalAppointments || 0,
            thisMonthAppointments: thisMonthAppointments || 0,
            pendingApprovals,
            recentRegistrations: []
        }

        return res.json({ statistics: stats })
    } catch (error) {
        console.error('Error fetching admin statistics:', error)
        return res.status(500).json({ error: 'server_error' })
    }
})

export default router
