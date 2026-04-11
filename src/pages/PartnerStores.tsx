import { useEffect, useState } from 'react'
import { Store, MapPin, Search } from 'lucide-react'
import api from '@/services/api'
import { useLanguageStore } from '../stores/languageStore'
import { useNavigate } from 'react-router-dom'

interface PetStore {
  id: string
  storeName: string
  city: string
  address?: string
  rating?: number
  commercialRegImageUrl?: string
}

const PartnerStores = () => {
  const { t } = useLanguageStore()
  const [stores, setStores] = useState<PetStore[]>([])
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const fetchStores = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (city) params.city = city
      const res = await api.get('/petstores', { params })
      const data = Array.isArray(res.data.petStores) ? res.data.petStores : []
      const normalized = data.map((s: any) => ({ id: s._id || s.id, storeName: s.storeName, city: s.city, address: s.address, rating: s.rating, commercialRegImageUrl: s.commercialRegImageUrl }))
      setStores(normalized)
    } catch {
      setStores([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStores() }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent mb-4">
            {t('pages.partnerStores.title')}
          </h1>
          <p className="text-xl text-neutral-700 max-w-2xl mx-auto">{t('pages.partnerStores.desc')}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-primary-200 p-6 mb-8 card-3d">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center border-2 border-neutral-300 rounded-xl px-4 py-3 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-200 transition-all duration-300">
              <Search className="w-5 h-5 text-neutral-400 mr-3" />
              <input 
                className="flex-1 outline-none bg-transparent placeholder-neutral-500 text-neutral-700" 
                placeholder={t('fields.city')} 
                value={city} 
                onChange={(e)=>setCity(e.target.value)} 
              />
            </div>
            <div className="hidden"></div>
            <button 
              onClick={fetchStores} 
              className="bg-gradient-to-r from-secondary-500 to-secondary-600 text-white px-6 py-3 rounded-xl hover:from-secondary-600 hover:to-secondary-700 transition-all duration-300 font-semibold shadow-lg transform hover:scale-105"
            >
              {t('actions.search')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
              <p className="text-neutral-600 text-lg">{t('status.loading')}</p>
            </div>
          ) : stores.length ? (
            stores.map((s) => (
              <div key={s.id} onClick={()=>navigate(`/partner-stores/${s.id}`)} className="cursor-pointer group bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-primary-200 p-6 transition-all duration-500 card-3d hover:shadow-2xl hover:-translate-y-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl p-3 transform group-hover:rotate-6 transition-transform duration-300 shadow-lg">
                      <Store className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-neutral-800 group-hover:text-primary-600 transition-colors">{s.storeName}</h3>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-neutral-700">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-primary-600" />
                    <span>{s.city}{s.address ? `, ${s.address}` : ''}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-12">
              <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full p-6 inline-block mb-4 card-3d">
                <Store className="h-12 w-12 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-neutral-800 mb-2">{t('status.noStores')}</h3>
              <p className="text-neutral-600">{t('common.search')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PartnerStores
