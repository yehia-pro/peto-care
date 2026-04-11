import React, { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { Mail } from 'lucide-react'
import { Toaster, toast } from 'sonner'

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('')
  const { resetPassword, loading } = useAuthStore()
  const { t } = useLanguageStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { toast.error('يرجى إدخال البريد الإلكتروني'); return }
    try {
      await resetPassword(email)
      toast.success('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك')
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || 'فشل إرسال الرابط'
      toast.error(errorMsg)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-accent-50 to-secondary-50 flex items-center justify-center px-4">
      <Toaster position="top-center" />
      <div className="max-w-md w-full bg-neutral-50 border border-neutral-200 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-secondary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">إعادة تعيين كلمة المرور</h1>
          <p className="text-neutral-600">أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
              placeholder={t('placeholders.email')}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-secondary-700 focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ForgotPassword
