import React, { useState } from 'react';
import { MapPin, Phone, AlertTriangle, Heart, Shield } from 'lucide-react';
import { useLanguageStore } from '../stores/languageStore';

const governorates = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة', 'الفيوم',
  'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية', 'الوادي الجديد',
  'السويس', 'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط', 'الشرقية',
  'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'الأقصر', 'قنا', 'شمال سيناء', 'سوهام'
];

const mockVets = [
  { id: 1, name: 'د. أحمد علي', location: 'القاهرة', phone: '01000000001', address: '123 المعادي', distance: '2.5 كم' },
  { id: 2, name: 'د. سارة محمد', location: 'الجيزة', phone: '01000000002', address: '45 الدقي', distance: '1.2 كم' },
  { id: 3, name: 'د. خالد عمر', location: 'الإسكندرية', phone: '01000000003', address: '78 الكورنيش', distance: '3.0 كم' },
  { id: 4, name: 'د. منى حسن', location: 'القاهرة', phone: '01000000004', address: '56 مدينة نصر', distance: '5.0 كم' },
];

const Emergency = () => {
  const { t } = useLanguageStore();
  const [selectedGov, setSelectedGov] = useState('');
  const [locationStatus, setLocationStatus] = useState('');
  const [nearbyVets, setNearbyVets] = useState<typeof mockVets>([]);

  const firstAidTips = [
    {
      title: t('emergency.tips.heatStroke'),
      animal: 'Dogs & Cats',
      steps: [
        t('emergency.tips.heatStroke_step1'),
        t('emergency.tips.heatStroke_step2'),
        t('emergency.tips.heatStroke_step3'),
        t('emergency.tips.heatStroke_step4')
      ]
    },
    {
      title: t('emergency.tips.poisoning'),
      animal: 'All Pets',
      steps: [
        t('emergency.tips.poisoning_step1'),
        t('emergency.tips.poisoning_step2'),
        t('emergency.tips.poisoning_step3'),
        t('emergency.tips.poisoning_step4')
      ]
    },
    {
      title: t('emergency.tips.bleeding'),
      animal: 'All Pets',
      steps: [
        t('emergency.tips.bleeding_step1'),
        t('emergency.tips.bleeding_step2'),
        t('emergency.tips.bleeding_step3'),
        t('emergency.tips.bleeding_step4')
      ]
    },
    {
      title: t('emergency.tips.choking'),
      animal: 'Dogs',
      steps: [
        t('emergency.tips.choking_step1'),
        t('emergency.tips.choking_step2'),
        t('emergency.tips.choking_step3'),
        t('emergency.tips.choking_step4')
      ]
    }
  ];

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus(t('emergency.locationStatus.unsupported'));
      return;
    }
    setLocationStatus(t('emergency.locationStatus.locating'));
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationStatus(t('emergency.locationStatus.found'));
        // In a real app, we would use coords to find nearest vets
        // For now, we just show Cairo vets as a demo if no gov selected
        if (!selectedGov) setSelectedGov('Cairo');
        filterVets('Cairo');
      },
      () => {
        setLocationStatus(t('emergency.locationStatus.error'));
      }
    );
  };

  const filterVets = (gov: string) => {
    const filtered = mockVets.filter(v => v.location === gov || gov === '');
    setNearbyVets(filtered.length > 0 ? filtered : mockVets.slice(0, 2)); // Fallback
  };

  React.useEffect(() => {
    if (selectedGov) {
      filterVets(selectedGov);
    }
  }, [selectedGov]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-12">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-red-600 flex items-center justify-center gap-3">
            <AlertTriangle className="w-10 h-10" />
            {t('emergency.title')}
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            {t('emergency.subtitle')}
          </p>
        </div>

        {/* Location & Vet Finder */}
        <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-red-500">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-red-500" />
            {t('emergency.findVet')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('emergency.selectGov')}</label>
              <select
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 p-3 border"
                value={selectedGov}
                onChange={(e) => setSelectedGov(e.target.value)}
              >
                <option value="">{t('emergency.selectLocation')}</option>
                {governorates.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleGetLocation}
                className="w-full bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition flex items-center justify-center gap-2 font-medium"
              >
                <MapPin className="w-5 h-5" />
                {t('emergency.useLocation')}
              </button>
            </div>
          </div>

          {locationStatus && <p className="text-sm text-gray-500 mb-4">{locationStatus}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearbyVets.map(vet => (
              <div key={vet.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition bg-red-50">
                <h3 className="text-lg font-bold text-gray-900">{vet.name}</h3>
                <p className="text-gray-600 flex items-center gap-1 mt-2">
                  <MapPin className="w-4 h-4" /> {vet.address}, {vet.location}
                </p>
                <p className="text-gray-500 text-sm mt-1">{t('emergency.distance')}: {vet.distance}</p>
                <a href={`tel:${vet.phone}`} className="mt-4 block w-full text-center bg-white text-red-600 border border-red-600 py-2 rounded-md hover:bg-red-50 transition font-medium flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" /> {t('emergency.callNow')}
                </a>
              </div>
            ))}
            {nearbyVets.length === 0 && selectedGov && (
              <p className="text-gray-500 col-span-full text-center">{t('emergency.noVets')}</p>
            )}
          </div>
        </div>

        {/* First Aid Tips */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <Shield className="w-8 h-8 text-[var(--color-vet-primary)]" />
            {t('emergency.firstAid')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {firstAidTips.map((tip, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition duration-300">
                <div className="bg-[var(--color-vet-primary)] p-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Heart className="w-5 h-5" /> {tip.title}
                  </h3>
                  <span className="text-blue-100 text-sm">{tip.animal}</span>
                </div>
                <div className="p-6">
                  <ul className="space-y-3">
                    {tip.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-700">
                        <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Emergency;