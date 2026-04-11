import { Link } from 'react-router-dom'
import { XCircle, ArrowRight } from 'lucide-react'

const CheckoutCancel = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <XCircle className="w-12 h-12 text-red-500" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">تم إلغاء الدفع</h1>
                <p className="text-gray-600 mb-8">
                    عملية الدفع لم تكتمل. طلبك معلق، يمكنك المحاولة مرة أخرى في أي وقت.
                    لم يتم خصم أي مبالغ.
                </p>
                <div className="flex flex-col gap-4">
                    <Link
                        to="/checkout"
                        className="w-full bg-[var(--color-vet-primary)] text-white px-6 py-3 rounded-xl font-bold hover:bg-[var(--color-vet-primary)] transition flex items-center justify-center gap-2"
                    >
                        إعادة المحاولة
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link
                        to="/cart"
                        className="w-full border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition"
                    >
                        العودة للسلة
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default CheckoutCancel
