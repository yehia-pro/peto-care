import React, { useState, useEffect } from 'react';
import { Tabs, Card, Typography, Image, Tag, Input, Select, Space, Modal, Button, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { getImageUrl } from '../utils/imageHelper';
import api from '@/services/api';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

const VeterinaryDiseases: React.FC = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSpecies, setSelectedSpecies] = useState('all');
  const [selectedDisease, setSelectedDisease] = useState<any | null>(null);

  const [commonDiseases, setCommonDiseases] = useState<any[]>([]);
  const [rareDiseases, setRareDiseases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = t('veterinaryDiseases.title') || 'الأمراض البيطرية';
  }, [t]);

  useEffect(() => {
    const fetchDiseases = async () => {
      try {
        const { data } = await api.get('/diseases');
        setCommonDiseases(data.filter((d: any) => !d.isRare).map((d: any) => ({
            ...d,
            type: d.type || 'غير محدد',
            severity: d.severity || 'متوسط'
        })));
        setRareDiseases(data.filter((d: any) => d.isRare).map((d: any) => ({
             ...d,
             type: d.type || 'غير محدد',
             severity: d.severity || 'متوسط'
        })));
      } catch (error) {
        console.error('Failed to fetch diseases:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiseases();
  }, []);

  const diseaseTypes = [
    { value: 'all', label: t('veterinaryDiseases.allTypes') },
    { value: 'فيروسي', label: t('veterinaryDiseases.viral') },
    { value: 'بكتيري', label: t('veterinaryDiseases.bacterial') },
    { value: 'طفيلي', label: t('veterinaryDiseases.parasitic') },
    { value: 'فطري', label: t('veterinaryDiseases.fungal') || 'فطري' },
    { value: 'استقلابي', label: t('veterinaryDiseases.metabolic') || 'استقلابي' },
    { value: 'مزمن', label: t('veterinaryDiseases.chronic') || 'مزمن' },
    { value: 'مسالك بولية', label: t('veterinaryDiseases.urinary') || 'مسالك بولية' },
    { value: 'عصبي', label: t('veterinaryDiseases.neurological') || 'عصبي' }
  ];

  const speciesOptions = [
    { value: 'all', label: t('veterinaryDiseases.allSpecies') },
    { value: 'الكلاب', label: t('veterinaryDiseases.dogs') },
    { value: 'القطط', label: t('veterinaryDiseases.cats') },
    { value: 'الطيور', label: t('veterinaryDiseases.birds') },
    { value: 'الأبقار', label: t('veterinaryDiseases.cows') || 'الأبقار' },
    { value: 'الأغنام', label: t('veterinaryDiseases.sheep') || 'الأغنام' },
    { value: 'الماعز', label: t('veterinaryDiseases.goats') || 'الماعز' },
    { value: 'الخيول', label: t('veterinaryDiseases.horses') || 'الخيول' }
  ];

  const filterDiseases = (diseases: any[]) => {
    return diseases.filter(disease => {
      const matchesSearch = !searchTerm ||
        disease.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (disease.scientificName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (disease.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || (disease.type || '').toLowerCase().includes(selectedType);
      const matchesSpecies = selectedSpecies === 'all' || disease.species?.some((s: string) => s.toLowerCase().includes(selectedSpecies)) || false;
      return matchesSearch && matchesType && matchesSpecies;
    });
  };

  const filteredCommonDiseases = filterDiseases(commonDiseases);
  const filteredRareDiseases = filterDiseases(rareDiseases);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <Title level={2} className="text-3xl font-bold text-primary-600">
          {t('veterinaryDiseases.title')}
        </Title>
        <Paragraph className="text-lg text-gray-600">
          {t('veterinaryDiseases.subtitle')}
        </Paragraph>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <Input
          placeholder={t('veterinaryDiseases.searchPlaceholder')}
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:w-1/2"
        />
        <Space className="w-full md:w-1/2" direction="horizontal">
          <Select
            defaultValue="all"
            style={{ width: '100%' }}
            onChange={setSelectedType}
            placeholder={t('veterinaryDiseases.filterByType')}
          >
            {diseaseTypes.map(opt => (
              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
            ))}
          </Select>
          <Select
            defaultValue="all"
            style={{ width: '100%' }}
            onChange={setSelectedSpecies}
            placeholder={t('veterinaryDiseases.filterBySpecies')}
          >
            {speciesOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
            ))}
          </Select>
        </Space>
      </div>

      <Tabs
        defaultActiveKey="common"
        className="w-full"
        items={[
          {
            key: 'common',
            label: t('veterinaryDiseases.commonDiseases'),
            children: isLoading ? (
                <div className="flex justify-center p-10"><Spin size="large" /></div>
            ) : filteredCommonDiseases.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-lg">{t('veterinaryDiseases.noResults') || 'لا توجد نتائج مطابقة للبحث'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCommonDiseases.map((disease) => (
                  <DiseaseCard key={disease._id || disease.id} disease={disease} onClick={() => setSelectedDisease(disease)} />
                ))}
              </div>
            ),
          },
          {
            key: 'rare',
            label: <span>⚗️ {t('veterinaryDiseases.rareDiseases')}</span>,
            children: isLoading ? (
              <div className="flex justify-center p-10"><Spin size="large" /></div>
            ) : filteredRareDiseases.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-50 rounded-full mb-4">
                  <span className="text-4xl">🔬</span>
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">
                  {searchTerm ? (t('veterinaryDiseases.noResults') || 'لا توجد نتائج مطابقة') : (t('veterinaryDiseases.rareDiseases') + ' — قريباً')}
                </h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  {searchTerm
                    ? 'لا توجد أمراض نادرة مطابقة لبحثك. جرب كلمة أخرى.'
                    : 'يمكن للإدارة إضافة الأمراض النادرة عبر لوحة التحكم وتفعيل خيار "مرض نادر" عند الإضافة.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRareDiseases.map((disease) => (
                  <DiseaseCard key={disease._id || disease.id} disease={disease} onClick={() => setSelectedDisease(disease)} />
                ))}
              </div>
            ),
          },
        ]}
      />

      {/* Disease Details Modal */}
      <Modal
        title={<span className="text-xl font-bold text-primary-700">{selectedDisease?.name}</span>}
        open={!!selectedDisease}
        onCancel={() => setSelectedDisease(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedDisease(null)} type="primary" className="bg-primary-600">
            {t('common.close') || 'إغلاق'}
          </Button>
        ]}
        width={700}
        centered
        className="veterinary-disease-modal"
      >
        {selectedDisease && (
          <div className="flex flex-col gap-5 mt-4 text-right" dir="rtl">
            <div className="h-48 overflow-hidden rounded-xl bg-neutral-100 flex-shrink-0 relative">
              <img
                src={getImageUrl(selectedDisease.imageUrl || selectedDisease.image || `https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800&h=600&fit=crop&q=80`)}
                alt={selectedDisease.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Tag color="geekblue" className="text-sm px-2 py-1 rounded-md border-none">{selectedDisease.type}</Tag>
                <Tag color={selectedDisease.severity === 'عالي' ? 'red' : selectedDisease.severity === 'متوسط' ? 'orange' : 'green'} className="text-sm px-2 py-1 rounded-md border-none">
                  {selectedDisease.severity}
                </Tag>
              </div>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <h4 className="font-bold text-neutral-800 mb-2">{t('veterinaryDiseases.description') || 'نبذة عن المرض'}</h4>
              <p className="text-neutral-600 leading-relaxed text-sm">{selectedDisease.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-neutral-100 bg-white shadow-sm">
                <h4 className="font-bold text-neutral-800 mb-2 border-b border-neutral-100 pb-2">{t('veterinaryDiseases.symptoms') || 'الأعراض'}</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600">
                  {selectedDisease.symptoms.map((sym: string, idx: number) => (
                    <li key={idx}>{sym}</li>
                  ))}
                </ul>
              </div>

              {selectedDisease.prevention && (
                <div className="p-4 rounded-xl border border-green-100 bg-green-50 shadow-sm">
                  <h4 className="font-bold text-green-800 mb-2 border-b border-green-200 pb-2">{t('veterinaryDiseases.prevention') || 'طرق الوقاية'}</h4>
                  <p className="text-[var(--color-vet-secondary)] text-sm leading-relaxed">{selectedDisease.prevention}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedDisease.species && selectedDisease.species.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-neutral-500 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <span className="font-bold text-neutral-700">{t('veterinaryDiseases.species') || 'الفصيلة المستهدفة'}:</span>
                  <span>{selectedDisease.species.join('، ')}</span>
                </div>
              )}

              {selectedDisease.onset && (
                <div className="flex items-center gap-2 text-sm text-neutral-500 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                  <span className="font-bold text-neutral-700">{t('veterinaryDiseases.onset') || 'فترة الحضانة/الظهور'}:</span>
                  <span>{selectedDisease.onset}</span>
                </div>
              )}
            </div>

            {/* Treatment is intentionally omitted as requested */}
          </div>
        )}
      </Modal>
    </div>
  );
};

