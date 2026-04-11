import { useEffect, useMemo, useState } from 'react'
import { reviewsAPI } from '@/services/api'
import { Star, Send } from 'lucide-react'

type Review = {
  id: string
  userId: string
  rating: number
  comment: string
  title?: string
  createdAt: string
}

type Props = {
  vetId: string
}

const ReviewsWidget = ({ vetId }: Props) => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await reviewsAPI.getReviews(vetId)
      const data = Array.isArray(res.data.reviews) ? res.data.reviews : []
      setReviews(data.map((r: any) => ({ id: r._id || r.id, userId: r.userId, rating: r.rating, comment: r.comment, title: r.title, createdAt: r.createdAt })))
    } catch {
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [vetId])

  const average = useMemo(() => {
    if (!reviews.length) return 0
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    return Math.round((sum / reviews.length) * 10) / 10
  }, [reviews])

  const submit = async () => {
    if (!comment.trim()) return
    setSubmitting(true)
    try {
      await reviewsAPI.createReview({ vetId, rating, comment, title })
      setTitle('')
      setComment('')
      setRating(5)
      await load()
    } catch (e) {
      console.error(e)
    }
    setSubmitting(false)
  }

  return (
    <div className="bg-white/90 rounded-2xl shadow-xl border border-primary-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[var(--color-vet-accent)]">
          <Star className="w-5 h-5" />
          <span className="font-semibold">{average} / 5</span>
        </div>
        <span className="text-sm text-neutral-600">{reviews.length} مراجعة</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">أضف مراجعة</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-neutral-700">التقييم</label>
              <select value={rating} onChange={e=>setRating(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2">
                {[5,4,3,2,1].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-neutral-700">العنوان (اختياري)</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="text-sm text-neutral-700">التعليق</label>
              <textarea value={comment} onChange={e=>setComment(e.target.value)} className="w-full border rounded-lg px-3 py-2" rows={4} />
            </div>
            <button onClick={submit} disabled={submitting} className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 inline-flex items-center gap-2">
              <Send className="w-4 h-4" />
              <span>{submitting ? 'جاري الإرسال...' : 'إرسال'}</span>
            </button>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">المراجعات</h3>
          {loading ? (
            <div className="text-neutral-600">جاري التحميل...</div>
          ) : reviews.length ? (
            <div className="space-y-3">
              {reviews.map(r => (
                <div key={r.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="text-[var(--color-vet-accent)] flex items-center gap-1"><Star className="w-4 h-4" /> {r.rating}</div>
                    <div className="text-xs text-neutral-500">{new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                  {r.title && <div className="font-semibold">{r.title}</div>}
                  <div className="text-sm text-neutral-700">{r.comment}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-neutral-600">لا توجد مراجعات بعد</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReviewsWidget
