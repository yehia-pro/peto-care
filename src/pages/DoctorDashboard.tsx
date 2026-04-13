import React, { useState, useEffect, lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import { Video, Upload, Eye, Heart, MessageCircle, Calendar, Users, TrendingUp, Award, Trash2, AlertCircle, Settings, X } from 'lucide-react'
import { toast } from 'sonner'
import { authAPI } from '../services/api' // Import authAPI
import { API_BASE_URL } from '@/services/api';

const DoctorDashboard = lazy(() => import('./DoctorDashboard'))

interface VideoData {
  id: string
  title: string
  description: string
  videoUrl: string
  thumbnailUrl: string
  views: number
  likes: number
  createdAt: string
  isPublic: boolean
}

interface Stats {
  totalAppointments: number
  upcomingAppointments: number
  completedAppointments: number
  totalPatients: number
  rating: number
  revenue: number
}

const DoctorDashboardWrapper: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuthStore() // Removed checkAuth as it does not exist on AuthState

  const [videos, setVideos] = useState<VideoData[]>([])
  const [stats, setStats] = useState<Stats>({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    totalPatients: 0,
    rating: 0,
    revenue: 0
  })

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [profileForm, setProfileForm] = useState({
    clinicName: '',
    specialization: '',
    experienceYears: 0,
    consultationFee: 0,
    discountedFee: 0,
    discountExpiresAt: '',
    clinicAddress: '',
    governorate: '',
    country: 'Egypt',
    phone: ''
  })

  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'educational',
    tags: '',
    isPublic: true
  })
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)


  useEffect(() => {
    fetchDashboardData()
    fetchVideos()
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await authAPI.getProfile()
      const data = res.data
      let contact: any = {}
      try { contact = JSON.parse(data.contact || '{}') } catch (e) { console.warn('JSON parse error', e) }

      setProfileForm({
        clinicName: contact.clinicName || '',
        specialization: contact.specialization || '',
        experienceYears: contact.experienceYears || 0,
        consultationFee: contact.consultationFee || 0,
        discountedFee: contact.discountedFee || 0,
        discountExpiresAt: contact.discountExpiresAt || '',
        clinicAddress: contact.clinicAddress || '',
        governorate: contact.governorate || '',
        country: contact.country || 'Egypt',
        phone: data.phone || ''
      })
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await authAPI.updateProfile({
        phone: profileForm.phone,
        specialization: profileForm.specialization,
        experienceYears: Number(profileForm.experienceYears),
        country: profileForm.country,
        consultationFee: Number(profileForm.consultationFee),
        discountedFee: Number(profileForm.discountedFee),
        discountExpiresAt: profileForm.discountExpiresAt,
        clinicAddress: profileForm.clinicAddress,
        governorate: profileForm.governorate,
      })
      toast.success(t('common.success'))
      setShowSettingsModal(false)
      fetchProfile()
    } catch (error) {
      toast.error(t('common.error'))
    }
  }

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(API_BASE_URL + '/doctor/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const fetchVideos = async () => {
    try {
      const response = await fetch(API_BASE_URL + '/videos/my-videos', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setVideos(data.videos)
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 500 * 1024 * 1024) { // 500MB limit
        toast.error(t('doctor.errors.videoSizeLarge'))
        return
      }

      const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv']
      if (!allowedTypes.includes(file.type)) {
        toast.error(t('doctor.errors.videoTypeUnsupported'))
        return
      }

      setUploadFile(file)
    }
  }

  const handleUpload = async () => {
    if (!uploadFile || !uploadForm.title) {
      toast.error(t('messages.fillAllFields'))
      return
    }

    setUploading(true)

    try {
      // Upload video file
      const formData = new FormData()
      formData.append('video', uploadFile)
      formData.append('title', uploadForm.title)
      formData.append('description', uploadForm.description)
      formData.append('category', uploadForm.category)
      formData.append('tags', uploadForm.tags)
      formData.append('isPublic', uploadForm.isPublic.toString())

      const response = await fetch(API_BASE_URL + '/videos/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      })

      if (response.ok) {
        toast.success(t('doctor.upload.success'))
        setShowUploadModal(false)
        setUploadForm({
          title: '',
          description: '',
          category: 'educational',
          tags: '',
          isPublic: true
        })
        setUploadFile(null)
        fetchVideos()
        fetchDashboardData()
      } else {
        const data = await response.json()
        toast.error(data.message || t('doctor.upload.failed'))
      }
    } catch (error) {
      toast.error(t('common.error'))
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm(t('doctor.confirm.deleteVideo'))) return

    try {
      const response = await fetch(`${API_BASE_URL}/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        toast.success(t('doctor.delete.success'))
        fetchVideos()
        fetchDashboardData()
      } else {
        toast.error(t('doctor.delete.failed'))
      }
    } catch (error) {
      toast.error('ط­ط¯ط« ط®ط·ط£ ظ…ط§')
    }
  }

  const handleToggleVisibility = async (videoId: string, isPublic: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/videos/${videoId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isPublic: !isPublic })
      })

      if (response.ok) {
        toast.success(isPublic ? t('doctor.visibility.private') : t('doctor.visibility.public'))
        fetchVideos()
      }
    } catch (error) {
      toast.error(t('common.error'))
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  if (!user || user.role !== 'vet') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            طھظ… ط§ظ„ط±ظپط¶
          </h2>
          <p className="text-gray-600">
            ظ…ط·ظ„ظˆط¨ طµظ„ط§ط­ظٹط© ط·ط¨ظٹط¨ ط¨ظٹط·ط±ظٹ
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('doctor.title')}
            </h1>
            <p className="text-gray-600">
              {t('dashboard.welcomeWithName', { name: user.fullName })}
            </p>
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors shadow-sm"
          >
            <Settings className="h-5 w-5 ml-2" />
            {t('doctor.settings.title')}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي المواعيد</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 text-[var(--color-vet-primary)] rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600">كل الأوقات</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">المواعيد القادمة</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingAppointments}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 text-[var(--color-vet-accent)] rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600">في الانتظار</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">المواعيد المكتملة</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedAppointments}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 text-[var(--color-vet-secondary)] rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600">تم الانتهاء منها</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('doctor.stats.rating')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rating ? stats.rating.toFixed(1) : '0.0'}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 text-[var(--color-vet-accent)] rounded-lg flex items-center justify-center">
                <Award className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`h-4 w-4 ${star <= Math.round(stats.rating || 0) ? 'text-[var(--color-vet-accent)]' : 'text-gray-300'
                    }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي المرضى</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 text-[var(--color-vet-primary)] rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600">مرضى فريدين</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">الإيرادات</p>
                <p className="text-2xl font-bold text-gray-900">${stats.revenue}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 text-[var(--color-vet-secondary)] rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-600">إجمالي الخصومات والدفع</span>
            </div>
          </div>
        </div>

        {/* Bookings Management Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('doctor.bookings.title')}
              </h2>
              <p className="text-gray-600">
                {t('doctor.bookings.description')}
              </p>
            </div>
            <a
              href="/vet-bookings"
              className="flex items-center px-6 py-3 bg-[var(--color-vet-primary)] text-white rounded-xl hover:bg-[var(--color-vet-primary)]/90 transition-all shadow-lg hover:shadow-[var(--color-vet-primary)]/20 font-bold"
            >
              <Calendar className="h-5 w-5 ml-2" />
              {t('doctor.bookings.goToBookings')}
            </a>
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {t('doctor.modals.uploadVideo.title')}
                </h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  âœ•
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ط¹ظ†ظˆط§ظ† ط§ظ„ظپظٹط¯ظٹظˆ *
                  </label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    placeholder='ط£ط¯ط®ظ„ ط¹ظ†ظˆط§ظ† ط§ظ„ظپظٹط¯ظٹظˆ...'
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ظˆطµظپ ط§ظ„ظپظٹط¯ظٹظˆ
                  </label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    rows={3}
                    placeholder='طµظپ ظپظٹط¯ظٹظˆظƒ ط¨ط§ظ„طھظپطµظٹظ„...'
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ط§ظ„ظپط¦ط©
                    </label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    >
                      <option value="educational">طھط¹ظ„ظٹظ…ظٹ</option>
                      <option value="tutorial">ط¯ط±ظˆط³</option>
                      <option value="review">ظ…ط±ط§ط¬ط¹ط©</option>
                      <option value="caseStudy">ط¯ط±ط§ط³ط© ط­ط§ظ„ط©</option>
                      <option value="procedure">ط¥ط¬ط±ط§ط،</option>
                      <option value="other">ط£ط®ط±ظ‰</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ط§ظ„ظˆط³ظˆظ…
                    </label>
                    <input
                      type="text"
                      value={uploadForm.tags}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                      placeholder='ط£ط¶ظپ ظˆط³ظˆظ… ظ…ظپطµظˆظ„ط© ط¨ظپظˆط§طµظ„...'
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ظ…ظ„ظپ ط§ظ„ظپظٹط¯ظٹظˆ *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[var(--color-vet-primary)] transition-colors">
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="video-upload"
                      disabled={uploading}
                    />
                    <label htmlFor="video-upload" className="cursor-pointer">
                      <div className="w-12 h-12 bg-blue-100 text-[var(--color-vet-primary)] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {uploadFile ? uploadFile.name : 'ط§ظ†ظ‚ط± ظ„ظ„ط±ظپط¹'}
                      </p>
                      <p className="text-xs text-gray-500">
                        ط§ظ„ط­ط¯ ط§ظ„ط£ظ‚طµظ‰ ظ„ط­ط¬ظ… ط§ظ„ظپظٹط¯ظٹظˆ: 500 ظ…ظٹط¬ط§ط¨ط§ظٹطھطŒ ط§ظ„طµظٹط؛ ط§ظ„ظ…ط¯ط¹ظˆظ…ط©: MP4طŒ MOVطŒ AVI
                      </p>
                    </label>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={uploadForm.isPublic}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="h-4 w-4 text-[var(--color-vet-primary)] focus:ring-[var(--color-vet-primary)] border-gray-300 rounded"
                  />
                  <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                    ط§ط¬ط¹ظ„ ط¹ط§ظ…
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={uploading}
                  >
                    ط¥ظ„ط؛ط§ط،
                  </button>
                  <button
                    onClick={handleUpload}
                    className="px-4 py-2 bg-[var(--color-vet-primary)] text-white rounded-md hover:bg-[var(--color-vet-primary)] disabled:opacity-50 flex items-center"
                    disabled={uploading || !uploadFile || !uploadForm.title}
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ط¬ط§ط±ظٹ ط§ظ„ط±ظپط¹...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        ط±ظپط¹
                      </>
                    )}

                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto card-3d">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 border-b-2 border-primary-500 pb-2">
                  إعدادات العيادة والملف الشخصي
                </h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                  <h4 className="font-semibold text-blue-800 mb-2">بيانات العيادة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">عنوان العيادة التفصيلي</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-vet-primary)] outline-none transition-all"
                        value={profileForm.clinicAddress}
                        placeholder="مثال: 15 شارع الثورة - المهندسين - الجيزة"
                        onChange={(e) => setProfileForm({ ...profileForm, clinicAddress: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">المحافظة / المدينة</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-vet-primary)] outline-none transition-all"
                        value={profileForm.governorate}
                        placeholder="مثال: القاهرة"
                        onChange={(e) => setProfileForm({ ...profileForm, governorate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف للحجز</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-vet-primary)] outline-none transition-all"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-4">
                  <h4 className="font-semibold text-green-800 mb-2">تسعير الخدمات</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">سعر الكشف (ج.م)</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-vet-secondary)] outline-none transition-all"
                        value={profileForm.consultationFee}
                        onChange={(e) => setProfileForm({ ...profileForm, consultationFee: Number(e.target.value) })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">سعر العرض (اختياري)</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-vet-secondary)] outline-none transition-all"
                          placeholder="0"
                          value={profileForm.discountedFee}
                          onChange={(e) => setProfileForm({ ...profileForm, discountedFee: Number(e.target.value) })}
                        />
                        <span className="absolute left-3 top-3 text-gray-400 text-xs">اتركه 0 لإلغاء العرض</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* إظهار حقل تاريخ الانتهاء فقط في حال وجود خصم */}
                  {profileForm.discountedFee > 0 && (
                     <div className="mt-4">
                       <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ انتهاء العرض (اختياري)</label>
                       <input
                         type="datetime-local"
                         className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[var(--color-vet-secondary)] outline-none transition-all"
                         value={profileForm.discountExpiresAt ? new Date(profileForm.discountExpiresAt).toISOString().slice(0, 16) : ''}
                         onChange={(e) => setProfileForm({ ...profileForm, discountExpiresAt: e.target.value })}
                       />
                       <p className="text-xs text-gray-500 mt-1">متى ينتهي هذا السعر المخفض؟</p>
                     </div>
                  )}
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-4">
                  <h4 className="font-semibold text-purple-800 mb-2">المعلومات المهنية</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">التخصص</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                        value={profileForm.specialization}
                        onChange={(e) => setProfileForm({ ...profileForm, specialization: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">سنوات الخبرة</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                        value={profileForm.experienceYears}
                        onChange={(e) => setProfileForm({ ...profileForm, experienceYears: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[var(--color-vet-primary)] to-[var(--color-vet-primary)] text-white rounded-xl hover:from-[var(--color-vet-primary)] hover:to-[var(--color-vet-primary)] font-bold shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-1"
                  >
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DoctorDashboardLazy() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DoctorDashboardWrapper />
    </Suspense>
  )
}
