import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

// Search vets with filters
router.get('/vets', async (req, res) => {
    try {
        const {
            location,
            specialty,
            minRating,
            page = '1',
            limit = '12'
        } = req.query

        const pageNum = parseInt(page as string)
        const limitNum = parseInt(limit as string)

        let query = supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact' })
            .eq('role', 'vet')
            .range((pageNum - 1) * limitNum, pageNum * limitNum - 1)

        if (location) {
            query = query.ilike('metadata->>country', `%${location}%`)
        }

        if (specialty) {
            query = query.ilike('metadata->>specialization', `%${specialty}%`)
        }

        // Get vets
        const { data: vets, error, count } = await query

        if (error) {
            return res.status(500).json({ error: 'search_failed', message: error.message })
        }

        const minRatingNum = minRating ? Number(minRating) : 0

        // Format vets
        const formattedVets = (vets || [])
            .map((vet: any) => ({
                id: vet.id,
                fullName: vet.full_name,
                email: vet.email || '',
                phone: vet.phone,
                avatarUrl: vet.avatar_url,
                specialization: vet.metadata?.specialization || 'عام',
                experienceYears: Number(vet.metadata?.experience_years || 0),
                country: vet.metadata?.country || 'مصر',
                qualification: vet.metadata?.qualification || '',
                rating: Number(vet.metadata?.rating || 0),
                reviewCount: Number(vet.metadata?.review_count || 0),
                approved: vet.metadata?.approval_status === 'approved' || vet.is_approved === true
            }))
            .filter((vet: any) => vet.approved && vet.rating >= minRatingNum)

        return res.json({
            vets: formattedVets,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: count || 0,
                pages: Math.ceil((count || 0) / limitNum)
            }
        })
    } catch (error) {
        console.error('Error searching vets:', error)
        return res.status(500).json({ error: 'server_error' })
    }
})

// Search stores with filters
router.get('/stores', async (req, res) => {
    try {
        const {
            location,
            category,
            minRating,
            page = '1',
            limit = '12'
        } = req.query

        const pageNum = parseInt(page as string)
        const limitNum = parseInt(limit as string)

        let query = supabaseAdmin
            .from('stores')
            .select('*', { count: 'exact' })
            .range((pageNum - 1) * limitNum, pageNum * limitNum - 1)

        if (location) {
            query = query.or(`city.ilike.%${location}%,address.ilike.%${location}%`)
        }

        if (category) {
            query = query.ilike('metadata->>storeType', `%${category}%`)
        }

        const { data: stores, error, count } = await query

        if (error) {
            return res.status(500).json({ error: 'search_failed', message: error.message })
        }

        const ownerIds = Array.from(
            new Set((stores || []).map((s: any) => s.owner_user_id || s.user_id).filter(Boolean))
        )
        const ownerById = new Map<string, any>()
        if (ownerIds.length > 0) {
            const { data: owners } = await supabaseAdmin
                .from('profiles')
                .select('id, full_name, email, phone, metadata, is_approved')
                .in('id', ownerIds)

            for (const owner of owners || []) {
                ownerById.set(owner.id, owner)
            }
        }

        const minRatingNum = minRating ? Number(minRating) : 0

        // Format stores
        const formattedStores = (stores || [])
            .map((store: any) => {
                const ownerId = store.owner_user_id || store.user_id
                const owner = ownerById.get(ownerId)
                return {
                    id: store.id,
                    userId: ownerId,
                    storeName: store.name,
                    description: store.description,
                    brands: store.brands || [],
                    city: store.city,
                    address: store.address,
                    rating: Number(store.metadata?.rating || 0),
                    totalProducts: 0,
                    owner: {
                        fullName: owner?.full_name || '',
                        email: owner?.email || '',
                        phone: owner?.phone || ''
                    },
                    approved: owner?.metadata?.approval_status === 'approved' || owner?.is_approved === true
                }
            })
            .filter((store: any) => store.approved && store.rating >= minRatingNum)

        return res.json({
            stores: formattedStores,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: count || 0,
                pages: Math.ceil((count || 0) / limitNum)
            }
        })
    } catch (error) {
        console.error('Error searching stores:', error)
        return res.status(500).json({ error: 'server_error' })
    }
})

export default router
