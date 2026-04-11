import { useEffect, useState } from 'react'
import { MapPin, Navigation, CreditCard, CheckCircle, ShoppingCart, X, Plus, Minus, Package } from 'lucide-react'
import { deliveryAPI, paymentAPI } from '@/services/api'
import { useLanguageStore } from '@/stores/languageStore'
import { useCartStore } from '@/stores/cartStore'
import { Link } from 'react-router-dom'

const DeliveryRequest = () => {
  const { items, removeItem, updateQuantity, getTotal, clearCart, getItemCount } = useCartStore()
  const [pickupAddress, setPickupAddress] = useState('')
  const [dropoffAddress, setDropoffAddress] = useState('')
  const [pickupLat, setPickupLat] = useState<number | undefined>(undefined)
  const [pickupLng, setPickupLng] = useState<number | undefined>(undefined)
  const [dropoffLat, setDropoffLat] = useState<number | undefined>(undefined)
  const [dropoffLng, setDropoffLng] = useState<number | undefined>(undefined)
  const [distanceMeters, setDistanceMeters] = useState(0)
  const [creating, setCreating] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'card'|'cod'|'wallet'>('card')
  const [orderId, setOrderId] = useState<string>('')
  const [clientSecret, setClientSecret] = useState('')
  const { t } = useLanguageStore()

  useEffect(() => {
    if (pickupLat && pickupLng && dropoffLat && dropoffLng) {
      const R = 6371000
      const toRad = (v: number) => v * Math.PI / 180
      const dLat = toRad((dropoffLat as number) - (pickupLat as number))
      const dLng = toRad((dropoffLng as number) - (pickupLng as number))
      const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(pickupLat as number)) * Math.cos(toRad(dropoffLat as number)) * Math.sin(dLng/2) ** 2
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      setDistanceMeters(Math.round(R * c))
    }
  }, [pickupLat, pickupLng, dropoffLat, dropoffLng])

  const useCurrentLocation = (type: 'pickup' | 'dropoff') => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        if (type === 'pickup') { setPickupLat(pos.coords.latitude); setPickupLng(pos.coords.longitude) }
        else { setDropoffLat(pos.coords.latitude); setDropoffLng(pos.coords.longitude) }
      })
    }
  }

  const createOrder = async () => {
    if (!pickupAddress || !dropoffAddress || items.length === 0) return
    setCreating(true)
    try {
      const totalAmount = getTotal()
      const res = await deliveryAPI.createOrder({ 
        pickupAddress, 
        dropoffAddress, 
        pickupLat, 
        pickupLng, 
        dropoffLat, 
        dropoffLng, 
        distanceMeters, 
        paymentMethod,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount
      })
      setOrderId(res.data.order.id)
      if (paymentMethod === 'card') {
        const amount = res.data.order.feeAmount + totalAmount
        const currency = res.data.order.currency
        const pi = await paymentAPI.createPaymentIntent(amount, currency)
        setClientSecret(pi.data.clientSecret)
      }
      clearCart()
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent mb-4">
            {t('pages.delivery.request.title')}
          </h1>
          <p className="text-xl text-neutral-700">{t('pages.delivery.request.desc')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Section */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-primary-200 p-6 card-3d sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-neutral-800 flex items-center">
                  <ShoppingCart className="w-6 h-6 text-primary-600 mr-2" />
                  {t('cart.title') || 'سلة الشراء'}
                </h2>
                <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-bold">
                  {getItemCount()}
                </span>
              </div>
              
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                  <p className="text-neutral-600 mb-4">{t('cart.empty') || 'السلة فارغة'}</p>
                  <Link
                    to="/products"
                    className="inline-block bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                  >
                    {t('cart.shopNow') || 'تسوق الآن'}
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="bg-gradient-to-br from-neutral-50 to-white rounded-xl p-4 border border-neutral-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-neutral-800 text-sm">{item.name}</h3>
                          {item.storeName && (
                            <p className="text-xs text-neutral-500">{item.storeName}</p>
                          )}
                          <p className="text-primary-600 font-bold mt-1">{item.price} {t('currency.egp') || 'ج.م'}</p>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-error-500 hover:text-error-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 bg-neutral-100 rounded-lg px-2 py-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="text-neutral-600 hover:text-primary-600 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold text-neutral-800 w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="text-neutral-600 hover:text-primary-600 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <span className="font-bold text-secondary-600">
                          {(item.price * item.quantity).toFixed(2)} {t('currency.egp') || 'ج.م'}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="border-t-2 border-primary-200 pt-4 mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-neutral-700">{t('cart.subtotal') || 'المجموع الفرعي'}:</span>
                      <span className="font-bold text-primary-600">{getTotal().toFixed(2)} {t('currency.egp') || 'ج.م'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg text-neutral-800">{t('cart.total') || 'الإجمالي'}:</span>
                      <span className="font-bold text-lg text-primary-600">{getTotal().toFixed(2)} {t('currency.egp') || 'ج.م'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Form */}
          <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('pages.delivery.pickup')}</label>
              <div className="flex items-center border rounded-md px-3 py-2">
                <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                <input className="flex-1 outline-none" value={pickupAddress} onChange={(e)=>setPickupAddress(e.target.value)} placeholder={t('pages.delivery.pickup')} />
                <button onClick={()=>useCurrentLocation('pickup')} className="ml-2 text-[var(--color-vet-primary)]">{t('pages.delivery.currentLocation')}</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('pages.delivery.dropoff')}</label>
              <div className="flex items-center border rounded-md px-3 py-2">
                <Navigation className="w-4 h-4 text-gray-400 mr-2" />
                <input className="flex-1 outline-none" value={dropoffAddress} onChange={(e)=>setDropoffAddress(e.target.value)} placeholder={t('pages.delivery.dropoff')} />
                <button onClick={()=>useCurrentLocation('dropoff')} className="ml-2 text-[var(--color-vet-primary)]">{t('pages.delivery.currentLocation')}</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
              <div className="bg-blue-50 rounded-lg p-3">{t('pages.delivery.distance')}: <span className="font-semibold">{distanceMeters} م</span></div>
              <div className="bg-green-50 rounded-lg p-3">{t('pages.delivery.feeNote')}</div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm text-gray-700">
              <label className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                <input type="radio" checked={paymentMethod==='card'} onChange={()=>setPaymentMethod('card')} />
                <span>بطاقة</span>
              </label>
              <label className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                <input type="radio" checked={paymentMethod==='cod'} onChange={()=>setPaymentMethod('cod')} />
                <span>دفع عند الاستلام</span>
              </label>
              <label className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                <input type="radio" checked={paymentMethod==='wallet'} onChange={()=>setPaymentMethod('wallet')} />
                <span>محفظة إلكترونية</span>
              </label>
            </div>
            <button 
              onClick={createOrder} 
              disabled={creating || items.length === 0 || !pickupAddress || !dropoffAddress} 
              className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300"
            >
              {creating ? t('pages.delivery.creatingOrder') : t('pages.delivery.createOrder')}
            </button>
          </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-primary-200 p-6 card-3d">
            <div className="flex items-center text-sm text-neutral-600 mb-4">
              <CreditCard className="w-5 h-5 text-primary-600 mr-2" />
              <span className="font-semibold">{t('payment.secure')}</span>
            </div>
            {orderId && (
              <div className="space-y-3 bg-gradient-to-br from-success-50 to-success-100 rounded-xl p-4 border border-success-200">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-700 font-medium">{t('order.id')}:</span>
                  <span className="font-bold text-primary-600">{orderId}</span>
                </div>
                {clientSecret ? (
                  <div className="flex items-center text-success-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="font-semibold">{t('payment.created')}</span>
                  </div>
                ) : (
                  <div className="text-neutral-500">{t('payment.preparing')}</div>
                )}
                <div className="pt-2">
                  <Link to="/billing" className="inline-flex items-center px-4 py-2 bg-[var(--color-vet-secondary)] text-white rounded-lg hover:bg-[var(--color-vet-secondary)]">
                    {t('pages.delivery.goPayInvoice') || 'الذهاب لدفع الفاتورة'}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeliveryRequest
