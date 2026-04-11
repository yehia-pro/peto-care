import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '@/services/api'
import { toast } from 'sonner'
import { Check, X, Eye, FileText, User, Store, DollarSign, Stethoscope } from 'lucide-react'
import { useLanguageStore } from '@/stores/languageStore'
import { useAuthStore } from '@/stores/authStore'

interface PendingUser {
  _id: string
  fullName: string
  email: string
  role: 'vet' | 'petstore'
  phone?: string
  syndicateCardImageUrl?: string
  idFrontUrl?: string
  idBackUrl?: string
  commercialRegImageUrl?: string
  createdAt: string
}

export default function AdminDashboard() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const { t } = useLanguageStore()
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchPendingUsers()
  }, [])

  const fetchPendingUsers = async () => {
    try {
      const { data } = await adminAPI.getPendingUsers()
      setPendingUsers(data)
    } catch (error: any) {
      console.error('Failed to fetch pending users:', error)
      console.log('Error response:', error?.response)
      console.log('Error status:', error?.response?.status)

      // Check for authentication/authorization errors
      const status = error?.response?.status
      const errorCode = error?.response?.data?.error

      if (status === 401 || status === 403 || errorCode === 'forbidden_admin_access') {
        console.log('Auth error detected, logging out...')
        toast.error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً')

        // Force logout and redirect
        setTimeout(async () => {
          await logout()
          navigate('/login', { replace: true })
        }, 1000)
      } else {
        toast.error('فشل تحميل الطلبات المعلقة')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من تفعيل حساب ${name}؟`)) return

    try {
      await adminAPI.approveUser(id)
      toast.success(`تم تفعيل حساب ${name} بنجاح`)
      setPendingUsers(prev => prev.filter(u => u._id !== id))
    } catch (error) {
      console.error('Failed to approve user:', error)
      toast.error('حدث خطأ أثناء التفعيل')
    }
  }

  const handleReject = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من رفض وحذف حساب ${name}؟`)) return

    try {
      await adminAPI.rejectUser(id)
      toast.success(`تم رفض وحذف حساب ${name}`)
      setPendingUsers(prev => prev.filter(u => u._id !== id))
    } catch (error) {
      console.error('Failed to reject user:', error)
      toast.error('حدث خطأ أثناء الرفض')
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === 'vet') {
      return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold flex items-center w-fit gap-1"><User size={14} /> طبيب</span>
    }
    return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center w-fit gap-1"><Store size={14} /> متجر</span>
  }

  const renderDocumentButton = (url: string | undefined, label: string) => {
    if (!url) return null

    // Check if url is absolute
    let fullUrl = url
    if (!url.startsWith('http')) {
      const baseUrl = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace('/api', '')
        : ''
      // If baseUrl is empty (relative path usage), ensure we don't double slash if url starts with /
      // server uploads usually at /uploads
      fullUrl = `${baseUrl}/${url.replace(/\\/g, '/').replace(/^\//, '')}`
    }

    return (
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-[var(--color-vet-primary)] hover:text-blue-800 hover:underline bg-blue-50 px-3 py-2 rounded-lg transition-colors"
      >
        <FileText size={16} />
        {label}
      </a>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">لوحة تحكم الإدارة - طلبات التسجيل</h1>

        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div 
            onClick={() => navigate('/admin/manage-pet-guides')}
            className="bg-white p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-[var(--color-vet-primary)] hover:shadow-lg transition-all cursor-pointer flex items-center gap-4 group"
          >
            <div className="bg-blue-100 p-4 rounded-xl text-[var(--color-vet-primary)] group-hover:scale-110 transition-transform">
              <img src="https://cdn-icons-png.flaticon.com/512/3504/3504859.png" alt="Pets" className="w-10 h-10 opacity-80" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">إدارة دليل الحيوانات</h3>
              <p className="text-gray-500 text-sm">إضافة وتعديل حيوانات (صفحة لا يوجد حيوان)</p>
            </div>
          </div>

          <div 
            onClick={() => navigate('/admin/manage-diseases')}
            className="bg-white p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-red-500 hover:shadow-lg transition-all cursor-pointer flex items-center gap-4 group"
          >
            <div className="bg-red-100 p-4 rounded-xl text-red-600 group-hover:scale-110 transition-transform">
              <Stethoscope className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">إدارة الموسوعة الطبية</h3>
              <p className="text-gray-500 text-sm">إضافة وتعديل أمراض وحالات طبية</p>
            </div>
          </div>

          <div 
            onClick={() => navigate('/admin/transactions')}
            className="bg-white p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-[var(--color-vet-secondary)] hover:shadow-lg transition-all cursor-pointer flex items-center gap-4 group"
          >
            <div className="bg-green-100 p-4 rounded-xl text-[var(--color-vet-secondary)] group-hover:scale-110 transition-transform">
              <DollarSign className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">سجل المعاملات</h3>
              <p className="text-gray-500 text-sm">متابعة المدفوعات والاشتراكات</p>
            </div>
          </div>

          <div 
            onClick={() => navigate('/admin/manage-coupons')}
            className="bg-white p-6 rounded-2xl shadow-sm border-2 border-transparent hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer flex items-center gap-4 group"
          >
            <div className="bg-purple-100 p-4 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
              <span className="text-3xl font-bold">%</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">إدارة الكوبونات</h3>
              <p className="text-gray-500 text-sm">أكواد الخصم والعروض الخاصة</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-[var(--color-vet-secondary)]" />
            </div>
            <h3 className="text-xl font-medium text-gray-900">لا توجد طلبات معلقة</h3>
            <p className="text-gray-500 mt-2">جميع الحسابات تمت مراجعتها.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center bg-gray-50 gap-3">
              <h3 className="font-semibold text-gray-700">طلبات التسجيل المعلقة</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">المستخدم</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">الدور</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">معلومات الاتصال</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">المستندات</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600">تاريخ التسجيل</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{user.fullName}</div>
                        <div className="text-xs text-gray-500 mt-1">ID: {user._id}</div>
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">{user.email}</div>
                        {user.phone && <div className="text-sm text-gray-500 mt-1" dir="ltr">{user.phone}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          {user.role === 'vet' && (
                            <>
                              {renderDocumentButton(user.syndicateCardImageUrl, 'كارنيه النقابة')}
                              {renderDocumentButton(user.idFrontUrl, 'وجه الهوية')}
                              {renderDocumentButton(user.idBackUrl, 'ظهر الهوية')}
                            </>
                          )}
                          {user.role === 'petstore' && (
                            <>
                              {renderDocumentButton(user.commercialRegImageUrl, 'السجل التجاري')}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleApprove(user._id, user.fullName)}
                            className="bg-[var(--color-vet-secondary)] text-white p-2 rounded-lg hover:bg-[var(--color-vet-secondary)] transition-colors shadow-sm"
                            title="قبول وتفعيل"
                          >
                            <Check size={20} />
                          </button>
                          <button
                            onClick={() => handleReject(user._id, user.fullName)}
                            className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200 transition-colors"
                            title="رفض وحذف"
                          >
                            <X size={20} />
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
