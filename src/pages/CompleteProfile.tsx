import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { toast } from 'sonner'
import { Phone, MapPin, Building, Home as HomeIcon, Crosshair } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import api from '../services/api'

// Setup default marker icon for leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const phoneRegex = /^01[0125][0-9]{8}$/;

const GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة', 'الفيوم',
  'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية', 'الوادي الجديد', 'السويس',
  'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط', 'الشرقية', 'جنوب سيناء', 'كفر الشيخ',
  'مطروح', 'الأقصر', 'قنا', 'شمال سيناء', 'سوهاج'
]

function LocationMarker({ position, setPosition }: { position: [number, number] | null, setPosition: (pos: [number, number]) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng])
    },
  })

  React.useEffect(() => {
    if (position) {
      map.flyTo(position, 15);
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position}></Marker>
  )
}

const CompleteProfile = () => {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  
  const [phone, setPhone] = useState('')
  const [altPhone, setAltPhone] = useState('')
  const [governorate, setGovernorate] = useState(GOVERNORATES[0])
  const [address, setAddress] = useState('')
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !governorate || !address) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    if (!phoneRegex.test(phone)) {
      toast.error('رقم الهاتف الأساسي غير صالح. يجب أن يتكون من 11 رقماً ويبدأ بـ 010 أو 011 أو 012 أو 015')
      return;
    }

    if (altPhone && !phoneRegex.test(altPhone)) {
      toast.error('رقم الهاتف البديل غير صالح. يجب أن يتكون من 11 رقماً ويبدأ بـ 010 أو 011 أو 012 أو 015')
      return;
    }

    setIsSubmitting(true)

    try {
      // Call backend API to update the profile
      const response = await api.put('/auth/profile/complete', {
        phone,
        altPhone,
        city: governorate,
        address,
        location: position ? { lat: position[0], lng: position[1] } : null
      })

      // Sync local state
      if (user) {
        setUser({
          ...user,
          phone,
          city: governorate,
          address
        })
      }

      toast.success('تم استكمال بياناتك بنجاح!')
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'حدث خطأ أثناء حفظ البيانات')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-accent-50 to-secondary-50 py-12 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-neutral-800 mb-3">لنكمل إعداد حسابك</h1>
            <p className="text-neutral-500">نحتاج لبعض المعلومات الإضافية لنتمكن من تقديم أفضل خدمة لك</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary Phone */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">رقم الهاتف (أساسي) *</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-3 w-5 h-5 text-neutral-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-secondary-500 focus:ring-0 transition-colors"
                    placeholder="01xxxxxxxxx"
                  />
                </div>
              </div>

              {/* Alternate Phone */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">رقم هاتف بديل (اختياري)</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-3 w-5 h-5 text-neutral-400" />
                  <input
                    type="tel"
                    value={altPhone}
                    onChange={(e) => setAltPhone(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-secondary-500 focus:ring-0 transition-colors"
                    placeholder="01xxxxxxxxx"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Governorate */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">المحافظة *</label>
                <div className="relative">
                  <Building className="absolute right-3 top-3 w-5 h-5 text-neutral-400" />
                  <select
                    value={governorate}
                    onChange={(e) => setGovernorate(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-secondary-500 focus:ring-0 transition-colors"
                  >
                    {GOVERNORATES.map(gov => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">عنوان الشارع والحي *</label>
                <div className="relative">
                  <HomeIcon className="absolute right-3 top-3 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-secondary-500 focus:ring-0 transition-colors"
                    placeholder="مثال: شارع المعز، حي الحسين"
                  />
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-neutral-700">حدد موقعك الدقيق على الخريطة (اختياري، يساعد في التوصيل)</label>
                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) {
                      toast.error('متصفحك لا يدعم تحديد الموقع');
                      return;
                    }
                    toast.loading('جاري تحديد موقعك...', { id: 'geo' });
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        setPosition([pos.coords.latitude, pos.coords.longitude]);
                        toast.success('تم تحديد موقعك بنجاح', { id: 'geo' });
                      },
                      (err) => {
                        toast.error('تعذر تحديد موقعك. يرجى التأكد من منح الصلاحيات.', { id: 'geo' });
                      },
                      { enableHighAccuracy: true }
                    );
                  }}
                  className="flex items-center gap-1 text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Crosshair className="w-4 h-4" /> تحديد مكاني تلقائياً
                </button>
              </div>
              <div className="h-64 rounded-xl overflow-hidden border-2 border-neutral-200 relative">
                <MapContainer center={[30.0444, 31.2357]} zoom={11} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  />
                  <LocationMarker position={position} setPosition={setPosition} />
                </MapContainer>
                {position && (
                  <div className="absolute bottom-2 left-2 z-[400] bg-white px-3 py-1 rounded-md text-xs font-bold text-green-600 shadow-sm flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> تم تحديد الموقع
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-secondary-500 to-accent-500 text-white font-bold text-lg py-4 rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ البيانات والمتابعة'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CompleteProfile
