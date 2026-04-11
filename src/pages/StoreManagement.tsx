import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguageStore } from '../stores/languageStore'
import { useAuthStore } from '../stores/authStore'
import { Store, Plus, Edit, Trash2, Eye, Search, Filter, X, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { petStoresAPI, authAPI } from '../services/api'

interface PetStore {
  _id: string
  id?: string
  storeName: string
  storeType?: string
  description: string
  address: string
  city: string
  country?: string
  phone?: string
  website?: string
  verified?: boolean
  isActive?: boolean
  rating: number
  createdAt: string
  commercialRegImageUrl?: string
}

const StoreManagement: React.FC = () => {
  const { t } = useLanguageStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [stores, setStores] = useState<PetStore[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)

  // Add Store Form State
  const [newStore, setNewStore] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    storeName: '',
    description: '',
    city: '',
    address: '',
    storeType: 'pet_shop'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchStores()
  }, [])

  const fetchStores = async () => {
    try {
      setLoading(true)
      const response = await petStoresAPI.getAll()
      // Handle both potential response structures (array or object with petStores array)
      const data = response.data.petStores || response.data || []
      setStores(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching stores:', error)
      toast.error(t('error.somethingWentWrong') || 'حدث خطأ ما')
    } finally {
      setLoading(false)
    }
  }

  const filteredStores = stores.filter(store => {
    const matchesSearch = store.storeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.city?.toLowerCase().includes(searchTerm.toLowerCase())
    // Note: storeType might not be in the backend model yet, so we check if it exists
    const matchesFilter = filterType === 'all' || store.storeType === filterType
    return matchesSearch && matchesFilter
  })

  const handleAddStore = () => {
    setShowAddModal(true)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setNewStore({
      fullName: '',
      email: '',
      password: '',
      phone: '',
      storeName: '',
      description: '',
      city: '',
      address: '',
      storeType: 'pet_shop'
    })
  }

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStore.email || !newStore.password || !newStore.storeName) {
      toast.error('يرجى ملء الحقول المطلوبة')
      return
    }

    try {
      setIsSubmitting(true)
      // Register as a new user with role 'petstore'
      // This will create the User and the PetStore entry
      await authAPI.register({
        ...newStore,
        role: 'petstore',
        contact: JSON.stringify({ description: newStore.description, address: newStore.address })
      })

      toast.success('تم تسجيل المتجر بنجاح! في انتظار الموافقة.')
      handleCloseModal()
      fetchStores()
    } catch (error: any) {
      console.error('Error creating store:', error)
      toast.error(error.response?.data?.message || 'فشل في إنشاء المتجر')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewStore = (storeId: string) => {
    navigate(`/pet-store/${storeId}`)
  }

  const getStoreTypeLabel = (type?: string) => {
    const types: Record<string, string> = {
      'pet_shop': 'متجر حيوانات',
      'pet_supplies': 'مستلزمات حيوانات',
      'veterinary_pharmacy': 'صيدلية بيطرية',
      'grooming': 'تجميل الحيوانات',
      'boarding': 'رعاية الحيوانات'
    }
    return types[type || 'pet_shop'] || type || 'متجر'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-vet-primary)]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المتاجر</h1>
          <p className="text-gray-600">إدارة متاجر الحيوانات الأليفة المسجلة</p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="ابحث عن متجر..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
              >
                <option value="all">جميع الأنواع</option>
                <option value="pet_shop">متجر حيوانات</option>
                <option value="pet_supplies">مستلزمات حيوانات</option>
                <option value="veterinary_pharmacy">صيدلية بيطرية</option>
              </select>
              <button
                onClick={handleAddStore}
                className="bg-[var(--color-vet-primary)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-vet-primary)] transition-colors flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                إضافة متجر
              </button>
            </div>
          </div>
        </div>

        {/* Stores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <div key={store._id || store.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {store.commercialRegImageUrl ? (
                        <img src={store.commercialRegImageUrl} alt={store.storeName} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-6 h-6 text-[var(--color-vet-primary)]" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{store.storeName}</h3>
                      <p className="text-sm text-gray-600">{getStoreTypeLabel(store.storeType)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {store.verified && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        موثق
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{store.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Store className="w-4 h-4 ml-2" />
                    {store.address}, {store.city}
                  </div>
                  {store.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      📞 {store.phone}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-[var(--color-vet-accent)]">⭐</span>
                    <span className="text-sm font-medium">{store.rating || 0}</span>
                  </div>
                  <button
                    onClick={() => handleViewStore(store._id || store.id!)}
                    className="bg-[var(--color-vet-primary)] text-white px-3 py-1 rounded text-sm hover:bg-[var(--color-vet-primary)] transition-colors flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    عرض
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredStores.length === 0 && (
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد متاجر</h3>
            <p className="text-gray-600">لم يتم العثور على متاجر تطابق بحثك</p>
          </div>
        )}
      </div>

      {/* Add Store Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">إضافة متجر جديد</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateStore} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم المتجر *</label>
                  <input
                    type="text"
                    required
                    value={newStore.storeName}
                    onChange={e => setNewStore({ ...newStore, storeName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نوع المتجر</label>
                  <select
                    value={newStore.storeType}
                    onChange={e => setNewStore({ ...newStore, storeType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                  >
                    <option value="pet_shop">متجر حيوانات</option>
                    <option value="pet_supplies">مستلزمات حيوانات</option>
                    <option value="veterinary_pharmacy">صيدلية بيطرية</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل للمالك *</label>
                  <input
                    type="text"
                    required
                    value={newStore.fullName}
                    onChange={e => setNewStore({ ...newStore, fullName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={newStore.phone}
                    onChange={e => setNewStore({ ...newStore, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني *</label>
                  <input
                    type="email"
                    required
                    value={newStore.email}
                    onChange={e => setNewStore({ ...newStore, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newStore.password}
                    onChange={e => setNewStore({ ...newStore, password: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المدينة</label>
                <input
                  type="text"
                  value={newStore.city}
                  onChange={e => setNewStore({ ...newStore, city: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                <input
                  type="text"
                  value={newStore.address}
                  onChange={e => setNewStore({ ...newStore, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">وصف المتجر</label>
                <textarea
                  rows={3}
                  value={newStore.description}
                  onChange={e => setNewStore({ ...newStore, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-[var(--color-vet-primary)] text-white rounded-lg hover:bg-[var(--color-vet-primary)] disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ المتجر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default StoreManagement