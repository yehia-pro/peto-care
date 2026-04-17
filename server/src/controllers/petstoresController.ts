import { Request, Response } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { storesRepository, mapStoreRowToPetStore } from '../repositories/storesRepository'
import { storeProductsRepository } from '../repositories/storeProductsRepository'

export const petstoresController = {
  async list(req: Request, res: Response) {
    try {
      const { q, name, city, page = '1', limit = '20' } = req.query as any
      const search = q || name
      const { rows, total } = await storesRepository.listPublic({
        q: search ? String(search) : undefined,
        city: city ? String(city) : undefined,
        page: Number(page) || 1,
        limit: Number(limit) || 20
      })
      const petStores = rows.map(mapStoreRowToPetStore)
      const lim = Number(limit) || 20
      const pg = Number(page) || 1
      return res.json({
        petStores,
        pagination: { page: pg, limit: lim, total, pages: Math.ceil(total / lim) || 1 }
      })
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ error: 'server_error' })
    }
  },

  async profileGet(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const store = await storesRepository.getOrCreateForOwner(userId)
      return res.json({ petStore: mapStoreRowToPetStore(store) })
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ error: 'server_error' })
    }
  },

  async profilePut(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const body: Record<string, unknown> = { ...req.body }
      if (typeof body.brands === 'string') {
        body.brands = String(body.brands)
          .split(',')
          .map((b: string) => b.trim())
          .filter(Boolean)
      }
      const updated = await storesRepository.updateForOwner(userId, body)
      if (!updated) return res.status(404).json({ error: 'not_found' })
      return res.json({ message: 'updated', petStore: mapStoreRowToPetStore(updated) })
    } catch (e: any) {
      console.error(e)
      return res.status(400).json({ error: 'update_failed', message: e.message })
    }
  },

  async stats(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const store = await storesRepository.getByOwnerUserId(userId)
      if (!store) {
        return res.json({
          stats: { productsCount: 0, totalProducts: 0, rating: 0, reviewCount: 0, revenue: 0, ordersCount: 0 }
        })
      }
      const { count: pc } = await supabaseAdmin
        .from('store_products')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
      const { count: oc } = await supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
      const meta = store.metadata || {}
      const productsCount = pc ?? 0
      return res.json({
        stats: {
          productsCount,
          totalProducts: productsCount,
          rating: Number(meta.rating || 0),
          reviewCount: Number(meta.reviewCount || 0),
          revenue: 0,
          ordersCount: oc ?? 0
        }
      })
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ error: 'server_error' })
    }
  },

  async productsList(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const store = await storesRepository.getOrCreateForOwner(userId)
      const products = await storeProductsRepository.listByStoreId(store.id)
      return res.json({ products })
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ error: 'Server Error' })
    }
  },

  async productsCreate(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const { name, description, price, category, imageUrl, stock } = req.body
      if (!name || Number.isNaN(Number(price))) {
        return res.status(400).json({ error: 'Invalid product data' })
      }
      const store = await storesRepository.getOrCreateForOwner(userId)
      const product = await storeProductsRepository.create(store.id, { name, description, price, category, imageUrl, stock })
      return res.status(201).json({ product })
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ error: 'Server Error' })
    }
  },

  async productsDelete(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const productId = req.params.id
      const store = await storesRepository.getByOwnerUserId(userId)
      if (!store) return res.status(404).json({ error: 'store_not_found' })
      await storeProductsRepository.delete(store.id, productId)
      return res.json({ success: true })
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async productsPut(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const productId = req.params.id
      const { name, description, price, category, imageUrl, stock, salePrice, saleExpiresAt } = req.body
      if (!name || Number.isNaN(Number(price))) {
        return res.status(400).json({ error: 'Invalid product data' })
      }
      const store = await storesRepository.getByOwnerUserId(userId)
      if (!store) return res.status(404).json({ error: 'store_not_found' })
      const product = await storeProductsRepository.update(store.id, productId, {
        name,
        description,
        price,
        category,
        imageUrl,
        stock,
        salePrice,
        saleExpiresAt
      })
      return res.json({ product })
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ error: 'Server Error' })
    }
  },

  async productsPatchStock(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const productId = req.params.id
      const { inStock } = req.body
      const store = await storesRepository.getByOwnerUserId(userId)
      if (!store) return res.status(404).json({ error: 'store_not_found' })
      await storeProductsRepository.setInStock(store.id, productId, Boolean(inStock))
      return res.json({ success: true, inStock })
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ error: 'Server error', details: e.message })
    }
  },

  async productsPatchStockCount(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const productId = req.params.id
      const { stock } = req.body
      if (stock === undefined || Number.isNaN(Number(stock)) || Number(stock) < 0) {
        return res.status(400).json({ error: 'invalid_stock', message: 'الكمية يجب أن تكون رقماً غير سالب' })
      }
      const store = await storesRepository.getByOwnerUserId(userId)
      if (!store) return res.status(404).json({ error: 'store_not_found' })
      const row = await storeProductsRepository.setStockCount(store.id, productId, Number(stock))
      return res.json({ success: true, stock: row.stock, inStock: row.inStock })
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ error: 'Server error', details: e.message })
    }
  },

  async productsDeleteAll(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id
      const store = await storesRepository.getByOwnerUserId(userId)
      if (!store) return res.status(404).json({ error: 'store_not_found' })
      await storeProductsRepository.deleteAllForStore(store.id)
      return res.json({ success: true, message: 'تم حذف جميع المنتجات' })
    } catch (e: any) {
      console.error(e)
      return res.status(500).json({ error: 'Server error' })
    }
  },

  async searchNearby(_req: Request, res: Response) {
    try {
      const { rows } = await storesRepository.listPublic({ page: 1, limit: 100 })
      return res.json({ petStores: rows.map(mapStoreRowToPetStore) })
    } catch (e: any) {
      return res.status(500).json({ error: 'server_error' })
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const store = await storesRepository.getById(req.params.id)
      if (!store) return res.status(404).json({ error: 'not_found' })
      return res.json({ petStore: mapStoreRowToPetStore(store) })
    } catch (e: any) {
      return res.status(500).json({ error: 'server_error' })
    }
  }
}
