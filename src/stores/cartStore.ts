import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
  storeId?: string
  storeName?: string
  maxStock?: number  // الحد الأقصى المتاح في المخزن
}

export interface AppliedCoupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountCalculated: number;
}

interface CartState {
  items: CartItem[]
  appliedCoupon: AppliedCoupon | null;
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getDiscountedTotal: () => number
  getItemCount: () => number
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedCoupon: null,
      addItem: (item) => {
        const existingItem = get().items.find(i => i.id === item.id)
        if (existingItem) {
          const max = item.maxStock ?? existingItem.maxStock
          // لا تزيد الكمية لو وصلنا لحد المخزن
          if (max !== undefined && existingItem.quantity >= max) return
          set({
            items: get().items.map(i =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1, maxStock: max } : i
            )
          })
        } else {
          set({ items: [...get().items, { ...item, quantity: 1 }] })
        }
      },
      removeItem: (id) => {
        set({ items: get().items.filter(i => i.id !== id) })
      },
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
        } else {
          const item = get().items.find(i => i.id === id)
          // لا تتجاوز حد المخزن
          const max = item?.maxStock
          const safeQty = (max !== undefined) ? Math.min(quantity, max) : quantity
          set({
            items: get().items.map(i =>
              i.id === id ? { ...i, quantity: safeQty } : i
            )
          })
        }
      },
      clearCart: () => set({ items: [], appliedCoupon: null }),
      getTotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0)
      },
      getDiscountedTotal: () => {
        const total = get().getTotal()
        const coupon = get().appliedCoupon
        if (!coupon) return total
        if (coupon.discountType === 'percentage') {
          return Math.max(0, total - (total * coupon.discountValue) / 100);
        } else {
          return Math.max(0, total - coupon.discountValue);
        }
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
      applyCoupon: (coupon) => set({ appliedCoupon: coupon }),
      removeCoupon: () => set({ appliedCoupon: null }),
    }),
    {
      name: 'cart-storage',
    }
  )
)








