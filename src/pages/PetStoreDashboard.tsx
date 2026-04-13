import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import { uploadAPI, ordersAPI } from '../services/api'
import { Store, Package, TrendingUp, Phone, Globe, MapPin, Clock, MessageCircle, Edit, X, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'
import { SafeImage } from '../components/SafeImage'
import { API_BASE_URL } from '@/services/api';

interface PetStoreData {
  id: string
  storeName: string
  storeType: string
  description: string
  address: string
  city: string
  country: string
  phone: string
  website?: string
  whatsapp?: string
  openingTime?: string
  closingTime?: string
  services: string[]
  brands: string[]
  verified: boolean
  isActive: boolean
  rating: number
  reviewCount: number
  createdAt: string
}

interface Stats {
  productsCount: number
  rating: number
  reviewCount: number
  revenue: number
  ordersCount: number
}

const PetStoreDashboard: React.FC = () => {
  const { user } = useAuthStore()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [petStore, setPetStore] = useState<PetStoreData | null>(null)
  const [stats, setStats] = useState<Stats>({
    productsCount: 0,
    rating: 0,
    reviewCount: 0,
    revenue: 0,
    ordersCount: 0
  })

  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    storeName: '',
    description: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    website: '',
    whatsapp: '',
    openingTime: '',
    closingTime: '',
    services: [] as string[],
    brands: [] as string[]
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPetStoreData()
    fetchStats()
    fetchProducts()
    fetchOrders()
  }, [])

  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products')
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'food', imageUrl: '', description: '', stock: '', salePrice: '', saleExpiresAt: '' })
  const [productImageFile, setProductImageFile] = useState<File | null>(null)
  const [productImagePreview, setProductImagePreview] = useState<string>('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [togglingStock, setTogglingStock] = useState<string | null>(null)
  const [editingStock, setEditingStock] = useState<string | null>(null)
  const [editStockValue, setEditStockValue] = useState<string>('')

  const fetchProducts = async () => {
    try {
      const res = await fetch(API_BASE_URL + '/petstores/products', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        const data = await res.json()
        // نضمن أن كل منتج له id كـ string صريح
        const normalized = (data.products || []).map((p: any) => ({
          ...p,
          id: p._id ? p._id.toString() : (p.id ? p.id.toString() : ''),
          _id: p._id ? p._id.toString() : (p.id ? p.id.toString() : '')
        }))
        setProducts(normalized)
      }
    } catch (e) { console.error(e) }
  }

  const fetchOrders = async () => {
    try {
      const { data } = await ordersAPI.getStoreOrders()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await ordersAPI.updateStatus(orderId, status)
      toast.success('تم تحديث حالة الطلب')
      fetchOrders()
    } catch (error) {
      toast.error('حدث خطأ في تحديث طلب العميل')
    }
  }

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation() // Prevent event bubbling that might close modal
    const file = e.target.files?.[0]
    if (file) {
      setProductImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProductImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const closeProductModal = () => {
    setShowAddProductModal(false)
    setEditingProductId(null)
    setNewProduct({ name: '', price: '', category: 'food', imageUrl: '', description: '', stock: '', salePrice: '', saleExpiresAt: '' })
    setProductImageFile(null)
    setProductImagePreview('')
  }
  
  const handleEditProductClick = (product: any) => {
    setEditingProductId(product.id || product._id)
    setNewProduct({
      name: product.name || '',
      price: String(product.price || ''),
      category: product.category || 'food',
      imageUrl: product.imageUrl || '',
      description: product.description || '',
      stock: String(product.stock ?? ''),
      salePrice: product.salePrice ? String(product.salePrice) : '',
      saleExpiresAt: product.saleExpiresAt ? new Date(product.saleExpiresAt).toISOString().slice(0, 16) : ''
    })
    setProductImagePreview(product.imageUrl || '')
    setShowAddProductModal(true)
  }

  const handleToggleStock = async (productId: string, currentInStock: boolean) => {
    setTogglingStock(productId)
    try {
      const res = await fetch(`${API_BASE_URL}/petstores/products/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ inStock: !currentInStock })
      })
      
      if (res.ok) {
        setProducts(prev => prev.map(p =>
          (p.id === productId || p._id === productId)
            ? { ...p, inStock: !currentInStock }
            : p
        ))
        toast.success(!currentInStock ? 'تم تفعيل المنتج' : 'تم تعليم المنتج كـ "نفذ من المخزون"')
      } else {
        if (res.status === 404) {
          toast.error('لم يتم العثور على المسار، هل قمت بإعادة تشغيل السيرفر؟');
        } else {
          toast.error('فشلت العملية. كود الخطأ: ' + res.status);
        }
      }
    } catch (e) {
      toast.error('حدث خطأ في الاتصال بالخادم')
    } finally {
      setTogglingStock(null)
    }
  }

  const handleUpdateStockCount = async (productId: string, newStock: number) => {
    if (isNaN(newStock) || newStock < 0) {
      toast.error('الكمية يجب أن تكون رقماً صحيحاً غير سالب')
      return
    }
    const idToSend = productId?.toString()
    if (!idToSend) {
      toast.error('خطأ: لم يتم التعرف على المنتج')
      return
    }
    try {
      const res = await fetch(`${API_BASE_URL}/petstores/products/${idToSend}/stock-count`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ stock: newStock })
      })
      if (res.ok) {
        const data = await res.json()
        setProducts(prev => prev.map(p =>
          (p.id === idToSend || p._id === idToSend)
            ? { ...p, stock: data.stock, inStock: data.inStock }
            : p
        ))
        toast.success(newStock > 0 ? `✅ تم تحديث الكمية إلى ${newStock} قطعة وتم تفعيل المنتج` : '⚠️ المخزن أصبح صفراً — المنتج معلّم كـ نفذ')
        setEditingStock(null)
      } else {
        const errData = await res.json().catch(() => ({}))
        console.error('Stock update failed:', res.status, errData)
        toast.error(`فشل تحديث الكمية (${res.status}): ${errData.message || errData.error || ''}`)
      }
    } catch (e) {
      console.error('Stock update error:', e)
      toast.error('حدث خطأ في الاتصال')
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      let imageUrl = newProduct.imageUrl

      // Upload image if file is selected
      if (productImageFile) {
        try {
          const uploadRes = await uploadAPI.uploadImage(productImageFile)
          const uploadData = uploadRes.data
          
          // Force proper URL format in case the backend returns a local path
          if (uploadData.url && uploadData.url.startsWith('/')) {
             imageUrl = uploadData.url;
          } else if (uploadData.filename) {
             imageUrl = `/uploads/${uploadData.filename}`;
          } else {
             imageUrl = (uploadData.path || '').replace(/\\/g, '/');
             if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
                 imageUrl = '/' + imageUrl;
             }
          }
          console.log('Image uploaded successfully:', imageUrl)
        } catch (uploadError: any) {
          console.error('Image upload failed:', uploadError.response?.data || uploadError.message)
          toast.error(uploadError.response?.data?.message || t('petstore.errors.uploadImage'))
          setLoading(false)
          return
        }
      }

      const url = editingProductId ? `/api/petstores/products/${editingProductId}` : '/api/petstores/products'
      const method = editingProductId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ 
          ...newProduct, 
          imageUrl, 
          stock: Number(newProduct.stock) || 0,
          salePrice: Number(newProduct.salePrice) || undefined,
          saleExpiresAt: newProduct.saleExpiresAt ? new Date(newProduct.saleExpiresAt).toISOString() : undefined
        })
      })
      if (res.ok) {
        toast.success(editingProductId ? 'تم التعديل بنجاح' : t('petstore.product.added'))
        closeProductModal()
        fetchProducts()
      } else {
        const errorData = await res.json()
        console.error('Product creation/update failed:', errorData)
        toast.error(errorData.message || t('petstore.product.addFailed'))
      }
    } catch (e: any) {
      console.error('Product add error:', e)
      toast.error(t('common.error'))
    }
    finally { setLoading(false) }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm(t('petstore.product.confirmDelete'))) return
    try {
      const res = await fetch(`${API_BASE_URL}/petstores/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        toast.success(t('petstore.product.deleted'))
        fetchProducts()
      }
    } catch (e) { toast.error('فشل الحذف') }
  }

  const handleClearAllProducts = async () => {
    if (!window.confirm('هل أنت متأكد أنك تريد حذف جميع المنتجات؟ هذا الإجراء لا يمكن التراجع عنه.')) return
    try {
      const res = await fetch(API_BASE_URL + '/petstores/products', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (res.ok) {
        toast.success('تم حذف جميع المنتجات بنجاح')
        setProducts([])
      } else {
        toast.error('فشل في حذف المنتجات')
      }
    } catch (e) { toast.error('حدث خطأ') }
  }


  const fetchPetStoreData = async () => {
    try {
      const response = await fetch(API_BASE_URL + '/petstores/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const p = data.petStore || {}
        setPetStore({
          id: p._id || p.id,
          storeName: p.storeName || '',
          storeType: p.storeType || '',
          description: p.description || '',
          address: p.address || '',
          city: p.city || '',
          country: p.country || '',
          phone: p.phone || '',
          website: p.website || '',
          whatsapp: p.whatsapp || '',
          openingTime: p.openingTime || '',
          closingTime: p.closingTime || '',
          services: Array.isArray(p.services) ? p.services : [],
          brands: typeof p.brands === 'string' ? p.brands.split(',').map((b: string) => b.trim()).filter(Boolean) : (p.brands || []),
          verified: Boolean(p.verified),
          isActive: p.isActive === undefined ? true : Boolean(p.isActive),
          rating: Number(p.rating || 0),
          reviewCount: Number(p.reviewCount || 0),
          createdAt: p.createdAt || ''
        })
        setEditForm({
          storeName: p.storeName || '',
          description: p.description || '',
          address: p.address || '',
          city: p.city || '',
          country: p.country || '',
          phone: p.phone || '',
          website: p.website || '',
          whatsapp: p.whatsapp || '',
          openingTime: p.openingTime || '',
          closingTime: p.closingTime || '',
          services: Array.isArray(p.services) ? p.services : [],
          brands: typeof p.brands === 'string' ? p.brands.split(',').map((b: string) => b.trim()).filter(Boolean) : (p.brands || [])
        })
      }
    } catch (error) {
      console.error('Error fetching pet store data:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(API_BASE_URL + '/petstores/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const availableServices = [
    'بيع الحيوانات',
    'مستلزمات الحيوانات',
    'تجميل الحيوانات',
    'رعاية الحيوانات',
    'منتجات بيطرية',
    'طعام الحيوانات',
    'ألعاب الحيوانات',
    'إكسسوارات الحيوانات',
    'تدريب الحيوانات',
    'استشارات بيطرية'
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
  }

  const handleServiceToggle = (service: string) => {
    setEditForm(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }))
  }

  const handleBrandsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const brands = e.target.value.split(',').map(brand => brand.trim()).filter(Boolean)
    setEditForm(prev => ({ ...prev, brands }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editForm.storeName || !editForm.address || !editForm.phone) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(API_BASE_URL + '/petstores/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          storeName: editForm.storeName,
          description: editForm.description,
          address: editForm.address,
          city: editForm.city,
          brands: editForm.brands
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(t('petstore.update.success'))
        setShowEditModal(false)
        fetchPetStoreData()
      } else {
        toast.error(data.message || t('petstore.update.failed'))
      }
    } catch (error) {
      toast.error('حدث خطأ ما')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (verified: boolean, isActive: boolean) => {
    if (!isActive) return 'bg-red-100 text-red-800'
    if (verified) return 'bg-green-100 text-green-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  const getStatusText = (verified: boolean, isActive: boolean) => {
    if (!isActive) return 'غير نشط'
    if (verified) return 'موثق'
    return 'قيد الانتظار'
  }

  if (!user || user.role !== 'petstore') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('access.deniedTitle')}
          </h2>
          <p className="text-gray-600">
            {t('access.requiredRole', { role: t('roles.petstore') })}
          </p>
        </div>
      </div>
    )
  }

  if (!petStore) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 text-[var(--color-vet-accent)] rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            لم يتم العثور على متجر
          </h2>
          <p className="text-gray-600 mb-4">
            يرجى تسجيل المتجر
          </p>
          <button
            onClick={() => navigate('/petstore-registration')}
            className="px-4 py-2 bg-[var(--color-vet-primary)] text-white rounded-md hover:bg-[var(--color-vet-primary)]"
          >
            تسجيل المتجر
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('petstore.title')}
              </h1>
              <p className="text-gray-600">
                {t('dashboard.welcomeWithName', { name: user.fullName })}
              </p>
            </div>
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center px-4 py-2 bg-[var(--color-vet-primary)] text-white rounded-md hover:bg-[var(--color-vet-primary)]"
            >
              <Edit className="h-4 w-4 mr-2" />
              {t('petstore.edit')}
            </button>
          </div>
        </div>

        {/* Store Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {petStore.storeName}
              </h2>
              <div className="flex items-center space-x-4 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(petStore.verified, petStore.isActive)
                  }`}>
                  {getStatusText(petStore.verified, petStore.isActive)}
                </span>
                <span className="text-sm text-gray-600">
                  {petStore.storeType}
                </span>
              </div>
              {petStore.description && (
                <p className="text-gray-600 mb-4">{petStore.description}</p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center mb-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`h-4 w-4 ${star <= Math.round(petStore.rating || 0) ? 'text-[var(--color-vet-accent)]' : 'text-gray-300'
                        }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {(petStore.rating || 0).toFixed(1)} ({petStore.reviewCount || 0} مراجعات)
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">معلومات التواصل</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  {petStore.phone}
                </div>
                {petStore.whatsapp && (
                  <div className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {petStore.whatsapp}
                  </div>
                )}
                {petStore.website && (
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    {petStore.website}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">الموقع وساعات العمل</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {petStore.address}, {petStore.city}
                </div>
                {petStore.openingTime && petStore.closingTime && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {petStore.openingTime} - {petStore.closingTime}
                  </div>
                )}
              </div>
            </div>
          </div>

          {petStore.services.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">الخدمات</h4>
              <div className="flex flex-wrap gap-2">
                {petStore.services.map((service, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}

          {petStore.brands.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-900 mb-2">العلامات التجارية</h4>
              <div className="flex flex-wrap gap-2">
                {petStore.brands.map((brand, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-800 text-sm rounded-full"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي المنتجات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.productsCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 text-[var(--color-vet-primary)] rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">تقييم المتجر</p>
                <p className="text-2xl font-bold text-gray-900">{(stats?.rating || 0).toFixed(1)} <span className="text-sm font-normal text-gray-500">({stats?.reviewCount || 0} تقييم)</span></p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 text-[var(--color-vet-accent)] rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold">★</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الطلبات (قريباً)</p>
                <p className="text-2xl font-bold text-gray-900">{stats.ordersCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 text-[var(--color-vet-secondary)] rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  تعديل المتجر
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      اسم المتجر *
                    </label>
                    <input
                      type="text"
                      name="storeName"
                      value={editForm.storeName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الهاتف *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={editForm.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      العنوان *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={editForm.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      المدينة *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={editForm.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الدولة *
                    </label>
                    <select
                      name="country"
                      value={editForm.country}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                      required
                    >
                      <option value="Egypt">مصر</option>
                      <option value="Saudi Arabia">السعودية</option>
                      <option value="UAE">الإمارات</option>
                      <option value="Kuwait">الكويت</option>
                      <option value="Qatar">قطر</option>
                      <option value="Bahrain">البحرين</option>
                      <option value="Oman">عمان</option>
                      <option value="Jordan">الأردن</option>
                      <option value="Lebanon">لبنان</option>
                      <option value="Morocco">المغرب</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الموقع الإلكتروني
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={editForm.website}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      واتساب
                    </label>
                    <input
                      type="tel"
                      name="whatsapp"
                      value={editForm.whatsapp}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      وقت الفتح
                    </label>
                    <input
                      type="time"
                      name="openingTime"
                      value={editForm.openingTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      وقت الإغلاق
                    </label>
                    <input
                      type="time"
                      name="closingTime"
                      value={editForm.closingTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الوصف
                  </label>
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    placeholder='صف نشاط محلك بالتفصيل...'
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الخدمات
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableServices.map(service => (
                      <label key={service} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editForm.services.includes(service)}
                          onChange={() => handleServiceToggle(service)}
                          className="mr-2 h-4 w-4 text-[var(--color-vet-primary)] focus:ring-[var(--color-vet-primary)] border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{service}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    العلامات التجارية
                  </label>
                  <input
                    type="text"
                    name="brands"
                    value={editForm.brands.join(', ')}
                    onChange={handleBrandsChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    placeholder='قائمة العلامات التجارية التي تتعامل معها...'
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={loading}
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--color-vet-primary)] text-white rounded-md hover:bg-[var(--color-vet-primary)] disabled:opacity-50 flex items-center"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        جاري التحديث...
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        تحديث
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-6">
        <button
          onClick={() => setActiveTab('products')}
          className={`py-3 text-lg font-bold border-b-4 transition-colors ${activeTab === 'products' ? 'border-[var(--color-vet-primary)] text-[var(--color-vet-primary)]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          منتجاتي
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 text-lg font-bold border-b-4 transition-colors flex items-center gap-2 ${activeTab === 'orders' ? 'border-[var(--color-vet-primary)] text-[var(--color-vet-primary)]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          طلبات العملاء
          {orders.length > 0 && (
             <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
               {orders.filter(o => o.status === 'pending').length}
             </span>
          )}
        </button>
      </div>

      {activeTab === 'products' ? (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">المنتجات</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddProductModal(true)}
              className="flex items-center px-4 py-2 bg-[var(--color-vet-secondary)] text-white rounded-md hover:bg-[var(--color-vet-secondary)]"
            >
              <Package className="h-4 w-4 mr-2" />
              إضافة منتج
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            // لو stock موجود وقيمته 0 → نفذ المخزن (تلقائياً)، بغض النظر عن قيمة inStock القديمة
            const stockNum = Number(product.stock)
            const isInStock = product.inStock !== false && !(Number.isFinite(stockNum) && stockNum === 0);
            const productId = product.id || product._id;
            return (
            <div key={productId} className="bg-white rounded-lg shadow-md overflow-hidden group">
              <div 
                className={`relative h-48 bg-gray-100 ${product.imageUrl ? 'cursor-pointer' : ''}`}
                onClick={() => {
                  if (product.imageUrl) setPreviewImage(product.imageUrl);
                }}
              >
                {product.imageUrl ? (
                  <SafeImage src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package className="h-12 w-12" />
                  </div>
                )}
                {/* Out of stock overlay */}
                {!isInStock && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm pointer-events-none">
                    <img src="/images/out-of-stock.png" alt="نفذ المنتج" className="w-full h-full object-contain p-2 drop-shadow-xl mix-blend-darken filter contrast-105" />
                  </div>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteProduct(productId); }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4">
                <div className="flex gap-2 mb-1">
                  <h3 className="font-bold text-gray-900">{product.name}</h3>
                  <button onClick={(e) => { e.stopPropagation(); handleEditProductClick(product); }} className="text-blue-500 hover:text-blue-700 p-1" title="تعديل المنتج">
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-1">{product.category}</p>
                {/* Stock count badge */}
                <div className={`text-xs font-bold px-2 py-1 rounded-full inline-block mb-2 ${
                  (product.stock || 0) === 0 ? 'bg-red-100 text-red-700' :
                  (product.stock || 0) <= 5 ? 'bg-orange-100 text-orange-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  📦 المخزن: {product.stock ?? 0} قطعة
                  {(product.stock || 0) === 0 && ' — نفذ المخزن!'}
                  {(product.stock || 0) > 0 && (product.stock || 0) <= 5 && ' — كمية قليلة!'}
                </div>

                {/* Inline stock edit */}
                {editingStock === productId ? (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="number"
                      min="0"
                      className="w-20 border border-gray-300 rounded-md px-2 py-1 text-sm focus:border-[var(--color-vet-primary)]"
                      value={editStockValue}
                      onChange={e => setEditStockValue(e.target.value)}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleUpdateStockCount(productId, Number(editStockValue))
                        if (e.key === 'Escape') setEditingStock(null)
                      }}
                    />
                    <button
                      onClick={() => handleUpdateStockCount(productId, Number(editStockValue))}
                      className="bg-green-500 text-white text-xs px-2 py-1 rounded-md hover:bg-green-600"
                    >حفظ</button>
                    <button
                      onClick={() => setEditingStock(null)}
                      className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-md hover:bg-gray-300"
                    >إلغاء</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingStock(productId); setEditStockValue(String(product.stock ?? 0)) }}
                    className="text-xs text-blue-600 hover:underline mb-2 block"
                  >✏️ تعديل الكمية</button>
                )}

                <div className="flex justify-between items-center mt-2">
                  <span className="font-bold text-[var(--color-vet-primary)]">${product.price}</span>
                  {/* Stock toggle button */}
                  <button
                    onClick={() => handleToggleStock(productId, isInStock)}
                    disabled={togglingStock === productId}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium transition-all ${
                      isInStock
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                    title={isInStock ? 'اضغط لتعليمه كـ نفذ' : 'اضغط لإعادة تفعيله'}
                  >
                    {togglingStock === productId ? (
                      <span className="animate-spin">⏳</span>
                    ) : isInStock ? (
                      <><ToggleRight className="h-4 w-4" /> متاح</>
                    ) : (
                      <><ToggleLeft className="h-4 w-4" /> نفذ</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )})}
          {products.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">لا توجد منتجات بعد</p>
            </div>
          )}
        </div>
      </div>
      ) : (
      <div className="mb-8">
         <div className="flex justify-between items-center mb-6">
           <h2 className="text-2xl font-bold text-gray-900">طلبات العملاء</h2>
           <button onClick={fetchOrders} className="text-sm font-medium text-[var(--color-vet-primary)] hover:underline border border-[var(--color-vet-primary)] px-3 py-1 rounded-md">تحديث الطلبات</button>
         </div>
         {orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-md text-gray-500">
               لا يوجد طلبات حالياً
            </div>
         ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order._id || order.id} className="bg-white rounded-xl shadow-md p-6">
                   <div className="flex flex-col md:flex-row justify-between border-b pb-4 mb-4 gap-4">
                      <div>
                         <p className="text-sm text-gray-500">رقم الطلب: {order._id || order.id}</p>
                         <h3 className="font-bold text-lg mt-1">{order.shippingAddress?.fullName} <span className="font-normal text-sm text-gray-600 bg-gray-100 px-2 py-1 inline-block rounded-md">{order.shippingAddress?.phone}</span></h3>
                         <p className="text-gray-600 text-sm mt-2 flex items-center gap-1">
                            {order.shippingAddress?.city} - {order.shippingAddress?.address}
                         </p>
                      </div>
                      <div className="text-right sm:text-left">
                         <div className="text-xl font-bold text-[var(--color-vet-primary)]">{order.currency} {(order.totalAmount || 0).toFixed(2)}</div>
                         <div className={`mt-2 px-3 py-1 text-sm rounded-full inline-block font-medium ${
                            order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                         }`}>
                           {order.paymentStatus === 'paid' ? 'مدفوع (Stripe)' : 'الدفع عند الاستلام'}
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                         <h4 className="font-bold mb-3">المنتجات المطلوبة ({order.items?.length || 0})</h4>
                         <div className="space-y-2 max-h-48 overflow-y-auto">
                           {order.items?.map((item: any, i: number) => (
                              <div key={i} className="flex gap-3 bg-gray-50 p-2 rounded-lg items-center">
                                 {item.imageUrl ? (
                                    <SafeImage src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-md" />
                                 ) : (
                                    <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">📦</div>
                                 )}
                                 <div>
                                    <div className="font-medium text-sm">{item.name}</div>
                                    <div className="text-xs text-gray-500">{item.price} × {item.quantity} = {item.price * item.quantity}</div>
                                 </div>
                              </div>
                           ))}
                         </div>
                      </div>

                      <div className="flex flex-col justify-center">
                          <h4 className="font-bold mb-3 text-gray-700">تحديث حالة الطلب</h4>
                          <select 
                             className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-[var(--color-vet-primary)] font-bold mb-3 bg-gray-50"
                             value={order.status}
                             onChange={(e) => handleUpdateOrderStatus(order._id || order.id, e.target.value)}
                          >
                             <option value="pending">⏳ قيد الانتظار (جديد)</option>
                             <option value="processing">📦 جاري التحضير والتغليف</option>
                             <option value="shipped">🚚 في الطريق / تم الشحن</option>
                             <option value="delivered">✅ تم التسليم</option>
                             <option value="cancelled">❌ ملغي</option>
                          </select>
                          <div className="text-xs text-gray-500 mt-1">بإمكانك تغيير حالة الطلب هنا ليتم إعلام العميل بذلك.</div>
                      </div>
                   </div>
                </div>
              ))}
            </div>
         )}
      </div>
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4" onClick={closeProductModal}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">{editingProductId ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h3>
              <button onClick={closeProductModal} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنتج</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={newProduct.name}
                  onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">السعر الأصلي</label>
                <input
                  type="number"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={newProduct.price}
                  onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سعر العرض (اختياري)</label>
                  <input
                    type="number"
                    placeholder="اتركه فارغاً لإلغاء العرض"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[var(--color-vet-secondary)]"
                    value={newProduct.salePrice}
                    onChange={e => setNewProduct({ ...newProduct, salePrice: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ انتهاء العرض</label>
                  <input
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[var(--color-vet-secondary)]"
                    value={newProduct.saleExpiresAt}
                    onChange={e => setNewProduct({ ...newProduct, saleExpiresAt: e.target.value })}
                    disabled={!Number(newProduct.salePrice)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الكمية في المخزن <span className="text-xs text-gray-400">(ضروري لتفعيل المنتج)</span></label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="مثال: 50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={newProduct.stock}
                  onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
                />
                <p className="text-xs text-orange-500 mt-1">⚠️ عند وصول الكمية لصفر، سيُعلَّم المنتج تلقائياً كـ "نفذ المخزن"</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التصنيف</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={newProduct.category}
                  onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                >
                  <option value="food">طعام</option>
                  <option value="toys">ألعاب</option>
                  <option value="accessories">إكسسوارات</option>
                  <option value="care">عناية</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">صورة المنتج</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  onChange={handleProductImageChange}
                />
                {productImagePreview && (
                  <div className="mt-2">
                    <SafeImage src={productImagePreview} alt="معاينة" className="h-32 w-32 object-cover rounded-md border" />
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">اختر صورة من جهازك أو هاتفك</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  value={newProduct.description}
                  onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-[var(--color-vet-primary)] text-white rounded-md hover:bg-[var(--color-vet-primary)] disabled:opacity-50"
              >
                {loading ? 'جاري الحفظ...' : editingProductId ? 'تحديث المنتج' : 'إضافة المنتج'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[200] p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
              className="absolute top-4 right-4 bg-white hover:bg-gray-200 text-gray-900 rounded-full p-2 z-[201] shadow-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <SafeImage src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  )
}

export default PetStoreDashboard