const DiseaseCard = ({ disease, onClick }: { disease: any, onClick: () => void }) => {
  const { t } = useTranslation();

  // Base images for diseases with high quality and consistent aspect ratio
  // Base images for diseases with high quality and consistent aspect ratio
  const getDiseaseImage = (disease: any) => {
    return disease.imageUrl || disease.image || `https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800&h=600&fit=crop&q=80`;
  };

  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
      {/* Image Section - auto-fits any image dimension elegantly */}
      <div className="relative overflow-hidden bg-neutral-200" style={{ aspectRatio: '16/9' }}>
        {/* Blurred background fill for portrait/narrow images */}
        <img
          alt=""
          src={getImageUrl(getDiseaseImage(disease))}
          className="absolute inset-0 w-full h-full object-cover blur-lg scale-110 opacity-60"
          aria-hidden="true"
        />
        {/* Main sharp image, centered */}
        <img
          alt={disease.name}
          src={getImageUrl(getDiseaseImage(disease))}
          className="relative z-10 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute top-3 right-3 z-30 flex gap-2">
          <Tag
            color={disease.severity === 'عالي' ? 'red' : disease.severity === 'متوسط' ? 'orange' : 'green'}
            className="m-0 border-none px-2 py-0.5 rounded-md font-bold shadow-sm"
          >
            {disease.severity}
          </Tag>
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-30 p-4 text-white">
          <h3 className="text-xl font-bold truncate drop-shadow-md">{disease.name}</h3>
          <p className="text-xs text-white/80 italic font-light font-mono truncate">{disease.scientificName || ''}</p>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow text-right" dir="rtl">

        <p className="text-neutral-600 mb-4 text-sm leading-relaxed line-clamp-3 h-[4.5rem]">
          {disease.description}
        </p>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-4 text-xs bg-neutral-50 p-3 rounded-lg border border-neutral-100">
          <div className="col-span-2 sm:col-span-1">
            <span className="text-secondary-600 block font-semibold mb-0.5">{t('veterinaryDiseases.type') || 'النوع'}:</span>
            <span className="text-neutral-700">{disease.type}</span>
          </div>
          {disease.onset && (
            <div className="col-span-2 sm:col-span-1">
              <span className="text-secondary-600 block font-semibold mb-0.5">{t('veterinaryDiseases.onset') || 'بداية الظهور'}:</span>
              <span className="text-neutral-700 truncate block" title={disease.onset}>{disease.onset}</span>
            </div>
          )}
        </div>

        {/* Symptoms */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-neutral-800 mb-2">{t('veterinaryDiseases.symptoms')}:</p>
          <div className="flex flex-wrap gap-1.5">
            {(disease.symptoms || []).slice(0, 4).map((symptom: string, index: number) => (
              <span key={index} className="bg-blue-50 text-[var(--color-vet-primary)] border border-blue-100 text-[10px] px-2 py-1 rounded-full">
                {symptom}
              </span>
            ))}
            {(disease.symptoms || []).length > 4 && (
              <span className="bg-neutral-100 text-neutral-500 text-[10px] px-2 py-1 rounded-full">+{(disease.symptoms || []).length - 4}</span>
            )}
          </div>
        </div>

        {/* Footer / Species */}
        <div className="mt-auto pt-3 border-t border-neutral-100 flex justify-between items-center">
          <div className="flex -space-x-2 space-x-reverse overflow-hidden">
            {(disease.species || []).map((specie: string, index: number) => (
              <div key={index} className="bg-green-100 text-[var(--color-vet-secondary)] text-[10px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white ring-1 ring-gray-100" title={specie}>
                {specie.charAt(0)}
              </div>
            ))}
          </div>
          <button onClick={onClick} className="text-[var(--color-vet-primary)] text-xs font-medium hover:underline flex items-center gap-1">
            {t('common.readMore') || 'اقرأ المزيد'}
            <span className="text-lg leading-none">←</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default VeterinaryDiseases;
