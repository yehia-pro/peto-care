import { useEffect, useRef, useState } from 'react'
import { Truck, MapPin, Timer, Star } from 'lucide-react'
import io from 'socket.io-client'
import { deliveryAPI } from '@/services/api'
import { LiveMap } from '@/components/LiveMap'
import { useLanguageStore } from '@/stores/languageStore'

const DeliveryTracking = () => {
  const [orderId, setOrderId] = useState('')
  const [status, setStatus] = useState('')
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const { t } = useLanguageStore()
  const socketRef = useRef<any>(null)

  useEffect(() => {
    try {
      const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace('/api', '')
      socketRef.current = io(SOCKET_URL)
      socketRef.current.on('delivery:status', (p: any) => { if (p.orderId === orderId) setStatus(p.status) })
      socketRef.current.on('delivery:assigned', (p: any) => { if (p.orderId === orderId) setStatus('assigned') })
      socketRef.current.on('delivery:location', (p: any) => { if (p.orderId === orderId) setCoords({ lat: p.lat, lng: p.lng }) })
    } catch (e) { console.error(e) }
    const interval = setInterval(() => { if (orderId) loadOrder() }, 5000)
    return () => { socketRef.current && socketRef.current.disconnect(); clearInterval(interval) }
  }, [orderId])

  const loadOrder = async () => {
    if (!orderId) return
    const res = await deliveryAPI.getOrder(orderId)
    setStatus(res.data.order.status)
  }

  const submitRating = async () => {
    if (!orderId || rating < 1) return
    await deliveryAPI.rateOrder(orderId, rating, comment)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('pages.delivery.tracking.title')}</h1>
          <p className="text-gray-600">{t('pages.delivery.tracking.desc')}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="border rounded-md px-3 py-2" placeholder={t('pages.delivery.tracking.orderIdPlaceholder')} value={orderId} onChange={(e) => setOrderId(e.target.value)} />
            <button onClick={loadOrder} className="bg-[var(--color-vet-primary)] text-white px-4 py-2 rounded-md">{t('actions.update')}</button>
            <div className="flex items-center text-sm text-gray-600"><Timer className="w-4 h-4 text-[var(--color-vet-primary)] mr-2" />{t('status.label')}: <span className="ml-2 font-semibold">{status || t('status.unavailable')}</span></div>
          </div>
          <div className="mt-4">
            <div className="relative w-full h-96 bg-gray-100 rounded-xl overflow-hidden shadow-inner">
              <LiveMap driverLocation={coords} />
              {!coords && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
                  <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <Truck className="w-5 h-5 text-[var(--color-vet-primary)] animate-pulse" />
                    <span className="font-medium text-gray-700">{t('status.waitingDriver')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          {status === 'delivered' && (
            <div className="mt-6 border-t pt-4">
              <div className="text-gray-800 font-semibold mb-2">{t('rating.title')}</div>
              <div className="flex items-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)} className={"p-1 " + (rating >= s ? 'text-[var(--color-vet-accent)]' : 'text-gray-300')}><Star className="w-5 h-5" /></button>
                ))}
              </div>
              <textarea className="w-full border rounded-md px-3 py-2" placeholder={t('rating.commentPlaceholder')} value={comment} onChange={(e) => setComment(e.target.value)} />
              <button onClick={submitRating} className="mt-2 bg-[var(--color-vet-primary)] text-white px-4 py-2 rounded-md">{t('rating.submit')}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DeliveryTracking
