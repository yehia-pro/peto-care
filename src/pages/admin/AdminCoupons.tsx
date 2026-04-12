import { useState, useEffect } from 'react'
import { Plus, Trash2, Tag, Percent, DollarSign, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/services/api'
import { useLanguageStore } from '@/stores/languageStore'

interface Coupon {
  _id: string
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  expiresAt: string | null
  isActive: boolean
  minOrderAmount: number
  maxUses: number
  usedCount: number
  createdAt: string
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { t } = useLanguageStore()

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    expiresAt: '',
    minOrderAmount: 0,
    maxUses: 100
  })

  useEffect(() => {
    fetchCoupons()
  }, [])

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/coupons')
      setCoupons(res.data.coupons || [])
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to fetch coupons')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return
    try {
      await api.delete(`/admin/coupons/${id}`)
      toast.success('تم حذف الكوبون بنجاح')
      fetchCoupons()
    } catch (e) {
      toast.error('حدث خطأ أثناء حذف الكوبون')
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCoupon.code) return toast.error('يرجى إدخال كود الكوبون')
    try {
      await api.post('/admin/coupons', newCoupon)
      toast.success('تم إنشاء الكوبون بنجاح')
      setIsModalOpen(false)
      setNewCoupon({
        code: '',
        discountType: 'percentage',
        discountValue: 10,
        expiresAt: '',
        minOrderAmount: 0,
        maxUses: 100
      })
      fetchCoupons()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to create coupon')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 border-r-4 border-purple-500 pr-3">إدارة الكوبونات</h1>
            <p className="text-gray-500 mt-2">إدارة أكواد الخصم والعروض الخاصة بالمنصة</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus size={20} />
            إضافة كوبون جديد
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : coupons.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900">لا توجد كوبونات مسجلة</h3>
            <p className="text-gray-500 mt-2">قم بإضافة أول كود للخصم الآن!</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">الكود</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">الخصم</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">تاريخ الانتهاء</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">الاستخدام</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">الحالة</th>
                    <th className="px-6 py-4 text-sm font-semibold text-center text-gray-600">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {coupons.map((coupon) => (
                    <tr key={coupon._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-lg text-purple-700 font-mono bg-purple-50 px-3 py-1 rounded w-fit">
                          {coupon.code}
                        </div>
                        {coupon.minOrderAmount > 0 && (
                          <div className="text-xs text-gray-500 mt-1">حد أدنى: {coupon.minOrderAmount} ج.م</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 font-bold text-gray-900">
                          {coupon.discountType === 'percentage' ? (
                            <><Percent size={16} className="text-gray-400" /> {coupon.discountValue}%</>
                          ) : (
                            <><DollarSign size={16} className="text-gray-400" /> {coupon.discountValue} ج.م</>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {coupon.expiresAt ? (
                          <div className="flex items-center gap-1 text-gray-700 text-sm">
                            <Calendar size={16} className="text-gray-400" />
                            {new Date(coupon.expiresAt).toLocaleDateString('ar-EG')}
                          </div>
                        ) : <span className="text-gray-400 text-sm">مفتوح مدى الحياة</span>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium">
                          <span className={coupon.usedCount >= coupon.maxUses ? 'text-red-500' : 'text-gray-900'}>{coupon.usedCount}</span> 
                          <span className="text-gray-400 mx-1">/</span> 
                          <span className="text-gray-500">{coupon.maxUses}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                          <div 
                            className="bg-purple-600 h-1.5 rounded-full" 
                            style={{ width: `${Math.min(100, (coupon.usedCount / coupon.maxUses) * 100)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {!coupon.isActive || (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) || (coupon.usedCount >= coupon.maxUses) ? (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">غير فعال</span>
                        ) : (
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">نشط</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleDelete(coupon._id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-block"
                          title="حذف"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Plus className="text-purple-600" /> إنشاء كوبون جديد
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200">✕</button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">كود الخصم</label>
                <input 
                  required
                  type="text" 
                  value={newCoupon.code}
                  onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500 font-mono text-lg uppercase"
                  placeholder="PETO20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">نوع الخصم</label>
                  <select 
                    value={newCoupon.discountType}
                    onChange={e => setNewCoupon({...newCoupon, discountType: e.target.value as any})}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت (ج.م)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">قيمة الخصم</label>
                  <input 
                    required
                    type="number" 
                    min="1"
                    value={newCoupon.discountValue}
                    onChange={e => setNewCoupon({...newCoupon, discountValue: Number(e.target.value)})}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">تاريخ الانتهاء <span className="text-xs text-gray-400 font-normal">(اختياري)</span></label>
                  <input 
                    type="date" 
                    value={newCoupon.expiresAt}
                    onChange={e => setNewCoupon({...newCoupon, expiresAt: e.target.value})}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">الحد الأدنى للطلب</label>
                  <input 
                    type="number" 
                    min="0"
                    value={newCoupon.minOrderAmount}
                    onChange={e => setNewCoupon({...newCoupon, minOrderAmount: Number(e.target.value)})}
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">أقصى عدد مرات استخدام</label>
                <input 
                  type="number" 
                  min="1"
                  value={newCoupon.maxUses}
                  onChange={e => setNewCoupon({...newCoupon, maxUses: Number(e.target.value)})}
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-purple-500 focus:ring-purple-500"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl shadow-lg hover:bg-purple-700 transition-colors"
                >
                  حفظ الكوبون
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
