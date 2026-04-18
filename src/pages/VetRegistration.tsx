import { useState, useMemo } from 'react'
import { authAPI } from '@/services/api'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import {
  User,
  Mail,
  Lock,
  Phone,
  Globe,
  Award,
  Stethoscope,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react'

type VetFormData = {
  fullName: string
  email: string
  password: string
  phone: string
  country: string
  specialization: string
  experienceYears: string
  qualification: string
}

export default function VetRegistration() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  const vetSchema = useMemo(() => z.object({
    fullName: z.string().min(3, t('registration.validation.fullNameMin')),
    email: z.string().email(t('registration.validation.emailInvalid')),
    password: z.string().min(6, t('registration.validation.passwordMin')),
    phone: z.string().min(8, t('registration.validation.phoneMin')),
    country: z.string().min(1, t('registration.validation.countryRequired')),
    specialization: z.string().min(1, t('registration.validation.specializationRequired')),
    experienceYears: z.string().min(1, t('registration.validation.experienceRequired')),
    qualification: z.string().min(10, t('registration.validation.qualificationMin'))
  }), [t])

  const [formData, setFormData] = useState<VetFormData>({
    fullName: '',
    country: '',
    specialization: '',
    experienceYears: '',
    phone: '',
    email: '',
    password: '',
    qualification: ''
  })

  const [syndicateCardImage, setSyndicateCardImage] = useState<File | null>(null)
  const [idFrontImage, setIdFrontImage] = useState<File | null>(null)
  const [idBackImage, setIdBackImage] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof VetFormData, string>>>({})

  const governorates = useMemo(() => [
    t('governorates.cairo'), t('governorates.giza'), t('governorates.alexandria'), t('governorates.qalyubia'),
    t('governorates.dakahlia'), t('governorates.sharqia'), t('governorates.gharbia'), t('governorates.monufia'),
    t('governorates.beheira'), t('governorates.kafr_el_sheikh'), t('governorates.damietta'), t('governorates.port_said'),
    t('governorates.ismailia'), t('governorates.suez'), t('governorates.matrouh'), t('governorates.fayoum'),
    t('governorates.beni_suef'), t('governorates.minya'), t('governorates.assiut'), t('governorates.sohag'),
    t('governorates.qena'), t('governorates.luxor'), t('governorates.aswan'), t('governorates.new_valley'),
    t('governorates.red_sea'), t('governorates.north_sinai'), t('governorates.south_sinai')
  ], [t])

  const specializations = useMemo(() => {
    const list = t('customerServices.specializations.list', { returnObjects: true }) as Record<string, string>
    return Object.values(list)
  }, [t])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let { name, value } = e.target
    if (name === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 11);
    }
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof VetFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const validateFiles = () => {
    if (!syndicateCardImage || !idFrontImage || !idBackImage) {
      toast.error(t('registration.errors.fileRequired'))
      return false
    }
    const allowed = ['application/pdf', 'image/jpeg', 'image/png']
    const files = [syndicateCardImage, idFrontImage, idBackImage]

    for (const f of files) {
      if (f) {
        const sizeMB = f.size / (1024 * 1024)
        if (!allowed.includes(f.type) || sizeMB > 10) {
          toast.error(t('registration.errors.fileInvalid'))
          return false
        }
      }
    }
    return true
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement
      // Prevent form submission on Enter unless it's a textarea or button
      if (target.tagName !== 'TEXTAREA' && target.tagName !== 'BUTTON') {
        e.preventDefault()
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = vetSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: any = {}
      result.error.issues.forEach(err => {
        fieldErrors[err.path[0]] = err.message
      })
      setErrors(fieldErrors)
      toast.error(t('appointments.errors.fillRequired'))
      return
    }

    if (!validateFiles()) return

    setShowConfirmModal(true)
  }

  const confirmSubmit = async () => {
    setShowConfirmModal(false)
    setSubmitting(true)
    try {
      const form = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        form.append(key, value)
      })
      form.append('role', 'vet')

      if (syndicateCardImage) form.append('syndicateCardImage', syndicateCardImage)
      if (idFrontImage) form.append('idFrontImage', idFrontImage)
      if (idBackImage) form.append('idBackImage', idBackImage)

      const res = await authAPI.registerVetMultipart(form)

      if (res.data?.pendingApproval) {
        toast.success(res.data.message || t('registration.messages.pending'))
        navigate('/login')
      } else if (res.data?.token) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        toast.success(t('registration.messages.success'))
        navigate('/login')
      } else {
        toast.success(t('registration.messages.pending'))
        navigate('/login')
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || t('registration.errors.general')
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8" dir={i18n.dir()}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-blue-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-[var(--color-vet-primary)] to-[var(--color-vet-primary)] p-8 text-center text-white relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Stethoscope size={120} />
            </div>
            <h2 className="text-3xl font-bold mb-2">{t('registration.vet.title')}</h2>
            <p className="text-blue-50 opacity-90">{t('registration.vet.subtitle')}</p>
          </div>

          <div className="p-8">
            {/* Note */}
            <div className="mb-8 flex items-start gap-4 bg-amber-50 border-r-4 border-[var(--color-vet-accent)] p-4 rounded-xl text-right">
              <AlertCircle className="text-[var(--color-vet-accent)] shrink-0 mt-1" />
              <p className="text-amber-800 text-sm font-medium leading-relaxed">
                {t('registration.vet.note')}
              </p>
            </div>

            <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-8">
              {/* Basic Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <User size={18} className="text-[var(--color-vet-primary)]" />
                    {t('registration.vet.fullName')} *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder={t('registration.vet.fullNamePlaceholder')}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-transparent transition-all text-right`}
                  />
                  {errors.fullName && <p className="text-xs text-red-500 mt-1 text-right">{errors.fullName}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Mail size={18} className="text-[var(--color-vet-primary)]" />
                    {t('auth.email')} *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t('placeholders.email')}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-transparent transition-all text-right`}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1 text-right">{errors.email}</p>}
                </div>

                {/* Governorate */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Globe size={18} className="text-[var(--color-vet-primary)]" />
                    {t('common.governorate')} *
                  </label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.country ? 'border-red-500 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-transparent transition-all text-right appearance-none`}
                  >
                    <option value="">{t('common.all')}</option>
                    {governorates.map(gov => <option key={gov} value={gov}>{gov}</option>)}
                  </select>
                </div>

                {/* Specialization */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Award size={18} className="text-[var(--color-vet-primary)]" />
                    {t('registration.vet.qualification')} *
                  </label>
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.specialization ? 'border-red-500 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-transparent transition-all text-right appearance-none`}
                  >
                    <option value="">{t('common.all')}</option>
                    {specializations.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Experience Years */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <CheckCircle2 size={18} className="text-[var(--color-vet-primary)]" />
                    {t('registration.vet.experience')} *
                  </label>
                  <input
                    type="number"
                    name="experienceYears"
                    value={formData.experienceYears}
                    onChange={handleInputChange}
                    min="0"
                    placeholder={t('registration.vet.experienceYearsPlaceholder')}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.experienceYears ? 'border-red-500 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-transparent transition-all text-right`}
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Phone size={18} className="text-[var(--color-vet-primary)]" />
                    {t('auth.phone')} *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    maxLength={11}
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder={t('auth.phone')}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-transparent transition-all text-right`}
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Lock size={18} className="text-[var(--color-vet-primary)]" />
                    {t('auth.password')} *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-transparent transition-all text-right`}
                  />
                  {errors.password && <p className="text-xs text-red-500 mt-1 text-right">{errors.password}</p>}
                </div>
              </div>

              {/* Qualification */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FileText size={18} className="text-[var(--color-vet-primary)]" />
                  {t('registration.vet.qualification')} *
                </label>
                <textarea
                  name="qualification"
                  rows={3}
                  value={formData.qualification}
                  onChange={handleInputChange}
                  placeholder={t('registration.vet.qualificationPlaceholder')}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.qualification ? 'border-red-500 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-transparent transition-all text-right`}
                />
              </div>

              {/* File Uploads */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 text-right mb-4 border-b pb-2">
                  {t('registration.petStore.licenseFile')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Syndicate Card */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600 text-right">
                      {t('registration.vet.syndicateCard')}
                    </label>
                    <div className="relative group cursor-pointer">
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={e => setSyndicateCardImage(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className={`p-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${syndicateCardImage ? 'border-[var(--color-vet-secondary)] bg-green-50' : 'border-gray-200 group-hover:border-[var(--color-vet-primary)] group-hover:bg-blue-50'}`}>
                        {syndicateCardImage ? <CheckCircle2 className="text-[var(--color-vet-secondary)]" /> : <Upload className="text-gray-400" />}
                        <span className="text-xs text-gray-500 text-center line-clamp-1">
                          {syndicateCardImage ? syndicateCardImage.name : t('registration.petStore.licenseFile')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ID Front */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600 text-right">
                      {t('registration.petStore.idFront')}
                    </label>
                    <div className="relative group cursor-pointer">
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={e => setIdFrontImage(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className={`p-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${idFrontImage ? 'border-[var(--color-vet-secondary)] bg-green-50' : 'border-gray-200 group-hover:border-[var(--color-vet-primary)] group-hover:bg-blue-50'}`}>
                        {idFrontImage ? <CheckCircle2 className="text-[var(--color-vet-secondary)]" /> : <Upload className="text-gray-400" />}
                        <span className="text-xs text-gray-500 text-center line-clamp-1">
                          {idFrontImage ? idFrontImage.name : t('registration.petStore.licenseFile')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ID Back */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-600 text-right">
                      {t('registration.petStore.idBack')}
                    </label>
                    <div className="relative group cursor-pointer">
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={e => setIdBackImage(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className={`p-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${idBackImage ? 'border-[var(--color-vet-secondary)] bg-green-50' : 'border-gray-200 group-hover:border-[var(--color-vet-primary)] group-hover:bg-blue-50'}`}>
                        {idBackImage ? <CheckCircle2 className="text-[var(--color-vet-secondary)]" /> : <Upload className="text-gray-400" />}
                        <span className="text-xs text-gray-500 text-center line-clamp-1">
                          {idBackImage ? idBackImage.name : t('registration.petStore.licenseFile')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-center justify-end gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <label className="text-sm font-medium text-gray-700 cursor-pointer" htmlFor="terms">
                  {t('registration.vet.terms')}
                </label>
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="w-5 h-5 text-[var(--color-vet-primary)] border-gray-300 rounded focus:ring-[var(--color-vet-primary)]"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-[var(--color-vet-primary)] to-[var(--color-vet-primary)] text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:translate-y-[0px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('registration.messages.registering')}
                    </>
                  ) : (
                    t('common.register')
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="sm:w-1/3 bg-gray-100 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-200 transition-all text-center"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200" dir={i18n.dir()}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative text-center scale-in-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-blue-50 mb-6 border-4 border-white shadow-sm">
              <CheckCircle2 className="h-10 w-10 text-[var(--color-vet-primary)]" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('registration.confirm.title')}</h3>
            
            <p className="text-gray-600 mb-8 leading-relaxed text-sm">{t('registration.confirm.message')}</p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all text-sm"
              >
                {t('registration.confirm.review')}
              </button>
              <button
                type="button"
                onClick={confirmSubmit}
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-[var(--color-vet-primary)] text-white font-bold rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-sm"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('registration.confirm.submitting')}
                  </>
                ) : (
                  t('registration.confirm.submit')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
