import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { vetsAPI, reviewsAPI } from '@/services/api'
import ReviewsWidget from '@/components/ReviewsWidget'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { Star, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface VetDetail {
  id: string
  user?: { fullName?: string; email?: string }
  fullName?: string
  specialization?: string
  country?: string
  clinicName?: string
  yearsOfExperience?: number
  phone?: string
  verified?: boolean
}

interface ReviewItem {
  id: string
  rating: number
  comment: string
  createdAt?: string
  user?: { fullName?: string }
}

export default function PublicVetProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { t } = useLanguageStore()
  const [vet, setVet] = useState<VetDetail | null>(null)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const resVet = await vetsAPI.getVet(String(id))
        setVet(resVet.data?.vet || null)
      } catch {
        setVet(null)
      }
      try {
        const resReviews = await reviewsAPI.getReviews(String(id))
        const list = Array.isArray(resReviews.data?.reviews) ? resReviews.data.reviews : []
        setReviews(list)
      } catch {
        setReviews([])
      }
      setLoading(false)
    }
    load()
  }, [id])

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star key={index} className={`h-5 w-5 ${index < Math.floor(rating) ? 'text-[var(--color-vet-accent)] fill-current' : 'text-gray-300'}`} />
    ))
  }

  const avgRating = reviews.length ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1) : '0.0'

  const handleCreateReview = async () => {
    if (!user) { toast.error(t('auth.pleaseLogin')); navigate('/login'); return }
    if (!reviewForm.comment.trim()) { toast.error(t('reviews.writeComment')); return }
    setSubmitting(true)
    try {
      await reviewsAPI.createReview({ vetId: String(id), rating: reviewForm.rating, comment: reviewForm.comment })
      const resReviews = await reviewsAPI.getReviews(String(id))
      const list = Array.isArray(resReviews.data?.reviews) ? resReviews.data.reviews : []
      setReviews(list)
      setReviewForm({ rating: 5, comment: '' })
      toast.success(t('reviews.submitSuccess') || 'تم إضافة التقييم')
    } catch {
      toast.error(t('reviews.submitError') || 'فشل إرسال التقييم')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="p-6">{t('status.loading') || 'جاري التحميل...'}</div>
  }

  if (!vet) {
    return <div className="p-6">{t('common.noResults') || 'لا توجد بيانات للطبيب'}</div>
  }

  const displayName = vet.user?.fullName || vet.fullName || vet.clinicName || ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">{displayName}</h2>
              <p className="text-neutral-600">{vet.specialization}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 justify-end">
                {renderStars(Number(avgRating))}
                <span className="text-sm text-neutral-600">({avgRating})</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-700">
            <div><span className="font-semibold">{t('auth.country')}:</span> {vet.country || '-'}</div>
            <div><span className="font-semibold">{t('vet.registration.clinicName')}:</span> {vet.clinicName || '-'}</div>
            <div><span className="font-semibold">{t('vet.registration.experience')}:</span> {vet.yearsOfExperience || 0} {t('common.years') || 'years'}</div>
            <div><span className="font-semibold">{t('contact.phone')}:</span> {vet.phone || '-'}</div>
            <div><span className="font-semibold">Email:</span> {vet.user?.email || '-'}</div>
          </div>
          <div className="mt-6">
            <button onClick={() => navigate(`/services?vetId=${vet.id}&vetName=${encodeURIComponent(displayName)}`)} className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>{t('appointments.bookAppointment') || 'احجز موعد'}</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h3 className="text-lg font-semibold mb-4">{t('reviews.allRatings') || 'التقييمات'}</h3>
          <div className="space-y-4">
            {reviews.length === 0 && (
              <div className="text-neutral-600">{t('status.noStores') || 'لا توجد تقييمات بعد'}</div>
            )}
            {reviews.map((r) => (
              <div key={r.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">{r.user?.fullName || t('reviews.user') || 'مستخدم'}</div>
                  <div className="flex items-center space-x-1">{renderStars(r.rating)}</div>
                </div>
                <div className="text-sm text-neutral-700">{r.comment}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-lg font-semibold mb-4">{t('reviews.writeComment') || 'أضف تقييمك'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-neutral-700 mb-1">{t('reviews.selectRating') || 'التقييم'}</label>
              <select value={reviewForm.rating} onChange={(e)=>setReviewForm({ ...reviewForm, rating: Number(e.target.value)})} className="w-full border rounded p-2">
                {[5,4,3,2,1].map(n=> <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-neutral-700 mb-1">{t('reviews.summary') || 'تعليقك'}</label>
              <textarea value={reviewForm.comment} onChange={(e)=>setReviewForm({ ...reviewForm, comment: e.target.value })} className="w-full border rounded p-2" rows={3} placeholder={t('reviews.shareExperience') || 'شارك تجربتك مع هذا الطبيب...'} />
            </div>
          </div>
          <div className="mt-4">
            <button onClick={handleCreateReview} disabled={submitting} className="bg-secondary-600 text-white px-6 py-2 rounded hover:bg-secondary-700 disabled:opacity-50">
              {submitting ? t('common.loading') : t('reviews.submit') || 'إرسال'}
            </button>
          </div>
        </div>
        <div className="mt-6">
          <ReviewsWidget vetId={String(id)} />
        </div>
      </div>
    </div>
  )
}
