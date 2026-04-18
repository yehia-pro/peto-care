import { useEffect, useState } from 'react'
import { Users, MapPin, Settings, Truck, Plus } from 'lucide-react'
import { deliveryAPI, zonesAPI } from '@/services/api'
import { useLanguageStore } from '@/stores/languageStore'

const DeliveryAdmin = () => {
  const [drivers, setDrivers] = useState<any[]>([])
  const [tariffs, setTariffs] = useState<any[]>([])
  const [newDriver, setNewDriver] = useState({ name: '', phone: '', vehiclePlate: '' })
  const [newTariff, setNewTariff] = useState({ city: 'default', baseFee: 20, perKmFee: 10, currency: 'EGP' })
  const [zones, setZones] = useState<any[]>([])
  const [newZone, setNewZone] = useState({ name: '', cities: '' })
  const { t } = useLanguageStore()

  const fetchAll = async () => {
    const ds = await deliveryAPI.getDrivers()
    setDrivers(ds.data.drivers)
    const ts = await deliveryAPI.getTariffs()
    setTariffs(ts.data.tariffs)
    const zs = await zonesAPI.getZones()
    setZones(zs.data.zones)
  }

  useEffect(() => { fetchAll() }, [])

  const addDriver = async () => {
    if (!newDriver.name) return
    await deliveryAPI.createDriver(newDriver)
    setNewDriver({ name: '', phone: '', vehiclePlate: '' })
    fetchAll()
  }

  const addTariff = async () => {
    await deliveryAPI.createTariff({ ...newTariff, baseFee: Number(newTariff.baseFee), perKmFee: Number(newTariff.perKmFee) })
    setNewTariff({ city: 'default', baseFee: 20, perKmFee: 10, currency: 'EGP' })
    fetchAll()
  }

  const addZone = async () => {
    if (!newZone.name) return
    const cities = newZone.cities.split(',').map(c=>c.trim()).filter(Boolean)
    await zonesAPI.createZone({ name: newZone.name, cities })
    setNewZone({ name: '', cities: '' })
    fetchAll()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('pages.admin.delivery.title')}</h1>
          <p className="text-gray-600">{t('pages.admin.delivery.drivers')}، {t('pages.admin.delivery.tariffs')}، {t('pages.admin.delivery.zones')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4"><Truck className="w-5 h-5 text-[var(--color-vet-primary)] mr-2" /><h2 className="text-lg font-semibold">{t('pages.admin.delivery.drivers')}</h2></div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input className="border rounded-md px-3 py-2" placeholder="الاسم" value={newDriver.name} onChange={(e)=>setNewDriver({...newDriver, name: e.target.value})} />
                <input className="border rounded-md px-3 py-2" placeholder="الهاتف" value={newDriver.phone} maxLength={11} onChange={(e)=>setNewDriver({...newDriver, phone: e.target.value.replace(/\D/g, '').slice(0, 11)})} />
                <input className="border rounded-md px-3 py-2" placeholder="لوحة المركبة" value={newDriver.vehiclePlate} onChange={(e)=>setNewDriver({...newDriver, vehiclePlate: e.target.value})} />
              </div>
              <button onClick={addDriver} className="bg-[var(--color-vet-primary)] text-white px-4 py-2 rounded-md flex items-center"><Plus className="w-4 h-4 mr-1" />إضافة سائق</button>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {drivers.map((d)=> (
                  <div key={d.id} className="border rounded-lg p-3">
                    <div className="font-semibold text-gray-900">{d.name}</div>
                    <div className="text-sm text-gray-600">{d.phone}</div>
                    <div className="text-sm text-gray-600">{d.vehiclePlate}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4"><Settings className="w-5 h-5 text-[var(--color-vet-secondary)] mr-2" /><h2 className="text-lg font-semibold">{t('pages.admin.delivery.tariffs')}</h2></div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input className="border rounded-md px-3 py-2" placeholder="المدينة" value={newTariff.city} onChange={(e)=>setNewTariff({...newTariff, city: e.target.value})} />
                <input type="number" className="border rounded-md px-3 py-2" placeholder="أساسي" value={newTariff.baseFee} onChange={(e)=>setNewTariff({...newTariff, baseFee: Number(e.target.value)})} />
                <input type="number" className="border rounded-md px-3 py-2" placeholder="لكل كم" value={newTariff.perKmFee} onChange={(e)=>setNewTariff({...newTariff, perKmFee: Number(e.target.value)})} />
                <select className="border rounded-md px-3 py-2" value={newTariff.currency} onChange={(e)=>setNewTariff({...newTariff, currency: e.target.value})}>
                  <option>EGP</option>
                  <option>USD</option>
                </select>
              </div>
              <button onClick={addTariff} className="bg-[var(--color-vet-secondary)] text-white px-4 py-2 rounded-md flex items-center"><Plus className="w-4 h-4 mr-1" />إضافة تعريف</button>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {tariffs.map((t)=> (
                  <div key={t.id} className="border rounded-lg p-3">
                    <div className="font-semibold text-gray-900">{t.city}</div>
                    <div className="text-sm text-gray-600">أساسي: {t.baseFee} {t.currency}</div>
                    <div className="text-sm text-gray-600">لكل كم: {t.perKmFee} {t.currency}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4"><MapPin className="w-5 h-5 text-[var(--color-vet-secondary)] mr-2" /><h2 className="text-lg font-semibold">{t('pages.admin.delivery.zones')}</h2></div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="border rounded-md px-3 py-2" placeholder="اسم المنطقة" value={newZone.name} onChange={(e)=>setNewZone({...newZone, name: e.target.value})} />
                <input className="border rounded-md px-3 py-2" placeholder="مدن (مفصولة بفاصلة)" value={newZone.cities} onChange={(e)=>setNewZone({...newZone, cities: e.target.value})} />
              </div>
              <button onClick={addZone} className="bg-[var(--color-vet-secondary)] text-white px-4 py-2 rounded-md flex items-center"><Plus className="w-4 h-4 mr-1" />إضافة منطقة</button>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {zones.map((z)=> (
                  <div key={z.id} className="border rounded-lg p-3">
                    <div className="font-semibold text-gray-900">{z.name}</div>
                    <div className="text-sm text-gray-600">{(z.cities||[]).join(', ')}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeliveryAdmin
