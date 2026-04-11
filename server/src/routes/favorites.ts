import express from 'express';
import { requireAuth } from '../middleware/auth';
import User from '../models/User';
import PetStore from '../models/PetStore';
import Service from '../models/Service';
import Disease from '../models/Disease';
import mongoose from 'mongoose';

const router = express.Router();

// Toggle Favorite
router.post('/toggle', requireAuth(), async (req, res) => {
  try {
    const { itemId, itemType } = req.body;

    if (!itemId || !['product', 'service', 'disease'].includes(itemType)) {
      return res.status(400).json({ error: 'Invalid itemId or itemType' });
    }

    const userId = (req as any).user?.id || (req as any).user?.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Initialize if undefined
    if (!user.favorites) {
      user.favorites = [];
    }

    // Check if it already exists
    const existingIndex = user.favorites.findIndex(f => f.itemId.toString() === itemId.toString());

    if (existingIndex >= 0) {
      // Remove it
      user.favorites.splice(existingIndex, 1);
    } else {
      // Add it
      user.favorites.push({ itemId, itemType });
    }

    await user.save();

    res.json({ success: true, favorites: user.favorites });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get My Favorites (Unpopulated)
router.get('/', requireAuth(), async (req, res) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ favorites: user.favorites || [] });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get My Favorites (Populated Details)
router.get('/details', requireAuth(), async (req, res) => {
  try {
    const userId = (req as any).user?.id || (req as any).user?.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const favorites = user.favorites || [];
    
    // Filter only valid ObjectIds to prevent Mongoose CastError from previous mock data
    const validProductIds = favorites
      .filter(f => f.itemType === 'product' && mongoose.Types.ObjectId.isValid(f.itemId))
      .map(f => f.itemId);
      
    const validServiceIds = favorites
      .filter(f => f.itemType === 'service' && mongoose.Types.ObjectId.isValid(f.itemId))
      .map(f => f.itemId);
      
    // const diseaseIds = ...

    let populatedProducts: any[] = [];
    if (validProductIds.length > 0) {
      const stores = await PetStore.find({ "products._id": { $in: validProductIds } });
      stores.forEach(store => {
         const matchingProducts = store.products?.filter(p => validProductIds.includes(p._id?.toString() || '')) || [];
         matchingProducts.forEach(p => {
            populatedProducts.push({
               id: p._id,
               name: p.name,
               description: p.description,
               priceEGP: p.price,
               category: p.category,
               imageUrl: p.imageUrl,
               inStock: p.inStock,
               storeId: store._id,
               storeName: store.storeName,
               itemType: 'product'
            });
         });
      });
    }

    let populatedServices: any[] = [];
    if (validServiceIds.length > 0) {
      const services = await Service.find({ _id: { $in: validServiceIds } });
      populatedServices = services.map(s => ({ ...s.toObject(), id: s._id, itemType: 'service' }));
    }

    // You can populate diseases the same way if needed in the future

    res.json({ 
      products: populatedProducts,
      services: populatedServices
    });
  } catch (error) {
    console.error('Get favorites details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
