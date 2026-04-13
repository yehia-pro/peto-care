import express, { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import MPetStoreModel from '../models/PetStore'
import { JsonDb } from '../utils/jsonDb'

const router = express.Router()
const memStores: any[] = JsonDb.read('stores.json', [])
const memProducts: any[] = JsonDb.read('products.json', [])
const saveStores = () => JsonDb.write('stores.json', memStores)
const saveProducts = () => JsonDb.write('products.json', memProducts)

const listQuerySchema = z.object({
  query: z.object({
    q: z.string().optional(),
    city: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional()
  })
})

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, name, city, page = '1', limit = '20' } = req.query as any
    const skip = (Number(page) - 1) * Number(limit)
    const filter: any = {}
    const search = q || name
    if (search) filter.storeName = { $regex: String(search), $options: 'i' }
    if (city) filter.city = String(city)

    // Try MongoDB first
    try {
      const [items, total] = await Promise.all([
        MPetStoreModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
        MPetStoreModel.countDocuments(filter)
      ])
      return res.json({
        petStores: items,
        pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
      })
    } catch (e) { }

    // Fallback to JSON
    let items = memStores
    if (search) items = items.filter(s => s.storeName.toLowerCase().includes(search.toLowerCase()))
    if (city) items = items.filter(s => s.city === city)
    const total = items.length
    const paginated = items.slice(skip, skip + Number(limit))
    return res.json({
      petStores: paginated,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) }
    })

  } catch (error) {
    next(error)
  }
})

router.get('/profile', requireAuth(['petstore']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user!.id
    try {
      const petStore = await MPetStoreModel.findOne({ userId }).lean()
      if (petStore) return res.json({ petStore })
    } catch (e) { }

    const petStore = memStores.find(s => s.userId === userId)
    if (!petStore) return res.status(404).json({ error: 'not_found' })
    res.json({ petStore })
  } catch (error) {
    next(error)
  }
})

router.get('/stats', requireAuth(['petstore']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user!.id

    let storeId = ''
    let mongoProductsCount = 0
    try {
      const store = await MPetStoreModel.findOne({ userId }).lean() as any
      if (store && !Array.isArray(store)) {
        storeId = store._id.toString()
        mongoProductsCount = Array.isArray(store.products) ? store.products.length : 0
      }
    } catch (e) { }
    if (!storeId) {
      const store = memStores.find(s => s.userId === userId)
      if (store) storeId = store.id
    }

    const totalProducts = mongoProductsCount || memProducts.filter(p => p.storeId === storeId).length

    return res.json({
      stats: {
        productsCount: totalProducts,
        totalProducts,
        rating: 0,
        reviewCount: 0,
        revenue: 0,
        ordersCount: 0
      }
    })
  } catch (error) {
    next(error)
  }
})

const updateSchema = z.object({
  body: z.object({
    storeName: z.string().optional(),
    storeType: z.string().optional(),
    description: z.string().optional(),
    brands: z.union([z.string(), z.array(z.string())]).optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    commercialRegImageUrl: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().optional(),
    whatsapp: z.string().optional(),
    openingTime: z.string().optional(),
    closingTime: z.string().optional(),
    services: z.array(z.string()).optional()
  })
})

router.put('/profile', requireAuth(['petstore']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user!.id
    const body = updateSchema.parse({ body: req.body }).body as any
    // Normalize brands: if string (comma-separated), convert to array
    if (typeof body.brands === 'string') {
      body.brands = body.brands.split(',').map((b: string) => b.trim()).filter(Boolean)
    }

    try {
      const updated = await MPetStoreModel.findOneAndUpdate({ userId }, { $set: body }, { new: true }).lean()
      if (updated) return res.json({ message: 'updated', petStore: updated })
    } catch (e) { }

    const index = memStores.findIndex(s => s.userId === userId)
    if (index === -1) {
      // Create if not exists (fallback)
      const newStore = { id: Math.random().toString(36).slice(2), userId, ...body, createdAt: new Date() }
      memStores.push(newStore)
      saveStores()
      return res.json({ message: 'updated', petStore: newStore })
    }
    memStores[index] = { ...memStores[index], ...body }
    saveStores()
    res.json({ message: 'updated', petStore: memStores[index] })
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'validation_error' })
    next(error)
  }
})

// --- Products Routes ---

router.get('/products', requireAuth(['petstore']), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const store = await MPetStoreModel.findOne({ userId }).lean() as any;
    if (!store) return res.status(404).json({ error: 'store_not_found' });

    // Products are embedded in the PetStore document
    const products = (store.products || []).map((p: any) => ({
      ...p,
      id: p._id ? p._id.toString() : p.id
    }));
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
})

router.post('/products', requireAuth(['petstore']), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const store = await MPetStoreModel.findOne({ userId });
    if (!store) return res.status(404).json({ error: 'store_not_found' });

    const { name, description, price, category, imageUrl, stock } = req.body;
    
    // Explicitly validate variables
    if (!name || isNaN(Number(price))) {
      return res.status(400).json({ error: 'Invalid product data' });
    }

    const stockNum = Number(stock) || 0
    const newProduct = {
      name,
      description: description || '',
      price: Number(price),
      category: category || 'food',
      imageUrl: imageUrl || '',
      stock: stockNum,
      inStock: stockNum > 0
    };

    if (!store.products) store.products = [];
    store.products.push(newProduct as any);
    await store.save();

    res.status(201).json({ product: store.products[store.products.length - 1] });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Server Error' });
  }
})

