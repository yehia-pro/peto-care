import React, { useState, useEffect } from 'react'
import { Star, Edit, Trash2, User, Calendar, Filter } from 'lucide-react'
import { useLanguageStore } from '../stores/languageStore'
import { API_BASE_URL } from '@/services/api';

interface Review {
  id: string
  rating: number
  comment: string
  title?: string
  petType?: string
  serviceType?: string
  createdAt: string
  user: {
    id: string
    fullName: string
    email: string
  }
  vet: {
    id: string
    fullName: string
  }
}

interface ReviewManagerProps {
  vetId?: string
  userId?: string
  mode: 'received' | 'given' | 'manage'
}

const ReviewManager: React.FC<ReviewManagerProps> = ({ vetId, userId, mode }) => {
  const { t, currentLanguage } = useLanguageStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [filterPetType, setFilterPetType] = useState('')
  const [editingReview, setEditingReview] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ rating: 0, comment: '', title: '' })

  const petTypes = [
    t('pets.types.dog'), t('pets.types.cat'), t('pets.types.bird'), t('pets.types.rabbit'), 
    t('pets.types.hamster'), t('pets.types.fish'), t('pets.types.turtle'), t('pets.types.horse'), 
    t('pets.types.livestock'), t('pets.types.other')
  ]

  useEffect(() => {
    fetchReviews()
  }, [vetId, userId, mode])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      let endpoint = '/api/reviews'
      
      if (mode === 'received' && vetId) {
        endpoint = `/api/reviews/vet/${vetId}`
      } else if (mode === 'given' && userId) {
        endpoint = '/api/reviews/my-reviews'
      } else if (mode === 'manage') {
        endpoint = '/api/reviews'
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch reviews')
      
      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (review: Review) => {
    setEditingReview(review.id)
    setEditForm({
      rating: review.rating,
      comment: review.comment,
      title: review.title || ''
    })
  }

  const handleUpdate = async (reviewId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editForm)
      })

      if (!response.ok) throw new Error('Failed to update review')
      
      await fetchReviews()
      setEditingReview(null)
    } catch (error) {
      console.error('Error updating review:', error)
      alert('Failed to update review')
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return

    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) throw new Error('Failed to delete review')
      
      await fetchReviews()
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Failed to delete review')
    }
  }

  const filteredReviews = reviews.filter(review => {
    if (filterRating && review.rating !== filterRating) return false
    if (filterPetType && review.petType !== filterPetType) return false
    return true
  })

  const getTitle = () => {
    switch (mode) {
      case 'received': return 'Reviews Received'
      case 'given': return 'My Reviews'
      case 'manage': return 'Manage Reviews'
      default: return 'Reviews'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-vet-primary)]"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-800">{getTitle()}</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-neutral-500" />
            <select
              value={filterRating || ''}
              onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
              className="px-3 py-1 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
            >
              <option value="">{t('reviews.allRatings')}</option>
              <option value="5">{t('reviews.stars.5')}</option>
              <option value="4">{t('reviews.stars.4')}</option>
              <option value="3">{t('reviews.stars.3')}</option>
              <option value="2">{t('reviews.stars.2')}</option>
              <option value="1">{t('reviews.stars.1')}</option>
            </select>
          </div>
          <select
            value={filterPetType}
            onChange={(e) => setFilterPetType(e.target.value)}
            className="px-3 py-1 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500"
          >
            <option value="">{t('reviews.allPetTypes')}</option>
            {petTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="text-center py-8 text-neutral-500">
          <User className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
          <p>{t('reviews.noReviews')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div key={review.id} className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
              {editingReview === review.id ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setEditForm({ ...editForm, rating: star })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= editForm.rating
                              ? 'text-[var(--color-vet-accent)] fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    placeholder="Review title"
                  />
                  <textarea
                    value={editForm.comment}
                    onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    placeholder="Your review..."
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdate(review.id)}
                      className="px-4 py-2 bg-[var(--color-vet-primary)] text-white rounded-md hover:bg-[var(--color-vet-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingReview(null)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? 'text-[var(--color-vet-accent)] fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      {review.title && (
                        <h4 className="font-medium text-gray-800">{review.title}</h4>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-gray-700 mb-2">{review.comment}</p>
                    <div className="flex flex-wrap gap-2 text-sm">
                      {review.petType && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {review.petType}
                        </span>
                      )}
                      {review.serviceType && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                          {review.serviceType}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>
                        {mode === 'received' ? review.user.fullName : review.vet.fullName}
                      </span>
                    </div>
                    {mode === 'given' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(review)}
                          className="flex items-center space-x-1 px-3 py-1 text-secondary-600 hover:bg-secondary-50 rounded-lg transition-all duration-200"
                        >
                          <Edit className="w-4 h-4" />
                          <span>{t('reviews.edit')}</span>
                        </button>
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="flex items-center space-x-1 px-3 py-1 text-error-600 hover:bg-error-50 rounded-lg transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>{t('reviews.delete')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ReviewManager