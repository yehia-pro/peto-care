import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/authStore'
import { authAPI } from '@/services/api'
import { MapPin, Clock, Phone, Globe, Info, Upload, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

const petStoreSchema = z.object({
  storeName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  businessLicense: z.string().min(3),
  storeType: z.enum(['pet_shop', 'pet_supplies', 'veterinary_pharmacy', 'grooming', 'boarding']),
  description: z.string().optional(),
  address: z.string().min(5),
  city: z.string().min(2),
  country: z.string().min(2),
  phone: z.string().min(8),
  website: z.string().url().optional().or(z.literal('')),
  whatsapp: z.string().optional().or(z.literal('')),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  services: z.array(z.string()).optional(),
  brands: z.array(z.string()).optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional()
})

type PetStoreFormData = z.infer<typeof petStoreSchema>

const PetStoreRegistration: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [formData, setFormData] = useState<PetStoreFormData>({
    storeName: '',
    email: '',
    password: '',
    businessLicense: '',
    storeType: 'pet_shop',
    description: '',
    address: '',
    city: '',
    country: t('governorates.cairo'),
    phone: '',
    website: '',
    whatsapp: '',
    openingTime: '09:00',
    closingTime: '21:00',
    services: [],
    brands: [],
    latitude: '',
    longitude: ''
  })

  const [commercialRegImage, setCommercialRegImage] = useState<File | null>(null)
  const [idFrontImage, setIdFrontImage] = useState<File | null>(null)
  const [idBackImage, setIdBackImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState<Partial<Record<keyof PetStoreFormData, string>>>({})

  const storeTypes = useMemo(() => [
    { value: 'pet_shop', label: t('registration.petStore.types.pet_shop') },
    { value: 'pet_supplies', label: t('registration.petStore.types.pet_supplies') },
    { value: 'veterinary_pharmacy', label: t('registration.petStore.types.veterinary_pharmacy') },
    { value: 'grooming', label: t('registration.petStore.types.grooming') },
    { value: 'boarding', label: t('registration.petStore.types.boarding') }
  ], [t])

  const availableServices = useMemo(() => [
    t('registration.petStore.types.pet_shop'),
    t('registration.petStore.types.pet_supplies'),
    t('registration.petStore.types.grooming'),
    t('registration.petStore.types.boarding'),
    t('products.categories.food'),
    t('products.categories.accessories'),
    t('products.categories.essentials')
  ], [t])

  const governorates = useMemo(() => [
    t('governorates.cairo'), t('governorates.giza'), t('governorates.alexandria'), t('governorates.qalyubia'),
    t('governorates.dakahlia'), t('governorates.sharqia'), t('governorates.gharbia'), t('governorates.monufia'),
    t('governorates.beheira'), t('governorates.kafr_el_sheikh'), t('governorates.damietta'), t('governorates.port_said'),
    t('governorates.ismailia'), t('governorates.suez'), t('governorates.matrouh'), t('governorates.fayoum'),
    t('governorates.beni_suef'), t('governorates.minya'), t('governorates.assiut'), t('governorates.sohag'),
    t('governorates.qena'), t('governorates.luxor'), t('governorates.aswan'), t('governorates.new_valley'),
    t('governorates.red_sea'), t('governorates.north_sinai'), t('governorates.south_sinai')
  ], [t])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof PetStoreFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services?.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...(prev.services || []), service]
    }))
  }

  const handleBrandsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const brands = e.target.value.split(',').map(brand => brand.trim()).filter(Boolean)
    setFormData(prev => ({ ...prev, brands }))
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }))
          toast.success(t('registration.petStore.getCurrentLocation'))
        },
        () => {
          toast.error(t('appointments.errors.location'))
        }
      )
    } else {
      toast.error(t('appointments.errors.generic'))
    }
  }

  const handleNext = () => {
    const result = petStoreSchema.safeParse(formData)
    if (currentStep === 1) {
      if (formData.storeName && formData.email && formData.password && formData.businessLicense) {
        setCurrentStep(2)
      } else {
        toast.error(t('registration.errors.general'))
      }
    } else if (currentStep === 2) {
      if (formData.address && formData.city && formData.country && formData.phone) {
        setCurrentStep(3)
      } else {
        toast.error(t('registration.errors.general'))
      }
    }
  }

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1)
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

    const validation = petStoreSchema.safeParse(formData)
    if (!validation.success) {
      const fieldErrors: any = {}
      validation.error.issues.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0]] = err.message
      })
      setErrors(fieldErrors)
      toast.error(t('registration.errors.general'))
      return
    }

    if (!commercialRegImage) {
      toast.error(t('registration.errors.licenseRequired'))
      return
    }

    if (!idFrontImage || !idBackImage) {
      toast.error('يجب رفع صورة وجه وظهر بطاقة الهوية لتأكيد هوية المتجر')
      return
    }

    setLoading(true)

    try {
      const form = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          form.append(key, value.join(','))
        } else if (value) {
          form.append(key, value)
        }
      })

      form.append('fullName', formData.storeName)
      form.append('role', 'petstore')

      if (commercialRegImage) form.append('commercialRegImage', commercialRegImage)
      if (idFrontImage) form.append('idFrontImage', idFrontImage)
      if (idBackImage) form.append('idBackImage', idBackImage)

      const res = await authAPI.registerMultipart(form)

      if (res.data?.token) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        toast.success(t('registration.messages.success'))
        navigate('/login')
      } else {
        toast.success(t('registration.messages.pending'))
        navigate('/login')
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('registration.errors.general'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-amber-100 rounded-2xl mb-4">
            <CheckCircle2 className="h-8 w-8 text-[var(--color-vet-accent)]" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
            {t('registration.petStore.title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('registration.petStore.subtitle')}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="relative mb-12">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                  ${currentStep >= step
                    ? 'bg-[var(--color-vet-accent)] border-[var(--color-vet-accent)] text-white shadow-lg ring-4 ring-amber-50'
                    : 'bg-white border-gray-300 text-gray-400'}
                `}>
                  {currentStep > step ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <span className="text-lg font-bold">{step}</span>
                  )}
                </div>
                <span className={`mt-2 text-sm font-medium ${currentStep >= step ? 'text-amber-800' : 'text-gray-500'}`}>
                  {t(`registration.petStore.step${step}`)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-amber-900/5 overflow-hidden border border-amber-100/50">
          <div className="p-8 sm:p-12">
            <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-8">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        {t('registration.petStore.storeName')} *
                      </label>
                      <input
                        type="text"
                        name="storeName"
                        value={formData.storeName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-accent)] transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">{t('auth.email')} *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-accent)] transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">{t('auth.password')} *</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-accent)] transition-all"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        {t('registration.petStore.businessLicense')} *
                      </label>
                      <input
                        type="text"
                        name="businessLicense"
                        value={formData.businessLicense}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-accent)] transition-all"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        {t('registration.petStore.storeType')} *
                      </label>
                      <select
                        name="storeType"
                        value={formData.storeType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-accent)] transition-all appearance-none"
                        required
                      >
                        {storeTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        {t('registration.petStore.licenseFile')} *
                      </label>
                      <div className="relative group">
                        <input
                          type="file"
                          accept="application/pdf,image/*"
                          onChange={e => setCommercialRegImage(e.target.files?.[0] || null)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`
                          w-full px-4 py-3 bg-gray-50 border-2 border-dashed rounded-xl flex items-center justify-center gap-3 transition-all
                          ${commercialRegImage ? 'border-[var(--color-vet-accent)] bg-amber-50' : 'border-gray-300 group-hover:border-[var(--color-vet-accent)]'}
                        `}>
                          <Upload className={`h-5 w-5 ${commercialRegImage ? 'text-[var(--color-vet-accent)]' : 'text-gray-400'}`} />
                          <span className="text-sm text-gray-600 truncate">
                            {commercialRegImage ? commercialRegImage.name : t('registration.petStore.licenseFile')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      {t('registration.petStore.description')}
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-accent)] transition-all resize-none"
                      placeholder={t('registration.petStore.descriptionPlaceholder')}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">{t('registration.petStore.idFront')}</label>
                      <div className="relative group">
                        <input type="file" accept="application/pdf,image/*" onChange={e => setIdFrontImage(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className={`w-full px-4 py-3 bg-gray-50 border-2 border-dashed rounded-xl flex items-center justify-center gap-3 transition-all ${idFrontImage ? 'border-[var(--color-vet-accent)] bg-amber-50' : 'border-gray-300 group-hover:border-[var(--color-vet-accent)]'}`}>
                          <Upload className={`h-5 w-5 ${idFrontImage ? 'text-[var(--color-vet-accent)]' : 'text-gray-400'}`} />
                          <span className="text-sm text-gray-600 truncate">{idFrontImage ? idFrontImage.name : t('registration.petStore.idFront')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">{t('registration.petStore.idBack')}</label>
                      <div className="relative group">
                        <input type="file" accept="application/pdf,image/*" onChange={e => setIdBackImage(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className={`w-full px-4 py-3 bg-gray-50 border-2 border-dashed rounded-xl flex items-center justify-center gap-3 transition-all ${idBackImage ? 'border-[var(--color-vet-accent)] bg-amber-50' : 'border-gray-300 group-hover:border-[var(--color-vet-accent)]'}`}>
                          <Upload className={`h-5 w-5 ${idBackImage ? 'text-[var(--color-vet-accent)]' : 'text-gray-400'}`} />
                          <span className="text-sm text-gray-600 truncate">{idBackImage ? idBackImage.name : t('registration.petStore.idBack')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Location & Hours */}
              {currentStep === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        {t('registration.petStore.getCurrentLocation')} *
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-accent)] transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        {t('records.city')} *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-accent)] transition-all"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        {t('common.governorate')} *
                      </label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-accent)] transition-all appearance-none"
                        required
                      >
                        {governorates.map(gov => (
                          <option key={gov} value={gov}>{gov}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        className="w-full h-[50px] bg-amber-50 text-[var(--color-vet-accent)] font-semibold px-4 py-2 rounded-xl border border-amber-200 hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
                      >
                        <MapPin className="h-5 w-5" />
                        {t('registration.petStore.getCurrentLocation')}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">{t('common.phone')} *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-accent)] transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">{t('registration.petStore.openingTime')}</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                        <input
                          type="time"
                          name="openingTime"
                          value={formData.openingTime}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-accent)] transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">{t('registration.petStore.closingTime')}</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                        <input
                          type="time"
                          name="closingTime"
                          value={formData.closingTime}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-accent)] transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Contact & Services */}
              {currentStep === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        {t('registration.petStore.website')}
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                        <input
                          type="url"
                          name="website"
                          value={formData.website}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-accent)] transition-all"
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        {t('registration.petStore.whatsapp')}
                      </label>
                      <input
                        type="tel"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-accent)] transition-all"
                        placeholder="+201234567890"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-gray-700">
                      {t('registration.petStore.services')}
                    </label>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableServices.map(service => (
                        <button
                          key={service}
                          type="button"
                          onClick={() => handleServiceToggle(service)}
                          className={`
                            flex items-center justify-center gap-2 p-3 rounded-xl border transition-all text-sm font-medium
                            ${formData.services?.includes(service)
                              ? 'bg-[var(--color-vet-accent)] border-[var(--color-vet-accent)] text-white shadow-md'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-amber-300 hover:bg-amber-50'}
                          `}
                        >
                          {formData.services?.includes(service) && <CheckCircle2 className="h-4 w-4" />}
                          {service}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                    <div className="flex gap-4">
                      <AlertCircle className="h-6 w-6 text-[var(--color-vet-primary)] shrink-0" />
                      <div>
                        <h3 className="text-base font-bold text-blue-900 mb-1">
                          {t('registration.petStore.importantNoteBody')}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-8 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="px-8 py-3 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {t('common.previous')}
                </button>

                <div className="flex gap-4">
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-8 py-3 bg-[var(--color-vet-accent)] text-white font-bold rounded-xl hover:bg-[var(--color-vet-accent)] shadow-lg shadow-amber-600/20 active:scale-95 transition-all"
                    >
                      {t('common.next')}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-12 py-3 bg-[var(--color-vet-accent)] text-white font-bold rounded-xl hover:bg-[var(--color-vet-accent)] shadow-lg shadow-amber-600/30 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          {t('registration.messages.registering')}
                        </>
                      ) : (
                        t('common.register')
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PetStoreRegistration
