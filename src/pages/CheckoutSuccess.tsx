import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, ShoppingBag } from 'lucide-react'
import { useCartStore } from '../stores/cartStore'

const CheckoutSuccess = () => {
    const [searchParams] = useSearchParams()
    const sessionId = searchParams.get('session_id')
    const { clearCart } = useCartStore()

    useEffect(() => {
        // تفريغ السلة فوراً من المتصفح عند الوصول لصفحة النجاح
        clearCart()
    }, [])

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">تم الدفع بنجاح!</h1>
                <p className="text-gray-600 mb-8">
                    شكراً لتسوقك معنا. تم تأكيد طلبك وسنقوم بتجهيزه في أقرب وقت ممكن.
                    رقم الجلسة المرجعي: {sessionId && <span className="font-mono text-xs block text-gray-400 mt-2">{sessionId}</span>}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/dashboard"
                        className="flex-1 bg-[var(--color-vet-primary)] text-white px-6 py-3 rounded-xl font-bold hover:bg-[var(--color-vet-primary)] transition"
                    >
                        متابعة الطلب
                    </Link>
                    <Link
                        to="/products"
                        className="flex-1 border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        التسوق
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default CheckoutSuccess
