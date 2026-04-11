import { useState, useEffect, useMemo } from 'react'
import { Heart, MapPin, Award, Phone, Mail, Star, Calendar, MessageCircle, Sparkles, X, Search, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { vetsAPI } from '@/services/api'
import api from '@/services/api'
import ReviewForm from '@/components/ReviewForm'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'

interface Vet {
  id: string
  fullName: string
  specialization: string
  country: string
  clinicName: string
  yearsOfExperience: number
  rating: number
  phone: string
  email: string
  isVerified: boolean
  image?: string
  consultationFee?: number
  discountedFee?: number
  clinicAddress?: string
  governorate?: string
  phoneNumbers?: { number: string; label: string }[]
}

const mockVets: Vet[] = []

export default function GlobalVets() {
  const { t, i18n } = useTranslation()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [vets, setVets] = useState<Vet[]>(mockVets)
  const [filteredVets, setFilteredVets] = useState<Vet[]>(mockVets)
  const [selectedCountry, setSelectedCountry] = useState(t('common.all'))
  const [selectedSpecialization, setSelectedSpecialization] = useState(t('common.all'))
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVetForAppointment, setSelectedVetForAppointment] = useState<Vet | null>(null)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [appointmentMessage, setAppointmentMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [expandedPhoneVetId, setExpandedPhoneVetId] = useState<string | null>(null)
  const [ratingModalVetId, setRatingModalVetId] = useState<string | null>(null)

  const countries = useMemo(() => {
    const list = t('auth.countries', { returnObjects: true }) as Record<string, string>
    return [t('common.all'), ...Object.values(list)]
  }, [t])

  const specializations = useMemo(() => {
    const list = t('customerServices.specializations.list', { returnObjects: true }) as Record<string, string>
    return [t('common.all'), ...Object.values(list)]
  }, [t])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const qSpec = params.get('specialization')
    const qCountry = params.get('country')
    if (qSpec) setSelectedSpecialization(qSpec)
    if (qCountry) setSelectedCountry(qCountry)

    const fetchVets = async () => {
      try {
        const fetchParams: any = {}
        // Use 'city' param for governorate filtering since we replaced country list
        if (selectedCountry !== t('common.all')) fetchParams.city = selectedCountry
        if (selectedSpecialization !== t('common.all')) fetchParams.specialization = selectedSpecialization
        if (searchTerm) fetchParams.name = searchTerm

        const res = await vetsAPI.getVets(fetchParams)
        const data = Array.isArray(res.data?.vets) ? res.data.vets : []
        const normalized = data.map((v: any) => ({
          id: v.id,
          fullName: v.user?.fullName || v.fullName || v.clinicName || 'Unknown Vet',
          specialization: v.specialization || 'General',
          country: v.country || 'Egypt',
          clinicName: v.clinicName || 'Vet Clinic',
          yearsOfExperience: Number(v.yearsOfExperience) || 0,
          rating: Number(v.rating) || 0,
          phone: v.phone || '',
          email: v.user?.email || v.email || '',
          isVerified: v.verified || v.isVerified || false,
          consultationFee: v.consultationFee,
          discountedFee: v.discountedFee,
          clinicAddress: v.clinicAddress,
          governorate: v.governorate,
          workHours: v.workHours, // Safe access
          image: v.avatarUrl || v.image,
          phoneNumbers: v.phoneNumbers || []
        })) as Vet[]
        setVets(normalized)
        setFilteredVets(normalized)
      } catch (err) {
        console.error('Failed to fetch vets:', err)
        // Fallback to mock data to prevent empty page crash
        const mock: Vet[] = [
          { id: 'mock1', fullName: 'د. أحمد محمد', specialization: 'جراحة', country: 'مصر', city: 'القاهرة', clinicName: 'عيادة الرحمة', yearsOfExperience: 10, rating: 4.8, phone: '01000000000', email: 'test@test.com', isVerified: true, consultationFee: 200, workHours: '10:00 ص - 8:00 م', phoneNumbers: [{ number: '01000000000', label: 'رقم العيادة' }] } as any
        ]
        setVets(mock)
        setFilteredVets(mock)
      }
    }
    fetchVets()
  }, [selectedCountry, selectedSpecialization, searchTerm, t, location.search])

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${index < Math.floor(rating) ? 'text-[var(--color-vet-accent)] fill-current' : 'text-gray-300'}`}
      />
    ))
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent mb-4">
            {t('nav.globalVets')}
          </h2>
          <p className="text-xl text-neutral-700 max-w-2xl mx-auto">
            {t('home.vets.subtitle')}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-primary-200 p-6 mb-8 card-3d">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-neutral-700 mb-2">
                {t('common.search')}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <input
                  type="text"
                  id="search"
                  placeholder={t('common.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
                />
              </div>
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-neutral-700 mb-2">
                {t('auth.country')}
              </label>
              <select
                id="country"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-4 py-3 border-2 border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
              >
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-neutral-700 mb-2">
                {t('vet.registration.specialization')}
              </label>
              <select
                id="specialization"
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                className="w-full px-4 py-3 border-2 border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300"
              >
                {specializations.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl shadow-lg p-6 text-center card-3d border border-primary-200">
            <div className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent mb-2">{vets.length}</div>
            <div className="text-neutral-700 font-medium">{t('nav.vets')}</div>
          </div>
          <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-2xl shadow-lg p-6 text-center card-3d border border-secondary-200">
            <div className="text-4xl font-bold bg-gradient-to-r from-secondary-600 to-secondary-700 bg-clip-text text-transparent mb-2">{countries.length - 1}</div>
            <div className="text-neutral-700 font-medium">{t('vet.governorates')}</div>
          </div>
          <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-2xl shadow-lg p-6 text-center card-3d border border-accent-200">
            <div className="text-4xl font-bold bg-gradient-to-r from-accent-600 to-accent-700 bg-clip-text text-transparent mb-2">
              {vets.length > 0 ? (vets.reduce((acc, vet) => acc + vet.rating, 0) / vets.length).toFixed(1) : '0.0'}
            </div>
            <div className="text-neutral-700 font-medium">{t('reviews.rating')}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVets.map(vet => (
            <div key={vet.id} className="group bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 card-3d border border-primary-200 overflow-hidden flex flex-col">
              <div className="relative h-48 bg-gray-100 overflow-hidden">
                <div 
                  className="absolute inset-0 bg-cover bg-center blur-xl scale-125 opacity-40 transition-transform duration-500 group-hover:scale-150"
                  style={{ backgroundImage: `url(${vet.image || "https://placehold.co/600x400?text=Vet+Image"})` }}
                />
                <img
                  src={vet.image || "https://placehold.co/600x400?text=Vet+Image"}
                  alt={vet.fullName}
                  className="relative w-full h-full object-contain transition-transform duration-500 group-hover:scale-110 drop-shadow-2xl"
                />
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-black/60 opacity-60"></div>
                {vet.consultationFee !== undefined && vet.consultationFee > 0 && (
                  <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg px-3 py-1 shadow-lg border border-primary-100">
                    <div className="flex flex-col items-center">
                      {vet.discountedFee && vet.discountedFee > 0 && vet.discountedFee < vet.consultationFee ? (
                        <>
                          <span className="text-xs text-red-500 line-through decoration-red-500">{vet.consultationFee} ج.م</span>
                          <span className="text-sm font-bold text-[var(--color-vet-secondary)]">{vet.discountedFee} ج.م</span>
                        </>
                      ) : (
                        <span className="text-sm font-bold text-primary-600">{vet.consultationFee} ج.م</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 flex-grow flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-neutral-800 group-hover:text-primary-600 transition-colors">{vet.fullName}</h3>
                    <p className="text-sm text-neutral-600">{vet.specialization}</p>
                  </div>
                  {vet.isVerified && (
                    <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-full p-2 shadow-lg" title="طبيب موثق">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>

                <div className="space-y-3 mb-4 flex-grow">
                  <div className="flex items-start space-x-2 text-sm text-neutral-700">
                    <MapPin className="h-4 w-4 text-primary-600 mt-1 flex-shrink-0" />
                    <span className="line-clamp-2">{vet.clinicAddress || vet.governorate || vet.country}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-neutral-700">
                    <Heart className="h-4 w-4 text-secondary-600" />
                    <span>{vet.clinicName}</span>
                  </div>
                  {/* Added Consultation Fee */}
                  <div className="flex items-center space-x-2 text-sm text-neutral-700">
                    <span className="font-bold text-primary-600">{t('vet.consultationFee')}</span>
                    <span>{vet.discountedFee ? (
                      <>
                        <span className="line-through text-red-400 ml-2">{vet.consultationFee}</span>
                        <span className="text-[var(--color-vet-secondary)] font-bold">{vet.discountedFee}</span>
                      </>
                    ) : (
                      <span>{vet.consultationFee ? `${vet.consultationFee}` : t('vet.notSpecified')}</span>
                    )}</span>
                  </div>
                  {/* Added Work Hours placeholder if available */}
                  <div className="flex items-center space-x-2 text-sm text-neutral-700">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{vet['workHours'] || '9:00 ص - 5:00 م'}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-neutral-700">
                    <span>{t('vet.registration.experience')}: {vet.yearsOfExperience} {t('common.years')}</span>
                  </div>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-1">
                      {renderStars(vet.rating)}
                      <span className="text-sm text-neutral-600">({vet.rating})</span>
                    </div>
                    <button 
                      onClick={() => setRatingModalVetId(vet.id)}
                      className="text-sm text-primary-600 hover:underline font-medium"
                    >
                      {t('vet.rateDoctor')}
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-neutral-100">

                  {/* New "Request Consultation" button */}
                  <button
                    onClick={() => {
                      if (!user) {
                        toast.error(t('auth.pleaseLogin'))
                        navigate('/login')
                        return
                      }
                      // Navigate to Customer Services with vet info to fill form
                      navigate(`/services?vetId=${vet.id}&vetName=${encodeURIComponent(vet.fullName)}`)
                    }}
                    className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-2 px-4 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>{t('vet.requestConsultation')}</span>
                  </button>

                  <div className="grid grid-cols-1 gap-2 pt-2 border-t border-neutral-100">
                    <button
                      onClick={() => setExpandedPhoneVetId(expandedPhoneVetId === vet.id ? null : vet.id)}
                      className="w-full bg-gradient-to-r from-secondary-500 to-secondary-600 text-white py-2 px-4 rounded-xl hover:from-secondary-600 hover:to-secondary-700 transition-all duration-300 transform hover:scale-105 shadow-md flex items-center justify-center space-x-2"
                    >
                      <Phone className="h-4 w-4" />
                      <span className="text-sm font-bold">{t('emergency.callNow')}</span>
                    </button>
                    {expandedPhoneVetId === vet.id && (
                      <div className="w-full bg-neutral-50 rounded-xl border border-neutral-200 p-2 mt-2 space-y-2 animate-fadeIn shadow-inner">
                        <div className="text-xs text-neutral-500 text-center mb-2 font-medium">{t('vet.chooseNumberToCall')}</div>
                        {(vet.phoneNumbers && vet.phoneNumbers.length > 0) ? (
                          vet.phoneNumbers.map((p, idx) => (
                            <button
                              key={idx}
                              onClick={() => window.location.href = `tel:${p.number}`}
                              className="w-full text-right flex justify-between items-center bg-white hover:bg-neutral-100 p-3 rounded-lg transition-colors border border-neutral-100 shadow-sm"
                            >
                              <span className="font-bold text-neutral-800" dir="ltr">{p.number}</span>
                              <span className="text-xs bg-secondary-50 text-secondary-700 px-2 py-1 rounded-md">{p.label}</span>
                            </button>
                          ))
                        ) : (
                          <button
                            onClick={() => window.location.href = `tel:${vet.phone}`}
                            className="w-full text-right flex justify-between items-center bg-white hover:bg-neutral-100 p-3 rounded-lg transition-colors border border-neutral-100 shadow-sm"
                          >
                            <span className="font-bold text-neutral-800" dir="ltr">{vet.phone}</span>
                            <span className="text-xs bg-secondary-50 text-secondary-700 px-2 py-1 rounded-md">{t('vet.clinicNumber')}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredVets.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full p-6 inline-block mb-4 card-3d">
              <Heart className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-neutral-800 mb-2">{t('common.noResults')}</h3>
            <p className="text-neutral-600">{t('common.search')}</p>
          </div>
        )}
      </div>



      {ratingModalVetId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full relative overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 flex justify-between items-center text-white">
              <h3 className="text-xl font-bold">{t('vet.rateVetTitle')}</h3>
              <button onClick={() => setRatingModalVetId(null)} className="text-white hover:text-neutral-200 transition-colors bg-white/10 rounded-full p-1">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <ReviewForm 
                vetId={ratingModalVetId} 
                onSubmit={async (review) => {
                  try {
                    await api.post('/reviews', {
                      targetId: ratingModalVetId,
                      targetType: 'vet',
                      ...review
                    })
                    toast.success(t('vet.ratingSuccess'))
                    setRatingModalVetId(null)
                  } catch (error) {
                    toast.error(t('vet.ratingError'))
                    throw error
                  }
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
