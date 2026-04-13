import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Store, CheckCircle, XCircle, Wrench, RefreshCw, ArrowRight, Phone, Mail, Clock, Trash2 } from 'lucide-react'
import api from '@/services/api'

interface StoreEntry {
  userId: string
  fullName: string
  email: string
  phone: string
  isApproved: boolean
  createdAt: string
  hasStoreRecord: boolean
  store: {
    storeName?: string
    storeType?: string
    city?: string
    address?: string
    phone?: string
    openingTime?: string
    closingTime?: string
    rating?: number
    createdAt?: string
  } | null
}

export default function AdminManageStores() {
  const [stores, setStores] = useState<StoreEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [fixingId, setFixingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'missing' | 'ok' | 'pending'>('all')
  const navigate = useNavigate()

  useEffect(() => {
    fetchStores()
  }, [])

  const fetchStores = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/stores')
      setStores(data.stores || [])
    } catch (err: any) {
      toast.error('فشل تحميل بيانات المتاجر')
    } finally {
      setLoading(false)
    }
  }

  const handleFixStore = async (userId: string, fullName: string) => {
    if (!confirm(`هل تريد إنشاء سجل المتجر لـ "${fullName}"؟`)) return
    setFixingId(userId)
    try {
      const { data } = await api.post(`/admin/stores/${userId}/fix-store`)
      if (data.alreadyExisted) {
        toast.info('سجل المتجر موجود بالفعل')
      } else {
        toast.success(`✅ تم إنشاء سجل المتجر لـ "${fullName}" بنجاح`)
      }
      fetchStores()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'فشل إصلاح المتجر')
    } finally {
      setFixingId(null)
    }
  }

  const handleDeleteStore = async (userId: string, fullName: string) => {
    if (!confirm(`هل أنت متأكد من حذف متجر "${fullName}" وكل بياناته تماماً؟ هذا الإجراء لا يمكن التراجع عنه!`)) return
    try {
      await api.delete(`/admin/stores/${userId}`)
      toast.success(`تم حذف متجر ${fullName} بنجاح`)
      fetchStores()
    } catch (err: any) {
      toast.error('فشل حذف المتجر')
    }
  }

  const filtered = stores.filter(s => {
    if (filter === 'all') return true
    if (filter === 'missing') return s.isApproved && !s.hasStoreRecord
    if (filter === 'ok') return s.hasStoreRecord
    if (filter === 'pending') return !s.isApproved
    return true
  })

  const counts = {
    all: stores.length,
    missing: stores.filter(s => s.isApproved && !s.hasStoreRecord).length,
    ok: stores.filter(s => s.hasStoreRecord).length,
    pending: stores.filter(s => !s.isApproved).length,
  }

  const storeTypeLabels: Record<string, string> = {
    comprehensive: 'متجر شامل',
    clinic: 'عيادة بيطرية',
    grooming: 'صالون تجميل',
    boarding: 'فندق حيوانات',
    training: 'مركز تدريب',
    pharmacy: 'صيدلية بيطرية',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10" dir="rtl">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة المتاجر الشريكة</h1>
            <p className="text-gray-500 text-sm mt-1">عرض ومراقبة وإصلاح سجلات المتاجر المسجلة</p>
          </div>
          <button
            onClick={fetchStores}
            disabled={loading}
            className="mr-auto flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { key: 'all', label: 'إجمالي المتاجر', color: 'blue', icon: '🏪' },
            { key: 'ok', label: 'سجل مكتمل ✅', color: 'green', icon: '✅' },
            { key: 'missing', label: 'سجل ناقص ⚠️', color: 'amber', icon: '⚠️' },
            { key: 'pending', label: 'قيد المراجعة', color: 'gray', icon: '⏳' },
          ].map(({ key, label, color, icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`bg-white rounded-2xl p-5 text-right shadow-sm border-2 transition-all hover:shadow-md ${
                filter === key
                  ? `border-${color}-400 bg-${color}-50`
                  : 'border-transparent hover:border-gray-200'
              }`}
            >
              <div className="text-3xl mb-2">{icon}</div>
              <div className={`text-3xl font-bold text-${color}-600`}>
                {counts[key as keyof typeof counts]}
              </div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </button>
          ))}
        </div>

        {/* Alert for missing stores */}
        {counts.missing > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-amber-800">
                يوجد {counts.missing} {counts.missing === 1 ? 'متجر معتمد' : 'متاجر معتمدة'} بدون سجل بيانات
              </p>
              <p className="text-amber-700 text-sm mt-1">
                هذه المتاجر لن تظهر في لوحة التحكم الخاصة بأصحابها. اضغط على "إصلاح" لحل المشكلة فوراً.
              </p>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm p-20 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500">جاري تحميل بيانات المتاجر...</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-20 text-center">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">لا توجد متاجر في هذه الفئة</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h3 className="font-semibold text-gray-700">
                {filter === 'all' ? 'جميع المتاجر' :
                 filter === 'missing' ? 'المتاجر ذات السجل الناقص' :
                 filter === 'ok' ? 'المتاجر المكتملة' : 'المتاجر قيد المراجعة'}
                <span className="mr-2 text-sm font-normal text-gray-400">({filtered.length})</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-600">المتجر / المالك</th>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-600">معلومات الاتصال</th>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-600">نوع النشاط</th>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-600">حالة الاعتماد</th>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-600 text-center">سجل المتجر</th>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-600 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((entry) => (
                    <tr key={entry.userId} className={`hover:bg-gray-50 transition-colors ${
                      entry.isApproved && !entry.hasStoreRecord ? 'bg-amber-50/50' : ''
                    }`}>
                      
                      {/* Store/Owner Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                            <Store className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              {entry.store?.storeName || entry.fullName}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              المالك: {entry.fullName}
                            </p>
                            {entry.store?.city && (
                              <p className="text-xs text-gray-400">📍 {entry.store.city}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <span dir="ltr">{entry.email}</span>
                          </div>
                          {(entry.store?.phone || entry.phone) && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <Phone className="w-3.5 h-3.5 text-gray-400" />
                              <span dir="ltr">{entry.store?.phone || entry.phone}</span>
                            </div>
                          )}
                          {entry.store?.openingTime && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              {entry.store.openingTime} - {entry.store.closingTime}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Store Type */}
                      <td className="px-5 py-4">
                        {entry.store?.storeType ? (
                          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            {storeTypeLabels[entry.store.storeType] || entry.store.storeType}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-sm">—</span>
                        )}
                      </td>

                      {/* Approval Status */}
                      <td className="px-5 py-4">
                        {entry.isApproved ? (
                          <span className="flex items-center gap-1.5 text-green-700 bg-green-50 px-3 py-1.5 rounded-full text-xs font-medium w-fit">
                            <CheckCircle className="w-3.5 h-3.5" />
                            معتمد
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full text-xs font-medium w-fit">
                            <Clock className="w-3.5 h-3.5" />
                            قيد المراجعة
                          </span>
                        )}
                      </td>

                      {/* Store Record Status */}
                      <td className="px-5 py-4 text-center">
                        {entry.hasStoreRecord ? (
                          <div className="flex flex-col items-center gap-1">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                            <span className="text-xs text-green-600 font-medium">مكتمل</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <XCircle className="w-6 h-6 text-red-400" />
                            <span className="text-xs text-red-500 font-medium">ناقص</span>
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {!entry.hasStoreRecord && entry.isApproved ? (
                            <button
                              onClick={() => handleFixStore(entry.userId, entry.fullName)}
                              disabled={fixingId === entry.userId}
                              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 active:scale-95"
                            >
                              {fixingId === entry.userId ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Wrench className="w-4 h-4" />
                              )}
                              {fixingId === entry.userId ? 'جاري الإصلاح...' : 'إصلاح فوري'}
                            </button>
                          ) : entry.hasStoreRecord ? (
                            <span className="text-xs text-gray-400">لا يحتاج إصلاح</span>
                          ) : (
                            <span className="text-xs text-gray-400">يحتاج اعتماد</span>
                          )}

                          <button
                            onClick={() => handleDeleteStore(entry.userId, entry.fullName)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف المتجر نهائياً"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
