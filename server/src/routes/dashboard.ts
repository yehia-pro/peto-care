import { Router, Request, Response } from 'express'
import { requireAuth } from '../middleware/auth'
import { supabaseAdmin } from '../lib/supabase'
import { ordersRepository, mapOrderRow } from '../repositories/ordersRepository'

const router = Router()

// Doctor Dashboard
router.get('/doctor/dashboard', requireAuth(['vet']), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id

    const { data: vet, error: vetErr } = await supabaseAdmin.from('vets').select('id').eq('user_id', userId).maybeSingle()
    if (vetErr || !vet) {
      return res.json({
        stats: {
          totalAppointments: 0,
          upcomingAppointments: 0,
          completedAppointments: 0,
          totalPatients: 0,
          rating: 0,
          revenue: 0
        },
        recentAppointments: []
      })
    }

    const vetId = vet.id
    const now = new Date().toISOString()

    const { data: apps, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('vet_id', vetId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const list = apps || []
    const totalAppointments = list.length
    const upcomingAppointments = list.filter(
      (a: any) => ['pending', 'confirmed'].includes(a.status) && a.scheduled_at >= now
    ).length
    const completedAppointments = list.filter((a: any) => a.status === 'completed').length
    const uniqueCustomers = new Set(list.map((a: any) => a.customer_user_id)).size

    const recentAppointments = list.slice(0, 5).map((a: any) => ({
      _id: a.id,
      userId: a.customer_user_id,
      vetId: a.vet_id,
      date: a.scheduled_at,
      status: a.status,
      reason: a.reason
    }))

    res.json({
      stats: {
        totalAppointments,
        upcomingAppointments,
        completedAppointments,
        totalPatients: uniqueCustomers,
        rating: 0,
        revenue: 0
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
    const now = new Date().toISOString()

    const { count: totalPets, error: petCountErr } = await supabaseAdmin
      .from('pets')
      .select('*', { count: 'exact', head: true })
      .eq('owner_user_id', userId)

    if (petCountErr) throw petCountErr

    const { data: apps, error: appsErr } = await supabaseAdmin
      .from('appointments')
      .select('id, status, vet_id, scheduled_at')
      .eq('customer_user_id', userId)

    if (appsErr) throw appsErr

    const list = apps || []
    const upcomingAppointments = list.filter(
      (a: any) => ['pending', 'confirmed'].includes(a.status) && a.scheduled_at >= now
    ).length
    const completedAppointments = list.filter((a: any) => a.status === 'completed').length
    const totalVetsVisited = new Set(list.map((a: any) => a.vet_id).filter(Boolean)).size

    const { data: recentPetsRows } = await supabaseAdmin
      .from('pets')
      .select('id, name, species, breed, created_at')
      .eq('owner_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    const { data: recentAppsRows } = await supabaseAdmin
      .from('appointments')
      .select('id, status, vet_id, scheduled_at, reason, created_at')
      .eq('customer_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    const vetIds = [...new Set((recentAppsRows || []).map((a: any) => a.vet_id).filter(Boolean))]
    const vetNameById = new Map<string, string>()
    if (vetIds.length) {
      const { data: vetRows } = await supabaseAdmin.from('vets').select('id, clinic_name').in('id', vetIds)
      for (const v of vetRows || []) vetNameById.set(v.id, v.clinic_name || '')
    }

    const recentPets = (recentPetsRows || []).map((p: any) => ({
      _id: p.id,
      id: p.id,
      name: p.name,
      species: p.species,
      breed: p.breed,
      createdAt: p.created_at
    }))

    const recentAppointments = (recentAppsRows || []).map((a: any) => ({
      _id: a.id,
      vetId: a.vet_id,
      date: a.scheduled_at,
      status: a.status,
      reason: a.reason,
      vetName: vetNameById.get(a.vet_id) || ''
    }))

    res.json({
      stats: {
        totalPets: totalPets ?? 0,
        totalAppointments: list.length,
        upcomingAppointments,
        completedAppointments,
        totalVetsVisited
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

    const { data: storeRow, error } = await supabaseAdmin
      .from('stores')
      .select('id, metadata')
      .eq('owner_user_id', userId)
      .maybeSingle()

    if (error) throw error

    if (!storeRow) {
      return res.json({
        stats: {
          productsCount: 0,
          rating: 0,
          reviewCount: 0,
          revenue: 0,
          ordersCount: 0
        },
        recentOrders: []
      })
    }

    const storeId = storeRow.id
    const meta = (storeRow.metadata || {}) as Record<string, unknown>

    const { count: productsCount } = await supabaseAdmin
      .from('store_products')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)

    const { count: ordersCount } = await supabaseAdmin
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)

    const { data: ordRows } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(5)

    const orderIds = (ordRows || []).map((o: any) => o.id)
    const itemsMap = await ordersRepository.fetchItemsForOrders(orderIds)
    const recentOrders: any[] = []
    for (const o of ordRows || []) {
      const { data: prof } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .eq('id', o.customer_user_id)
        .maybeSingle()
      recentOrders.push(
        mapOrderRow(o, itemsMap.get(o.id) || [], {
          id: o.customer_user_id,
          full_name: prof?.full_name || '',
          email: ''
        })
      )
    }

    res.json({
      stats: {
        productsCount: productsCount ?? 0,
        rating: Number(meta.rating || 0),
        reviewCount: Number(meta.reviewCount || 0),
        revenue: 0,
        ordersCount: ordersCount ?? 0
      },
      recentOrders
    })
  } catch (error) {
    console.error('Error fetching store dashboard:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard data' })
  }
})

export default router
