import { useEffect, useState } from 'react'
import api from '@/services/api'
import { useLanguageStore } from '@/stores/languageStore'
import { CreditCard, CheckCircle, Clock } from 'lucide-react'

type Invoice = {
  id: string
  type: 'appointment' | 'product'
  referenceId?: string
  amount: number
  currency: string
  status: 'pending' | 'paid' | 'cancelled'
  createdAt: string
  description?: string
}

const Billing = () => {
  const { t } = useLanguageStore()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const displayCurrency = (c: string) => {
    if (String(c).toUpperCase() === 'EGP') return 'ج.م'
    return c
  }

  const loadInvoices = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (statusFilter) params.status = statusFilter
      const res = await api.get('/payments/invoices', { params })
      const data = Array.isArray(res.data.invoices) ? res.data.invoices : []
      const normalized = data.map((i: any) => ({
        id: i._id || i.id,
        type: i.type,
        referenceId: i.referenceId,
        amount: i.amount,
        currency: i.currency || 'USD',
        status: i.status,
        createdAt: i.createdAt,
        description: i.description
      }))
      setInvoices(normalized)
    } catch (e) {
      console.error(e)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadInvoices() }, [statusFilter])

  const payInvoice = async (id: string) => {
    try {
      await api.patch(`/payments/invoices/${id}/pay`)
      await loadInvoices()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent">
            {t('nav.payments')}
          </h1>
          <div className="flex items-center gap-3">
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2">
              <option value="">الكل</option>
              <option value="pending">معلّق</option>
              <option value="paid">مدفوع</option>
              <option value="cancelled">ملغى</option>
            </select>
            <button onClick={loadInvoices} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">تحديث</button>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-primary-200 p-6">
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-600"></div>
              <p className="mt-3 text-neutral-600">{t('status.loading')}</p>
            </div>
          ) : invoices.length ? (
            <div className="space-y-4">
              {invoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between p-4 border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="bg-secondary-600 text-white rounded-xl p-3">
                      {inv.status === 'paid' ? <CheckCircle className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="font-semibold">{inv.type === 'appointment' ? 'فاتورة موعد' : 'فاتورة منتج'}</div>
                      <div className="text-sm text-neutral-600">{inv.description || inv.referenceId || ''}</div>
                      <div className="text-xs text-neutral-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(inv.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{inv.amount.toFixed(2)} {displayCurrency(inv.currency)}</div>
                    {inv.status === 'pending' ? (
                      <button onClick={()=>payInvoice(inv.id)} className="mt-2 px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700">ادفع الآن</button>
                    ) : (
                      <span className="mt-2 inline-block px-3 py-1 bg-green-100 text-[var(--color-vet-secondary)] rounded">مدفوع</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <CreditCard className="h-12 w-12 text-primary-600 inline-block mb-3" />
              <p className="text-neutral-600">لا توجد فواتير حالياً</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Billing
