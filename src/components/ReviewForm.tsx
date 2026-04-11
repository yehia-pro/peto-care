import React, { useState } from 'react'
import { Star, Send } from 'lucide-react'
import { useLanguageStore } from '../stores/languageStore'

interface ReviewFormProps {
  vetId: string
  onSubmit: (review: {
    rating: number
    comment: string
    title?: string
    petType?: string
    serviceType?: string
  }) => void
}

const ReviewForm: React.FC<ReviewFormProps> = ({ onSubmit }) => {
  const { t, currentLanguage } = useLanguageStore()
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [title, setTitle] = useState('')
  const [petType, setPetType] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const petTypes = [
    t('petTypes.dog'), t('petTypes.cat'), t('petTypes.bird'), t('petTypes.rabbit'), 
    t('petTypes.hamster'), t('petTypes.fish'), t('petTypes.turtle'), t('petTypes.horse'), 
    t('petTypes.livestock'), t('petTypes.other')
  ]

  const serviceTypes = [
    t('services.generalConsultation'), t('services.surgery'), t('services.vaccination'), 
    t('services.dental'), t('services.emergency'), t('services.diagnosticTests')
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      alert(t('reviews.selectRating'))
      return
    }
    if (comment.trim().length < 2) {
      alert(t('reviews.writeComment'))
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        rating,
        comment: comment.trim(),
        title: title.trim() || undefined,
        petType: petType || undefined,
        serviceType: serviceType || undefined
      })
      // Reset form
      setRating(0)
      setComment('')
      setTitle('')
      setPetType('')
      setServiceType('')
    } catch (error) {
      console.error('Error submitting review:', error)
      alert(t('reviews.submitError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('reviews.writeAReview')}</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('reviews.rating')} *
          </label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= (hoverRating || rating)
                      ? 'text-[var(--color-vet-accent)] fill-current'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('reviews.title')}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
            placeholder={t('reviews.summary')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              {t('reviews.petType')}
            </label>
            <select
              value={petType}
              onChange={(e) => setPetType(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
            >
              <option value="">{t('reviews.selectPetType')}</option>
              {petTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('reviews.serviceType')}
            </label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
            >
              <option value="">{t('reviews.selectServiceType')}</option>
              {serviceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('reviews.comment')} *
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
            placeholder={t('reviews.shareExperience')}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-secondary-600 text-white py-3 px-4 rounded-lg hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-secondary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium shadow-sm transition-all duration-200"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>{t('reviews.submitting')}</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{t('reviews.submit')}</span>
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default ReviewForm