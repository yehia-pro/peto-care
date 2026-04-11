import { useState, useEffect } from 'react'
import { Modal } from 'antd'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { paymentAPI } from '../../services/api'
import { toast } from 'react-hot-toast'

// Initialize Stripe outside component
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

interface PaymentModalProps {
    isOpen: boolean
    onClose: () => void
    amount: number
    currency?: string
    metadata?: Record<string, any>
    onSuccess: () => void
    title?: string
}

const CheckoutForm = ({ amount, currency = 'usd', metadata, onSuccess, onClose }: Omit<PaymentModalProps, 'isOpen'>) => {
    const stripe = useStripe()
    const elements = useElements()
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()

        if (!stripe || !elements) return

        setIsProcessing(true)

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: window.location.href, // This handles the redirect flow if needed
            },
            redirect: 'if_required'
        })

        if (error) {
            setErrorMessage(error.message || 'فشل الدفع')
            setIsProcessing(false)
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            // Notify backend of success (if manual confirmation needed, but webhook handles mostly)
            // We can also call a confirm endpoint here for immediate UI update
            try {
                await paymentAPI.confirmPayment(paymentIntent.id)
                toast.success('Payment successful!')
                onSuccess()
                onClose()
            } catch (err) {
                console.error('Confirmation error:', err)
                // Even if backend confirm fails here, webhook should catch it
                onSuccess()
                onClose()
            }
            setIsProcessing(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />
            {errorMessage && <div className="text-red-500 text-sm mt-2">{errorMessage}</div>}
            <button
                type="submit"
                disabled={!stripe || isProcessing}
                className="w-full bg-[var(--color-vet-primary)] text-white py-2 px-4 rounded-lg font-bold hover:bg-[var(--color-vet-primary)] transition disabled:opacity-50"
            >
                {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
            </button>
        </form>
    )
}

export const PaymentModal = (props: PaymentModalProps) => {
    const [clientSecret, setClientSecret] = useState<string | null>(null)

    useEffect(() => {
        if (props.isOpen && props.amount > 0) {
            // Create PaymentIntent when modal opens
            const createIntent = async () => {
                try {
                    const res = await paymentAPI.createPaymentIntent(Math.round(props.amount * 100), props.currency || 'usd', props.metadata)
                    setClientSecret(res.data.clientSecret)
                } catch (error) {
                    console.error('Failed to init payment:', error)
                    toast.error('تعذر تهيئة الدفع حالياً')
                    props.onClose()
                }
            }
            createIntent()
        }
    }, [props.isOpen, props.amount])

    return (
        <Modal
            title={props.title || "Secure Payment"}
            open={props.isOpen}
            onCancel={props.onClose}
            footer={null}
            destroyOnClose
        >
            {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm {...props} />
                </Elements>
            ) : (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-vet-primary)]"></div>
                </div>
            )}
        </Modal>
    )
}
