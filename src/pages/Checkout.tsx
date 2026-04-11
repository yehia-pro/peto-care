import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'
import { ShoppingBag, ArrowRight, CreditCard, Truck, Banknote, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { ordersAPI } from '../services/api'
import { SafeImage } from '../components/SafeImage'

const Checkout = () => {
    const { items, clearCart, getTotal, getDiscountedTotal, appliedCoupon } = useCartStore()
    const { user } = useAuthStore()
    const navigate = useNavigate()

    const [step, setStep] = useState<'delivery' | 'payment'>('delivery')
    const [deliveryInfo, setDeliveryInfo] = useState({
        fullName: user?.fullName || '',
        phone: '',
        address: '',
        city: '',
        notes: ''
    })
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card')
    const [isProcessing, setIsProcessing] = useState(false)

    const handlePlaceOrder = async () => {
        if (!deliveryInfo.fullName || !deliveryInfo.phone || !deliveryInfo.address || !deliveryInfo.city) {
            toast.error('يرجى ملء جميع الحقول المطلوبة')
            return
        }

        setIsProcessing(true)

        try {
            if (paymentMethod === 'card') {
                // إنشاء جلسة دفع والتوجه لـ Stripe
                const { data } = await ordersAPI.createCheckoutSession({ 
                    shippingAddress: deliveryInfo, 
                    paymentMethod: 'card', 
                    items,
                    couponCode: appliedCoupon ? appliedCoupon.code : undefined
                })
                if (data.url) {
                    // Stripe redirect
                    window.location.href = data.url
                } else {
                    toast.error('لم يتم إرجاع رابط جلسة الدفع')
                    setIsProcessing(false)
                }
            } else {
                // الدفع عند الاستلام
                await ordersAPI.create({
                    shippingAddress: deliveryInfo,
                    paymentMethod: 'cash',
                    items,
                    couponCode: appliedCoupon ? appliedCoupon.code : undefined
                })
                clearCart()
                toast.success('تم تقديم طلبك بنجاح! سنتواصل معك قريباً')
                navigate('/dashboard')
            }
        } catch (error) {
            console.error('Checkout error:', error)
            toast.error('حدث خطأ أثناء معالجة طلبك')
            setIsProcessing(false)
        }
    }

    if (items.length === 0) {
        navigate('/cart')
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">إتمام الطلب</h1>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-center">
                        <div className={`flex items-center ${step === 'delivery' ? 'text-[var(--color-vet-primary)]' : 'text-[var(--color-vet-secondary)]'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === 'delivery' ? 'bg-[var(--color-vet-primary)]' : 'bg-[var(--color-vet-secondary)]'} text-white font-bold`}>
                                {step === 'payment' ? '✓' : '1'}
                            </div>
                            <span className="mr-2 font-medium">معلومات التوصيل</span>
                        </div>
                        <div className="w-24 h-1 bg-gray-300 mx-4"></div>
                        <div className={`flex items-center ${step === 'payment' ? 'text-[var(--color-vet-primary)]' : 'text-gray-400'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step === 'payment' ? 'bg-[var(--color-vet-primary)]' : 'bg-gray-300'} text-white font-bold`}>
                                2
                            </div>
                            <span className="mr-2 font-medium">طريقة الدفع</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {step === 'delivery' ? (
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <MapPin className="w-6 h-6 text-[var(--color-vet-primary)]" />
                                    معلومات التوصيل
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">الاسم الكامل *</label>
                                        <input
                                            type="text"
                                            value={deliveryInfo.fullName}
                                            onChange={(e) => setDeliveryInfo({ ...deliveryInfo, fullName: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                                            placeholder="أدخل اسمك الكامل"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف *</label>
                                        <input
                                            type="tel"
                                            value={deliveryInfo.phone}
                                            onChange={(e) => setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                                            placeholder="01234567890"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">المدينة *</label>
                                        <input
                                            type="text"
                                            value={deliveryInfo.city}
                                            onChange={(e) => setDeliveryInfo({ ...deliveryInfo, city: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                                            placeholder="القاهرة"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">العنوان بالتفصيل *</label>
                                        <textarea
                                            value={deliveryInfo.address}
                                            onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                                            placeholder="الشارع، رقم المبنى، الدور، الشقة..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات (اختياري)</label>
                                        <textarea
                                            value={deliveryInfo.notes}
                                            onChange={(e) => setDeliveryInfo({ ...deliveryInfo, notes: e.target.value })}
                                            rows={2}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                                            placeholder="أي ملاحظات إضافية للتوصيل..."
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        if (!deliveryInfo.fullName || !deliveryInfo.phone || !deliveryInfo.address || !deliveryInfo.city) {
                                            toast.error('يرجى ملء جميع الحقول المطلوبة')
                                            return
                                        }
                                        setStep('payment')
                                    }}
                                    className="w-full mt-6 bg-[var(--color-vet-primary)] text-white py-4 rounded-xl font-bold hover:bg-[var(--color-vet-primary)] transition flex items-center justify-center gap-2"
                                >
                                    التالي: طريقة الدفع
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <CreditCard className="w-6 h-6 text-[var(--color-vet-primary)]" />
                                    طريقة الدفع
                                </h2>

                                <div className="space-y-4 mb-6">
                                    <div
                                        onClick={() => setPaymentMethod('card')}
                                        className={`p-6 border-2 rounded-xl cursor-pointer transition ${paymentMethod === 'card'
                                            ? 'border-[var(--color-vet-primary)] bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'card' ? 'border-[var(--color-vet-primary)]' : 'border-gray-300'
                                                }`}>
                                                {paymentMethod === 'card' && <div className="w-3 h-3 rounded-full bg-[var(--color-vet-primary)]"></div>}
                                            </div>
                                            <CreditCard className="w-8 h-8 text-[var(--color-vet-primary)]" />
                                            <div>
                                                <h3 className="font-bold text-gray-900">البطاقة الائتمانية (Stripe)</h3>
                                                <p className="text-sm text-gray-600">ادفع بأمان باستخدام بطاقتك</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setPaymentMethod('cash')}
                                        className={`p-6 border-2 rounded-xl cursor-pointer transition ${paymentMethod === 'cash'
                                            ? 'border-[var(--color-vet-primary)] bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cash' ? 'border-[var(--color-vet-primary)]' : 'border-gray-300'
                                                }`}>
                                                {paymentMethod === 'cash' && <div className="w-3 h-3 rounded-full bg-[var(--color-vet-primary)]"></div>}
                                            </div>
                                            <Banknote className="w-8 h-8 text-[var(--color-vet-secondary)]" />
                                            <div>
                                                <h3 className="font-bold text-gray-900">الدفع عند الاستلام (COD)</h3>
                                                <p className="text-sm text-gray-600">ادفع نقداً عند استلام طلبك</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-6">
                                    <button
                                        onClick={() => setStep('delivery')}
                                        disabled={isProcessing}
                                        className="flex-1 border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-50 transition"
                                    >
                                        رجوع
                                    </button>
                                    <button
                                        onClick={handlePlaceOrder}
                                        disabled={isProcessing}
                                        className="flex-1 bg-[var(--color-vet-primary)] text-white py-4 rounded-xl font-bold hover:bg-[var(--color-vet-primary)] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                                جاري المعالجة...
                                            </>
                                        ) : paymentMethod === 'card' ? (
                                            <>
                                                المتابعة عبر Stripe
                                                <ArrowRight className="w-5 h-5" />
                                            </>
                                        ) : (
                                            <>
                                                <Truck className="w-5 h-5" />
                                                تأكيد الطلب
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">ملخص الطلب</h2>

                            <div className="space-y-4 mb-6">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-3">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                            {item.imageUrl ? (
                                                <SafeImage src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <ShoppingBag className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900 text-sm">{item.name}</h3>
                                            <p className="text-xs text-gray-500">{item.storeName}</p>
                                            <p className="text-sm font-bold text-[var(--color-vet-primary)] mt-1">
                                                EGP {item.price.toFixed(2)} × {item.quantity}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t pt-4 space-y-3">
                                <div className="flex justify-between text-gray-600">
                                    <span>المجموع الفرعي</span>
                                    <span>EGP {getTotal().toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>رسوم التوصيل</span>
                                    <span className="text-[var(--color-vet-secondary)] font-medium">مجاناً مؤقتاً</span>
                                </div>
                                {appliedCoupon && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>خصم الكود ({appliedCoupon.code})</span>
                                        <span>-EGP {appliedCoupon.discountCalculated.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="border-t pt-3 flex justify-between font-bold text-lg text-gray-900">
                                    <span>الإجمالي</span>
                                    <span className="text-[var(--color-vet-primary)]">EGP {getDiscountedTotal().toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Checkout
