import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { SafeImage } from '../components/SafeImage';
import { useState } from 'react';
import { toast } from 'sonner';

const Cart = () => {
  const { items, removeItem, updateQuantity, getTotal, getDiscountedTotal, appliedCoupon, applyCoupon, removeCoupon } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [discountCode, setDiscountCode] = useState('');
  const [loadingDiscount, setLoadingDiscount] = useState(false);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setLoadingDiscount(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ code: discountCode, orderAmount: getTotal() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        applyCoupon({
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountCalculated: data.discountCalculated
        });
        toast.success(`تم تطبيق الخصم بنجاح! تم توفير ${data.discountCalculated} EGP`);
      } else {
        toast.error(data.message || 'الكود غير صالح أو منتهي الصلاحية');
        removeCoupon();
      }
    } catch (e) {
      toast.error('حدث خطأ أثناء فحص الكود');
    } finally {
      setLoadingDiscount(false);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate('/login?redirect=/cart');
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
          <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-[var(--color-vet-primary)]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8">Looks like you haven't added any products yet.</p>
          <Link
            to="/products"
            className="block w-full bg-[var(--color-vet-primary)] text-white py-3 rounded-xl font-semibold hover:bg-[var(--color-vet-primary)] transition flex items-center justify-center gap-2"
          >
            Start Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-[var(--color-vet-primary)]" />
          Shopping Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm p-6 flex gap-6 items-center">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.imageUrl ? (
                    <SafeImage src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-gray-500 text-sm">{item.storeName}</p>
                  <div className="mt-2 font-bold text-[var(--color-vet-primary)]">${item.price.toFixed(2)}</div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 rounded-full hover:bg-gray-100 text-gray-600"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.maxStock !== undefined && item.quantity >= item.maxStock}
                    className={`p-1 rounded-full transition ${
                      item.maxStock !== undefined && item.quantity >= item.maxStock
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'hover:bg-gray-100 text-gray-600'
                    }`}
                    title={item.maxStock !== undefined && item.quantity >= item.maxStock ? 'وصلت للحد الأقصى المتاح في المخزن' : ''}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  {item.maxStock !== undefined && item.quantity >= item.maxStock && (
                    <span className="text-xs text-orange-500 font-bold">الحد الأقصى</span>
                  )}
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>${getTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-2">كود الخصم</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-[var(--color-vet-primary)] focus:border-[var(--color-vet-primary)]"
                      placeholder="أدخل الكود هنا"
                      value={discountCode}
                      onChange={e => setDiscountCode(e.target.value)}
                      disabled={loadingDiscount || !!appliedCoupon}
                    />
                    {appliedCoupon ? (
                      <button
                        onClick={removeCoupon}
                        className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                      >
                        إزالة
                      </button>
                    ) : (
                      <button
                        onClick={handleApplyDiscount}
                        disabled={loadingDiscount || !discountCode.trim()}
                        className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                      >
                        {loadingDiscount ? 'جاري الفحص...' : 'تطبيق'}
                      </button>
                    )}
                  </div>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 font-medium bg-green-50 px-3 py-2 rounded-lg mt-2 text-sm">
                    <span>خصم الكود ({appliedCoupon.code})</span>
                    <span>-${appliedCoupon.discountCalculated.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t pt-4 flex justify-between font-bold text-lg text-gray-900">
                  <span>Total</span>
                  <span>${getDiscountedTotal().toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full bg-[var(--color-vet-primary)] text-white py-4 rounded-xl font-bold hover:bg-[var(--color-vet-primary)] transition flex items-center justify-center gap-2"
              >
                الانتقال للدفع
                <ArrowRight className="w-5 h-5" />
              </button>

              <p className="mt-4 text-xs text-center text-gray-500">
                Secure checkout powered by Stripe
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;