router.delete('/products/:id', requireAuth(['petstore']), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const productId = req.params.id;

    const store = await MPetStoreModel.findOne({ userId });
    if (!store) return res.status(404).json({ error: 'store_not_found' });

    if (!store.products) return res.status(404).json({ error: 'product_not_found' });

    const initialLength = store.products.length;
    // Remove the product matching the ID
    store.products = store.products.filter(p => {
      const pid = (p as any)._id ? (p as any)._id.toString() : (p as any).id;
      return pid !== productId.toString();
    }) as any;

    if (store.products.length === initialLength) {
        return res.status(404).json({ error: 'product_not_found' });
    }

    await store.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Server error' });
  }
})

// Update product details including sale price
router.put('/products/:id', requireAuth(['petstore']), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const productId = req.params.id;
    const { name, description, price, category, imageUrl, stock, salePrice, saleExpiresAt } = req.body;

    if (!name || isNaN(Number(price))) {
      return res.status(400).json({ error: 'Invalid product data' });
    }

    const store = await MPetStoreModel.findOne({ userId });
    if (!store || !store.products) return res.status(404).json({ error: 'store_not_found' });

    const productIndex = store.products.findIndex(p => {
      const pid = (p as any)._id ? (p as any)._id.toString() : (p as any).id;
      return pid === productId.toString();
    });

    if (productIndex === -1) {
      return res.status(404).json({ error: 'product_not_found' });
    }

    const stockNum = Number(stock) || 0;
    
    // Update fields
    const product = store.products[productIndex] as any;
    product.name = name;
    product.description = description || '';
    product.price = Number(price);
    product.category = category || 'food';
    product.imageUrl = imageUrl || '';
    product.stock = stockNum;
    product.inStock = stockNum > 0;
    
    // Handle Sales Price
    if (salePrice !== undefined && salePrice !== null && Number(salePrice) > 0) {
      product.salePrice = Number(salePrice);
      if (saleExpiresAt) {
        product.saleExpiresAt = new Date(saleExpiresAt);
      }
    } else {
      product.salePrice = undefined;
      product.saleExpiresAt = undefined;
    }

    store.markModified('products');
    await store.save();

    res.json({ product: store.products[productIndex] });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Server Error' });
  }
})

// Toggle product inStock status (owner only)
router.patch('/products/:id/stock', requireAuth(['petstore']), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const productId = req.params.id;
    const { inStock } = req.body;

    const store = await MPetStoreModel.findOne({ userId });
    if (!store) return res.status(404).json({ error: 'store_not_found' });

    const productIndex = store.products?.findIndex(p => {
      const pid = (p as any)._id ? (p as any)._id.toString() : (p as any).id;
      return pid === productId.toString();
    });

    if (productIndex === undefined || productIndex === -1 || !store.products) {
      return res.status(404).json({ error: 'product_not_found' });
    }

    (store.products as any)[productIndex].inStock = inStock;
    store.markModified('products');
    
    await store.save();

    res.json({ success: true, inStock });
  } catch (error: any) {
    console.error('Toggle stock error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
})

// Update product stock quantity (owner only — for restocking)
router.patch('/products/:id/stock-count', requireAuth(['petstore']), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const productId = req.params.id;
    const { stock } = req.body;

    if (stock === undefined || isNaN(Number(stock)) || Number(stock) < 0) {
      return res.status(400).json({ error: 'invalid_stock', message: 'الكمية يجب أن تكون رقماً غير سالب' });
    }

    const store = await MPetStoreModel.findOne({ userId });
    if (!store) return res.status(404).json({ error: 'store_not_found' });

    const productIndex = store.products?.findIndex(p => {
      const pid = (p as any)._id ? (p as any)._id.toString() : (p as any).id;
      return pid === productId.toString();
    });

    if (productIndex === undefined || productIndex === -1 || !store.products) {
      return res.status(404).json({ error: 'product_not_found' });
    }

    const newStock = Number(stock);
    (store.products as any)[productIndex].stock = newStock;
    // إذا أضاف صاحب المتجر كمية جديدة → يُعاد تفعيل المنتج تلقائياً
    (store.products as any)[productIndex].inStock = newStock > 0;
    store.markModified('products');
    await store.save();

    console.log(`📦 تم تحديث مخزون المنتج: ${productId} → ${newStock}`)
    res.json({ success: true, stock: newStock, inStock: newStock > 0 });
  } catch (error: any) {
    console.error('Update stock count error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
})

// Clear ALL products from store (owner only — useful for demo cleanup)
router.delete('/products', requireAuth(['petstore']), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;
    const store = await MPetStoreModel.findOne({ userId });
    if (!store) return res.status(404).json({ error: 'store_not_found' });
    store.products = [] as any;
    await store.save();
    res.json({ success: true, message: 'تم حذف جميع المنتجات' });
  } catch (error) {
    console.error('Clear products error:', error);
    res.status(500).json({ error: 'Server error' });
  }
})



router.get('/search/nearby', async (_req: Request, res: Response) => {
  res.json({ petStores: memStores })
})

// Dynamic :id route must be LAST to avoid catching specific routes like /stats
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    try {
      const petStore = await MPetStoreModel.findById(req.params.id).lean()
      if (petStore) return res.json({ petStore })
    } catch (e) { }

    const petStore = memStores.find(s => s.id === req.params.id)
    if (!petStore) return res.status(404).json({ error: 'not_found' })
    res.json({ petStore })
  } catch (error) {
    next(error)
  }
})

export default router
