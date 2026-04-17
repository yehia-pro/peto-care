import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../middleware/validate'
import { requireAuth } from '../middleware/auth'
import { supabaseAdmin } from '../lib/supabase'

const router = Router()

const addToCartSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),
    quantity: z.number().min(1),
    price: z.number().min(0),
    name: z.string(),
    image: z.string().optional(),
    storeId: z.string().uuid()
  })
})

// Helper to get or create cart for user
async function getOrCreateCart(userId: string) {
  // Try to get existing cart
  const { data: existingCart, error: fetchError } = await supabaseAdmin
    .from('carts')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(`Failed to fetch cart: ${fetchError.message}`)
  }

  if (existingCart) {
    // Get cart items
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('cart_items')
      .select('*')
      .eq('cart_id', existingCart.id)

    if (itemsError) {
      throw new Error(`Failed to fetch cart items: ${itemsError.message}`)
    }

    return { ...existingCart, items: items || [] }
  }

  // Create new cart
  const { data: newCart, error: createError } = await supabaseAdmin
    .from('carts')
    .insert({ user_id: userId })
    .select()
    .single()

  if (createError || !newCart) {
    throw new Error(`Failed to create cart: ${createError?.message || 'Unknown error'}`)
  }

  return { ...newCart, items: [] }
}

// Get user's cart
router.get('/', requireAuth(['user', 'vet']), async (req, res) => {
  try {
    const userId = (req as any).user.id
    const cart = await getOrCreateCart(userId)
    res.json({ cart })
  } catch (error: any) {
    console.error('Get cart error:', error)
    res.status(500).json({ error: 'server_error', message: error.message || 'فشل في جلب السلة' })
  }
})

// Add item to cart
router.post('/add', requireAuth(['user', 'vet']), validate(addToCartSchema), async (req, res) => {
  try {
    const userId = (req as any).user.id
    const { productId, quantity, price, name, image, storeId } = req.body

    const cart = await getOrCreateCart(userId)

    // Check if item already exists in cart
    const { data: existingItem, error: checkError } = await supabaseAdmin
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', productId)
      .maybeSingle()

    if (checkError) {
      throw new Error(`Failed to check existing item: ${checkError.message}`)
    }

    if (existingItem) {
      // Update quantity
      const { error: updateError } = await supabaseAdmin
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id)

      if (updateError) {
        throw new Error(`Failed to update item: ${updateError.message}`)
      }
    } else {
      // Insert new item
      const { error: insertError } = await supabaseAdmin
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_id: productId,
          store_id: storeId,
          quantity,
          price,
          name,
          image_url: image
        })

      if (insertError) {
        throw new Error(`Failed to add item: ${insertError.message}`)
      }
    }

    // Return updated cart
    const updatedCart = await getOrCreateCart(userId)
    res.json({ cart: updatedCart })
  } catch (error: any) {
    console.error('Add to cart error:', error)
    res.status(500).json({ error: 'server_error', message: error.message || 'فشل في إضافة المنتج للسلة' })
  }
})

// Remove item from cart
router.delete('/remove/:productId', requireAuth(['user', 'vet']), async (req, res) => {
  try {
    const userId = (req as any).user.id
    const { productId } = req.params

    const cart = await getOrCreateCart(userId)
    if (!cart || cart.items.length === 0) {
      return res.status(404).json({ error: 'cart_empty', message: 'السلة فارغة' })
    }

    // Delete the item
    const { error: deleteError } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id)
      .eq('product_id', productId)

    if (deleteError) {
      throw new Error(`Failed to remove item: ${deleteError.message}`)
    }

    // Return updated cart
    const updatedCart = await getOrCreateCart(userId)
    res.json({ cart: updatedCart })
  } catch (error: any) {
    console.error('Remove from cart error:', error)
    res.status(500).json({ error: 'server_error', message: error.message || 'فشل في حذف المنتج من السلة' })
  }
})

// Clear cart (used after successful order)
router.post('/clear', requireAuth(['user', 'vet']), async (req, res) => {
  try {
    const userId = (req as any).user.id
    const cart = await getOrCreateCart(userId)

    // Delete all items
    const { error: deleteError } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id)

    if (deleteError) {
      throw new Error(`Failed to clear cart: ${deleteError.message}`)
    }

    res.json({ success: true, message: 'تم تفريغ السلة' })
  } catch (error: any) {
    console.error('Clear cart error:', error)
    res.status(500).json({ error: 'server_error', message: error.message || 'فشل في تفريغ السلة' })
  }
})

// Get cart summary (for checkout)
router.get('/summary', requireAuth(['user', 'vet']), async (req, res) => {
  try {
    const userId = (req as any).user.id
    const cart = await getOrCreateCart(userId)

    // Calculate totals per store
    const storeTotals: Record<string, { storeId: string; items: any[]; total: number }> = {}
    let grandTotal = 0

    for (const item of cart.items) {
      if (!storeTotals[item.store_id]) {
        storeTotals[item.store_id] = { storeId: item.store_id, items: [], total: 0 }
      }
      storeTotals[item.store_id].items.push(item)
      const itemTotal = Number(item.price) * Number(item.quantity)
      storeTotals[item.store_id].total += itemTotal
      grandTotal += itemTotal
    }

    res.json({
      items: cart.items,
      storeBreakdown: Object.values(storeTotals),
      totalAmount: grandTotal,
      itemCount: cart.items.length
    })
  } catch (error: any) {
    console.error('Cart summary error:', error)
    res.status(500).json({ error: 'server_error', message: error.message || 'فشل في جلب ملخص السلة' })
  }
})

export default router
