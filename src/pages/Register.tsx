import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, CheckCircle, Stethoscope, Store } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import { supabase } from '../lib/supabase'
const Register = () => {
  const { register: registerUser } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [strength, setStrength] = useState(0)

  const calcStrength = (val: string) => {
    const s = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(val)
      ? 100 : Math.min(100, val.length * 10)
    setStrength(s)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName || !email || !password) {
      toast.error('يرجى ملء جميع الحقول')
      return
    }
    if (password !== confirmPassword) {
      toast.error('كلمة المرور غير متطابقة')
      return
    }
    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    setIsSubmitting(true)
    try {
      await registerUser(email, password, { fullName, role: 'user' })
      toast.success('تم إنشاء الحساب بنجاح! جاري تحويلك...')
      setTimeout(() => navigate('/customer-dashboard'), 500)
    } catch (error: any) {
      if (error?.response?.status === 409 || error?.response?.data?.error === 'email_taken') {
        toast.error('هذا البريد الإلكتروني مسجل بالفعل')
      } else {
        const message = error?.response?.data?.message || error.message || 'حدث خطأ، يرجى المحاولة مرة أخرى'
        toast.error(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const passwordsMatch = confirmPassword && password === confirmPassword

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-accent-50 to-secondary-50 flex items-center justify-center px-4 py-12 relative overflow-hidden" dir="rtl">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-md w-full bg-white/90 backdrop-blur-md border border-neutral-200 rounded-2xl shadow-2xl p-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl transform hover:rotate-6 transition-transform duration-300">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-secondary-600 to-accent-600 bg-clip-text text-transparent mb-2">
            إنشاء حساب جديد
          </h1>
          <p className="text-neutral-500 text-sm">انضم إلينا اليوم</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="mb-4">
            <button
              type="button"
              onClick={async () => {
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: window.location.origin + '/complete-profile',
                  },
                });
                if (error) {
                  toast.error('حدث خطأ أثناء التسجيل بجوجل');
                }
              }}
              className="w-full flex items-center justify-center gap-3 bg-white border border-neutral-300 text-neutral-700 font-bold py-3 px-6 rounded-xl shadow-sm hover:bg-neutral-50 hover:shadow-md transition-all duration-300"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              المتابعة باستخدام جوجل
            </button>
          </div>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-neutral-500">أو</span>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label htmlFor="reg-fullName" className="block text-sm font-medium text-neutral-700 mb-2">
              الاسم الكامل
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                id="reg-fullName"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="block w-full pr-10 pl-3 py-3 border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all hover:border-secondary-400"
                placeholder="الاسم الكامل"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-neutral-700 mb-2">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="block w-full pr-10 pl-3 py-3 border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all hover:border-secondary-400"
                placeholder="example@email.com"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-neutral-700 mb-2">
              كلمة المرور
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); calcStrength(e.target.value) }}
                className="block w-full pr-10 pl-10 py-3 border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all hover:border-secondary-400"
                placeholder="••••••••"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'} className="absolute inset-y-0 left-0 pl-3 flex items-center">
                {showPassword ? <EyeOff className="h-5 w-5 text-neutral-400" /> : <Eye className="h-5 w-5 text-neutral-400" />}
              </button>
            </div>
            {/* Strength bar */}
            {password && (
              <div className="mt-2 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div style={{ width: strength + '%' }} className={`h-full transition-all ${strength >= 100 ? 'bg-green-500' : strength >= 60 ? 'bg-yellow-500' : 'bg-red-400'}`}></div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="reg-confirm" className="block text-sm font-medium text-neutral-700 mb-2">
              تأكيد كلمة المرور
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                id="reg-confirm"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="block w-full pr-10 pl-10 py-3 border-2 border-neutral-300 rounded-xl focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all hover:border-secondary-400"
                placeholder="••••••••"
                required
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} aria-label={showConfirm ? 'إخفاء تأكيد كلمة المرور' : 'إظهار تأكيد كلمة المرور'} className="absolute inset-y-0 left-0 pl-3 flex items-center">
                {showConfirm ? <EyeOff className="h-5 w-5 text-neutral-400" /> : <Eye className="h-5 w-5 text-neutral-400" />}
              </button>
            </div>
            {passwordsMatch && (
              <div className="mt-1.5 text-green-600 text-sm flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                <span>كلمات المرور متطابقة</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-secondary-500 to-accent-500 text-white py-4 px-6 rounded-xl font-bold text-lg hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300"
          >
            {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء حساب'}
          </button>
        </form>

        {/* Login link */}
        <div className="mt-5 text-center">
          <p className="text-sm text-neutral-600">
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="text-secondary-600 hover:text-secondary-700 font-medium">
              تسجيل الدخول
            </Link>
          </p>
        </div>

        {/* Vet / Store Registration Buttons */}
        <div className="mt-8 pt-6 border-t border-neutral-200">
          <p className="text-sm text-neutral-500 text-center mb-4">هل أنت طبيب بيطري أو تمتلك متجراً؟</p>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/vet-registration"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[var(--color-vet-primary)] to-[var(--color-vet-primary)] hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Stethoscope className="w-4 h-4" />
              تسجيل كطبيب
            </Link>
            <Link
              to="/petstore-registration"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-purple-600 to-purple-500 hover:shadow-lg hover:scale-105 transition-all duration-300"
            >
              <Store className="w-4 h-4" />
              تسجيل كمتجر
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
