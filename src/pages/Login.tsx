import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginInput } from '../utils/validationSchemas'
import { useAuthStore } from '../stores/authStore'
import { Toaster, toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { authAPI } from '../services/api'

const Login = () => {
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: localStorage.getItem('rememberEmail') || '',
      password: ''
    }
  });

  const [remember, setRemember] = useState(!!localStorage.getItem('rememberEmail'));
  const [showPassword, setShowPassword] = useState(false);
  const [captchaId, setCaptchaId] = useState<string | undefined>(undefined);
  const [captchaQuestion, setCaptchaQuestion] = useState<string | undefined>(undefined);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showDemoButtons, setShowDemoButtons] = useState(true);
  const [lockClickCount, setLockClickCount] = useState(0);

  const handleLockClick = () => {
    const newCount = lockClickCount + 1;
    setLockClickCount(newCount);
    if (newCount >= 3) {
      setShowDemoButtons(true);
      toast.success(t('auth.demoEnabled'));
    }
  };

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data.email, data.password, { captchaId, captchaAnswer });
      toast.success(t('auth.loginSuccess'));

      if (remember) localStorage.setItem('rememberEmail', data.email);
      else localStorage.removeItem('rememberEmail');

      const user = useAuthStore.getState().user;
      if (user?.role === 'vet') {
        navigate('/doctor-dashboard');
      } else if (user?.role === 'petstore') {
        navigate('/petstore-dashboard');
      } else if (user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/customer-dashboard');
      }
    } catch (error: any) {
      const code = error?.response?.data?.error;
      if (code === 'invalid_credentials') {
        toast.error(t('auth.invalidCredentials'));
      } else if (code === 'user_not_found') {
        toast.error('هذا الحساب غير موجود');
      } else if (code === 'incorrect_password') {
        toast.error('كلمة المرور غير صحيحة');
      } else if (code === 'account_locked') {
        toast.error(t('auth.accountLocked'));
      } else if (code === 'account_pending_approval') {
        toast.warning('حسابك قيد المراجعة من قبل الإدارة. سيتم إشعارك عبر البريد الإلكتروني بعد الموافقة.');
      } else if (code === 'captcha_required') {
        setCaptchaId(error.response.data.captcha_id);
        setCaptchaQuestion(error.response.data.captcha_question);
        toast.message(t('auth.captchaRequired'));
      } else {
        toast.error(t('auth.loginFailed'));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-accent-50 to-secondary-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      <Toaster position="top-center" />
      <div className="max-w-md w-full bg-white/90 backdrop-blur-md border border-neutral-200 rounded-2xl shadow-2xl p-8 card-3d relative z-10">
        <div className="text-center mb-8">
          <div
            onClick={handleLockClick}
            className="w-20 h-20 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl transform hover:rotate-6 transition-transform duration-300 cursor-pointer active:scale-95"
          >
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-secondary-600 to-accent-600 bg-clip-text text-transparent mb-3">
            {t('auth.login.title')}
          </h1>
          <p className="text-neutral-600 text-lg">{t('auth.login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
              {t('auth.email')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                id="email"
                type="email"
                {...register('email')}
                className={`block w-full pr-10 pl-3 py-3 border-2 rounded-xl focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all duration-300 hover:border-secondary-400 ${errors.email ? 'border-red-500' : 'border-neutral-300'}`}
                placeholder={t('placeholders.email')}
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-500">{t(`validation.${errors.email.message}`)}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
              {t('auth.password')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className={`block w-full pr-10 pl-10 py-3 border-2 rounded-xl focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-all duration-300 hover:border-secondary-400 ${errors.password ? 'border-red-500' : 'border-neutral-300'}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 pl-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-neutral-400" />
                ) : (
                  <Eye className="h-5 w-5 text-neutral-400" />
                )}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-500">{t(`validation.${errors.password.message}`)}</p>}
          </div>

          <div className="flex items-center justify-between">
            <Link
              to="/forgot-password"
              className="text-sm text-secondary-600 hover:text-secondary-700"
            >
              {t('auth.forgotPassword')}
            </Link>
            <label className="flex items-center gap-2 text-sm text-neutral-600">
              <input type="checkbox" checked={remember} onChange={() => setRemember(!remember)} />
              {t('auth.rememberEmail')}
            </label>
          </div>

          {captchaQuestion && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">{t('captcha.title')}</label>
              <div className="flex items-center gap-2">
                <span className="text-neutral-700 text-sm">{captchaQuestion}</span>
                <input value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} className="flex-1 border border-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500" placeholder={t('captcha.required')} />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-secondary-500 to-secondary-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300"
          >
            {isSubmitting ? t('common.loading') : t('auth.login.submit')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            {t('auth.hasAccount')}{' '}
            <Link to="/register" className="text-secondary-600 hover:text-secondary-700 font-medium">
              {t('auth.register')}
            </Link>
          </p>
        </div>

        <div className="mt-10 text-center flex flex-col items-center justify-center space-y-4">
          <p className="text-sm text-neutral-500">
            {t('auth.vetQuestion', 'هل أنت طبيب بيطري أو تملك متجراً؟')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full px-4">
            <Link to="/petstore-registration" className="flex-1 flex items-center justify-center gap-2 text-white font-bold bg-green-600 hover:bg-green-700 px-6 py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-green-500/30 transform hover:-translate-y-1">
              <span>🏪</span>
              {t('auth.registerAsStore', 'التسجيل كمتجر')}
            </Link>
            <Link to="/vet-registration" className="flex-1 flex items-center justify-center gap-2 text-white font-bold bg-blue-600 hover:bg-blue-700 px-6 py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-1">
              <span>👨‍⚕️</span>
              {t('auth.registerAsVet', 'التسجيل كطبيب')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
