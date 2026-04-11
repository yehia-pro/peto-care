import { Router } from 'express'
import mongoose, { Schema } from 'mongoose'
import MUserModel from '../models/User'
import MPetStoreModel from '../models/PetStore'

const router = Router()

// Search vets with filters
router.get('/vets', async (req, res) => {
    try {
        const {
            location,
            specialty,
            minRating,
            page = '1',
            limit = '12',
            sortBy = 'rating'
        } = req.query

        const query: any = { role: 'vet', isApproved: true }

        // Build filter query
        const filters: any = {}

        if (location) {
            // Search in contact field for location/country
            filters.$or = [
                { 'contact': { $regex: location, $options: 'i' } },
                { 'fullName': { $regex: location, $options: 'i' } }
            ]
        }

        if (specialty) {
            filters['contact'] = { $regex: specialty, $options: 'i' }
        }

        // Combine queries
        const finalQuery = { ...query, ...filters }

        // Pagination
        const pageNum = parseInt(page as string)
        const limitNum = parseInt(limit as string)
        const skip = (pageNum - 1) * limitNum

        // Get vets
        let vets = await MUserModel.find(finalQuery)
            .select('fullName email phone contact avatarUrl syndicateCardImageUrl rating reviewCount')
            .skip(skip)
            .limit(limitNum)
            .lean() as any

        // Parse contact JSON and calculate rating
        // Parse contact JSON
        const vetsWithDetails = vets.map((vet: any) => {
            let contactData: any = {}
            try {
                contactData = JSON.parse(vet.contact || '{}')
            } catch (e) { }

            return {
                id: vet._id.toString(),
                fullName: vet.fullName,
                email: vet.email,
                phone: vet.phone,
                avatarUrl: vet.avatarUrl,
                specialization: contactData.specialization || 'عام',
                experienceYears: contactData.experienceYears || 0,
                country: contactData.country || 'مصر',
                qualification: contactData.qualification || '',
                // Initial ratings (will be populated below)
                rating: vet.rating || 0,
                reviewCount: vet.reviewCount || 0
            }
        })

        // Apply rating filter after parsing
        if (minRating) {
            const minRatingNum = parseFloat(minRating as string)
            vets = vets.filter((vet: any) => vet.rating >= minRatingNum)
        }

        // Sort
        if (sortBy === 'rating') {
            vets.sort((a: any, b: any) => b.rating - a.rating)
        } else if (sortBy === 'experience') {
            vets.sort((a: any, b: any) => b.experienceYears - a.experienceYears)
        }

        // Get total count
        const total = await MUserModel.countDocuments(finalQuery)

        return res.json({
            vets,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
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
            limit = '12',
            sortBy = 'rating'
        } = req.query

        const query: any = {}

        // Build filter query
        if (location) {
            query.$or = [
                { city: { $regex: location, $options: 'i' } },
                { address: { $regex: location, $options: 'i' } }
            ]
        }

        if (category) {
            query['products.category'] = { $regex: category, $options: 'i' }
        }

        if (minRating) {
            query.rating = { $gte: parseFloat(minRating as string) }
        }

        // Pagination
        const pageNum = parseInt(page as string)
        const limitNum = parseInt(limit as string)
        const skip = (pageNum - 1) * limitNum

        // Get stores
        let stores = await MPetStoreModel.find(query)
            .skip(skip)
            .limit(limitNum)
            .lean()

        // Get user data for each store
        const storesWithUsers = await Promise.all(
            stores.map(async (store: any) => {
                const user = await MUserModel.findById(store.userId)
                    .select('fullName email phone isApproved')
                    .lean() as any

                if (!user || !user.isApproved) return null

                return {
                    id: store._id.toString(),
                    userId: store.userId,
                    storeName: store.storeName,
                    description: store.description,
                    brands: store.brands,
                    city: store.city,
                    address: store.address,
                    rating: store.rating || 0,
                    totalProducts: store.products?.length || 0,
                    owner: {
                        fullName: user.fullName,
                        email: user.email,
                        phone: user.phone
                    }
                }
            })
        )

        // Filter out null values (unapproved stores)
        const filteredStores = storesWithUsers.filter(s => s !== null)

        // Sort
        if (sortBy === 'rating') {
            filteredStores.sort((a: any, b: any) => b.rating - a.rating)
        } else if (sortBy === 'products') {
            filteredStores.sort((a: any, b: any) => b.totalProducts - a.totalProducts)
        }

        // Get total count
        const total = await MPetStoreModel.countDocuments(query)

        return res.json({
            stores: filteredStores,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        })
    } catch (error) {
        console.error('Error searching stores:', error)
        return res.status(500).json({ error: 'server_error' })
    }
})

export default router
