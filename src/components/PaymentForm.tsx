import React, { useState } from 'react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { CreditCard, Lock } from 'lucide-react'
import { useLanguageStore } from '../stores/languageStore'
import { paymentAPI } from '../services/api'

interface PaymentFormProps {
  amount: number
  onSuccess: (paymentIntentId: string) => void
  onCancel: () => void
}

const PaymentForm: React.FC<PaymentFormProps> = ({ amount, onSuccess, onCancel }) => {
  const { t } = useLanguageStore()
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('card')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create payment intent
      const { data: { clientSecret } } = await paymentAPI.createPaymentIntent(amount * 100) // Convert to cents

      // Confirm payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: 'Customer Name',
            email: 'customer@example.com'
          }
        }
      })

      if (result.error) {
        setError(result.error.message || t('payment.failed'))
      } else if (result.paymentIntent?.status === 'succeeded') {
        onSuccess(result.paymentIntent.id)
      }
    } catch (err) {
      setError(t('payment.error'))
      console.error('Payment error:', err)
    } finally {
      setLoading(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-[var(--color-vet-primary)]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('payment.title')}</h2>
        <p className="text-gray-600">{t('payment.securePaymentNotice')}</p>
      </div>

      {/* Payment Amount */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">{t('payment.totalAmount')}:</span>
          <span className="text-2xl font-bold text-gray-900">${amount.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {t('payment.method')}
        </label>
        <div className="space-y-2">
          <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-3"
            />
            <div className="flex items-center">
              <CreditCard className="w-5 h-5 text-gray-600 mr-2" />
              <span>{t('payment.creditDebitCard')}</span>
            </div>
          </label>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('payment.cardDetails')}
          </label>
          <div className="border border-gray-300 rounded-lg p-3">
            <CardElement 
              options={cardElementOptions}
              className="w-full"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={!stripe || loading}
            className="flex-1 px-4 py-3 bg-[var(--color-vet-primary)] text-white rounded-lg hover:bg-[var(--color-vet-primary)] disabled:bg-[var(--color-vet-primary)] disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                {t('payment.payNow')} ${amount.toFixed(2)}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Security Notice */}
      <div className="mt-6 text-center">
        <div className="flex items-center justify-center text-sm text-gray-600">
          <Lock className="w-4 h-4 mr-1" />
          {t('payment.securePaymentNotice')}
        </div>
      </div>
    </div>
  )
}

export default PaymentForm