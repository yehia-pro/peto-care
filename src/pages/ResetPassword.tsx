import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authAPI } from '@/services/api'
import { Lock, CheckCircle } from 'lucide-react'
import { Toaster, toast } from 'sonner'

const ResetPassword: React.FC = () => {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')
    const navigate = useNavigate()

    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!token) {
            toast.error('رابط غير صالح')
            return
        }

        if (!newPassword || !confirmPassword) {
            toast.error('يرجى إدخال جميع الحقول')
            return
        }

        if (newPassword.length < 6) {
            toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error('كلمتا المرور غير متطابقتين')
            return
        }

        setLoading(true)
        try {
            await authAPI.resetPassword(token, newPassword)
            setSuccess(true)
            toast.success('تم تغيير كلمة المرور بنجاح')
            setTimeout(() => navigate('/login'), 2000)
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'حدث خطأ، يرجى المحاولة لاحقاً')
        } finally {
            setLoading(false)
        }
    }

    if (!token) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-accent-50 to-secondary-50 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-neutral-50 border border-neutral-200 rounded-2xl shadow-xl p-8 text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">رابط غير صالح</h1>
                    <p className="text-neutral-600 mb-6">الرابط المستخدم غير صالح أو منتهي الصلاحية</p>
                    <button
                        onClick={() => navigate('/forgot-password')}
                        className="bg-secondary-600 text-white py-2 px-6 rounded-lg hover:bg-secondary-700 transition-colors"
                    >
                        طلب رابط جديد
                    </button>
                </div>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-accent-50 to-secondary-50 flex items-center justify-center px-4">
                <Toaster position="top-center" />
                <div className="max-w-md w-full bg-neutral-50 border border-neutral-200 rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-[var(--color-vet-secondary)]" />
                    </div>
                    <h1 className="text-2xl font-bold text-neutral-800 mb-2">تم بنجاح!</h1>
                    <p className="text-neutral-600">تم تغيير كلمة المرور بنجاح. جاري التوجيه لصفحة تسجيل الدخول...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-accent-50 to-secondary-50 flex items-center justify-center px-4">
            <Toaster position="top-center" />
            <div className="max-w-md w-full bg-neutral-50 border border-neutral-200 rounded-2xl shadow-xl p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-secondary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-neutral-800 mb-2">تعيين كلمة مرور جديدة</h1>
                    <p className="text-neutral-600">أدخل كلمة المرور الجديدة لحسابك</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">كلمة المرور الجديدة</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="block w-full px-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                            placeholder="أدخل كلمة المرور الجديدة"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">تأكيد كلمة المرور</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="block w-full px-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
                            placeholder="أعد إدخال كلمة المرور"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-secondary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-secondary-700 focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default ResetPassword
