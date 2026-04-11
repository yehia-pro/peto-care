import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, CheckCircle, Stethoscope, Calendar,
  UserCheck, Clock, MessageCircle, Phone, Heart,
  Star, Info, ShoppingBag, Package, X, ChevronDown,
  Menu, User
} from 'lucide-react';
import api, { notificationsAPI } from '@/services/api';
import { useTranslation } from 'react-i18next';

type Pet = {
  _id: string;
  title: string;
  type?: string;
  imageUrl: string;
  description: string;
  personality?: string[];
  careTips: string[];
  idealOwner?: string;
  tip?: string;
  supplies?: string[];
  isFavorite?: boolean;
};

const NoPets = () => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPetGuides = async () => {
      try {
        const { data } = await api.get('/pet-guides');
        setPets(data.map((pet: any) => ({
          ...pet,
          isFavorite: false,
          type: pet.type || 'غير محدد',
          personality: pet.personality || [],
          supplies: pet.supplies || [],
        })));
      } catch (error) {
        console.error('Failed to fetch pet guides:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPetGuides();
  }, []);

  const toggleFavorite = (petId: string) => {
    setPets(prevPets => prevPets.map(pet =>
      pet._id === petId ? { ...pet, isFavorite: !pet.isFavorite } : pet
    ));
  };

  const handleImageError = (e: any) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = 'https://res.cloudinary.com/demo/image/upload/w_1000,h_700,c_fill,e_vibrance:20/sample';
    target.alt = 'الصورة غير متاحة';
  };

  const filteredPets = activeTab === 'all'
    ? pets
    : pets.filter(pet => {
        // Fallback for static categorization if title matches type
        return pet.title.includes(activeTab) || (pet.type && pet.type.includes(activeTab));
    });

  const servicesData = t('nopets.services', { returnObjects: true }) as any[];
  const serviceIcons = [
    <Stethoscope className="w-8 h-8 text-[var(--color-vet-primary)]" />,
    <Calendar className="w-8 h-8 text-[var(--color-vet-secondary)]" />,
    <UserCheck className="w-8 h-8 text-purple-600" />,
    <Clock className="w-8 h-8 text-[var(--color-vet-accent)]" />
  ];

  const services = Array.isArray(servicesData) ? servicesData.map((s, i) => ({
    ...s,
    icon: serviceIcons[i]
  })) : [];

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setSending(true);
    try {
      await notificationsAPI.sendEmail({
        name,
        email,
        subject: t('nopets.contact.subject') || 'استفسار بخصوص اختيار حيوان أليف',
        message
      });

      alert(t('customerServices.messages.submitSuccess'));
      setName('');
      setEmail('');
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert(t('customerServices.messages.submitError'));
    } finally {
      setSending(false);
    }
  };

  const renderPetCard = (pet: Pet) => (
    <div
      key={pet._id}
      className="group bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
    >
      <div className="relative overflow-hidden bg-neutral-200" style={{ aspectRatio: '16/9' }}>
        {/* Blurred background fill for any image shape */}
        <img
          alt=""
          src={pet.imageUrl || 'https://via.placeholder.com/800x600?text=No+Image'}
          className="absolute inset-0 w-full h-full object-cover blur-lg scale-110 opacity-60"
          aria-hidden="true"
        />
        {/* Main sharp image, centered */}
        <img
          src={pet.imageUrl || 'https://via.placeholder.com/800x600?text=No+Image'}
          alt={pet.title}
          className="relative z-10 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          onError={handleImageError}
          loading="lazy"
        />
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(pet._id);
          }}
          className="absolute top-3 left-3 z-30 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all transform hover:scale-110"
          aria-label={pet.isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
        >
          <Heart
            className={`w-5 h-5 ${pet.isFavorite ? 'fill-red-500 text-red-500' : 'text-neutral-400'}`}
          />
        </button>

        <div className="absolute bottom-0 right-0 left-0 z-30 p-4 text-white">
          <h3 className="text-xl font-bold truncate drop-shadow-md">{pet.title}</h3>
          <p className="text-sm text-white/90 font-medium drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
            {pet.type || 'حيوان'}
          </p>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <p className="text-neutral-600 text-sm line-clamp-2 mb-4 leading-relaxed h-10">
          {pet.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {pet.personality && pet.personality.slice(0, 3).map((trait, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 bg-blue-50 text-[var(--color-vet-primary)] text-xs font-medium rounded-lg border border-blue-100"
            >
              {trait}
            </span>
          ))}
          {pet.personality && pet.personality.length > 3 && (
            <span className="px-2 py-1 bg-neutral-50 text-neutral-500 text-xs rounded-lg border border-neutral-100">
              +{pet.personality.length - 3}
            </span>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-neutral-100">
          <button
            onClick={() => setSelectedPet(pet)}
            className="w-full bg-white border border-[var(--color-vet-primary)] text-[var(--color-vet-primary)] hover:bg-[var(--color-vet-primary)] hover:text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group/btn"
          >
            <Info className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
            <span>{t('petRecords.viewDetails') || 'تفاصيل أكثر'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  const isRTL = true

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Enhanced Navbar */}

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-[var(--color-vet-primary)] via-[var(--color-vet-primary)] to-purple-600 text-white py-20 md:py-32 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-2xl">{t('nopets.header.title') || 'اكتشف عالم الحيوانات الأليفة'}</h1>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl drop-shadow-lg">{t('nopets.header.subtitle') || 'دليلك الشامل لاختيار ورعاية حيوانك الأليف المثالي'}</p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#services"
              className="bg-white text-[var(--color-vet-primary)] hover:bg-blue-50 px-8 py-4 rounded-2xl font-bold shadow-2xl transform transition hover:scale-105 hover:shadow-3xl"
            >
              {t('home.services.title') || 'خدماتنا'}
            </a>
            <a
              href="#contact"
              className="bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white/20 px-8 py-4 rounded-2xl font-bold transition transform hover:scale-105"
            >
              {t('home.contact.title') || 'اتصل بنا'}
            </a>
            <a
              href="/pet-records"
              className="bg-gradient-to-r from-[var(--color-vet-secondary)] to-[var(--color-vet-secondary)] text-white hover:from-[var(--color-vet-secondary)] hover:to-[var(--color-vet-secondary)] px-8 py-4 rounded-2xl font-bold shadow-2xl transform transition hover:scale-105"
            >
              {t('petRecords.addNew')}
            </a>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" fill="rgb(249 250 251)" />
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('nopets.title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('nopets.tips.1')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-transparent hover:border-blue-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-vet-primary)] to-[var(--color-vet-primary)] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">{t('services.generalConsultation') || 'استشارات عامة'}</h3>
              <p className="text-gray-600 leading-relaxed">{t('nopets.tips.2') || 'احصل على استشارات طبية شاملة من أطباء متخصصين'}</p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-transparent hover:border-green-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-vet-secondary)] to-[var(--color-vet-secondary)] rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">{t('services.diagnosticTests') || 'فحوصات تشخيصية'}</h3>
              <p className="text-gray-600 leading-relaxed">{t('nopets.tips.3') || 'فحوصات دقيقة ومتقدمة لتشخيص الحالات المرضية'}</p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-transparent hover:border-purple-200 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">{t('home.services.emergency') || 'طوارئ 24/7'}</h3>
              <p className="text-gray-600 leading-relaxed">{t('nopets.tips.4') || 'خدمة طوارئ متاحة على مدار الساعة'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">خدماتنا المتكاملة</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">نقدم مجموعة شاملة من الخدمات البيطرية لتلبية جميع احتياجات حيوانك الأليف</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-right hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 mr-0 ml-auto transition-all duration-300 group-hover:scale-110"
                  style={{
                    backgroundColor: service.icon.props.className.includes('text-[var(--color-vet-primary)]') ? '#DBEAFE' :
                      service.icon.props.className.includes('text-[var(--color-vet-secondary)]') ? '#D1FAE5' :
                        service.icon.props.className.includes('text-purple-600') ? '#F3E8FF' : '#FEF3C7'
                  }}
                >
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <a
              href="#contact"
              className="inline-flex items-center justify-center bg-[var(--color-vet-primary)] hover:bg-[var(--color-vet-primary)] text-white font-semibold px-8 py-3 rounded-full transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              {t('appointments.bookNew') || 'احجز موعدك الآن'}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2 bg-[var(--color-vet-primary)] p-8 text-white">
                <h2 className="text-2xl font-bold mb-6">{t('nopets.contact.formTitle')}</h2>
                <p className="mb-6">{t('nopets.contact.desc')}</p>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="ml-4">
                      <h3 className="font-semibold">{t('customerService.title')}</h3>
                      <p className="text-blue-100">920033333</p>
                    </div>
                    <div className="bg-[var(--color-vet-primary)] rounded-full p-2 flex-shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="ml-4">
                      <h3 className="font-semibold">{t('customerService.email')}</h3>
                      <p className="text-blue-100">info@petocare.sa</p>
                    </div>
                    <div className="bg-[var(--color-vet-primary)] rounded-full p-2 flex-shrink-0">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:w-1/2 p-8">
                <h3 className="text-xl font-bold text-gray-800 mb-6">{t('nopets.contact.formTitle')}</h3>
                <form onSubmit={handleContact} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1 text-right">{t('nopets.contact.namePlaceholder')}</label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-[var(--color-vet-primary)] text-right"
                      required
                      placeholder="أدخل اسمك الكامل"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 text-right">{t('nopets.contact.emailPlaceholder')}</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-[var(--color-vet-primary)] text-right"
                      required
                      placeholder="اكتب بريدك الإلكتروني"
                      dir="rtl"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1 text-right">{t('nopets.contact.messagePlaceholder')}</label>
                    <textarea
                      id="message"
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-[var(--color-vet-primary)] text-right"
                      required
                      placeholder="اكتب رسالتك هنا..."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-[var(--color-vet-primary)] hover:bg-[var(--color-vet-primary)] text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center h-12"
                  >
                    {sending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('actions.sending')}
                      </>
                    ) : (
                      t('actions.send')
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pets Section */}
      <section id="pets" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('nopets.title')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('nopets.header.subtitle')}</p>
          </div>

          {/* Pet Type Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'all'
                ? 'bg-[var(--color-vet-primary)] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {t('common.all')}
            </button>
            <button
              onClick={() => setActiveTab('قطط')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'قطط'
                ? 'bg-[var(--color-vet-primary)] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {t('petTypes.cat')}
            </button>
            <button
              onClick={() => setActiveTab('كلاب')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'كلاب'
                ? 'bg-[var(--color-vet-primary)] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {t('petTypes.dog')}
            </button>
            <button
              onClick={() => setActiveTab('طيور')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'طيور'
                ? 'bg-[var(--color-vet-primary)] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {t('petTypes.bird')}
            </button>
            <button
              onClick={() => setActiveTab('قوارض')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'قوارض'
                ? 'bg-[var(--color-vet-primary)] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {t('petTypes.hamster')}
            </button>
            <button
              onClick={() => setActiveTab('زواحف')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'زواحف'
                ? 'bg-[var(--color-vet-primary)] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {t('petTypes.turtle')}
            </button>
            <button
              onClick={() => setActiveTab('أسماك')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'أسماك'
                ? 'bg-[var(--color-vet-primary)] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {t('petTypes.fish')}
            </button>
            <button
              onClick={() => setActiveTab('خيول')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'خيول'
                ? 'bg-[var(--color-vet-primary)] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {t('petTypes.horse')}
            </button>
            <button
              onClick={() => setActiveTab('مواشي')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'مواشي'
                ? 'bg-[var(--color-vet-primary)] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {t('petTypes.livestock')}
            </button>
          </div>

          {/* Pets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPets.map(renderPetCard)}
          </div>
        </div>
      </section>

      {/* Pet Details Modal */}
      {selectedPet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <button
                onClick={() => setSelectedPet(null)}
                className="absolute top-4 left-4 bg-white/80 hover:bg-white p-2 rounded-full shadow-md z-10"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-64 md:h-full">
                  <img
                    src={selectedPet.imageUrl}
                    alt={selectedPet.title}
                    className="w-full h-full object-cover rounded-t-xl md:rounded-l-xl md:rounded-tr-none"
                    onError={handleImageError}
                  />
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{selectedPet.title}</h2>
                      <p className="text-gray-600">{selectedPet.type}</p>
                    </div>
                    <button
                      onClick={() => toggleFavorite(selectedPet._id)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                      aria-label={selectedPet.isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                    >
                      <Heart
                        className={`w-6 h-6 ${selectedPet.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                      />
                    </button>
                  </div>

                  <p className="text-gray-700 mb-6">{selectedPet.description}</p>

                  <div className="space-y-6">
                    {/* Personality */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                        <UserCheck className="w-5 h-5 ml-2 text-[var(--color-vet-primary)]" />
                        {t('labels.personality')}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedPet.personality && selectedPet.personality.map((trait, idx) => (
                          <span key={idx} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Care Tips */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                        <CheckCircle className="w-5 h-5 ml-2 text-[var(--color-vet-secondary)]" />
                        {t('labels.care')}
                      </h3>
                      <ul className="space-y-2">
                        {selectedPet.careTips.map((tip, idx) => (
                          <li key={idx} className="flex items-start">
                            <CheckCircle className="w-4 h-4 text-[var(--color-vet-secondary)] mt-1 ml-2 flex-shrink-0" />
                            <span className="text-gray-700">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Ideal Owner */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                        <UserCheck className="w-5 h-5 ml-2 text-purple-600" />
                        {t('labels.idealOwner')}
                      </h3>
                      <p className="text-gray-700">{selectedPet.idealOwner}</p>
                    </div>

                    {/* Funny Tip */}
                    <div className="bg-amber-50 border-r-4 border-[var(--color-vet-accent)] p-4 rounded">
                      <h3 className="text-lg font-semibold text-amber-800 mb-1 flex items-center">
                        <Star className="w-5 h-5 ml-2 text-[var(--color-vet-accent)]" />
                        {t('labels.funnyTip')}
                      </h3>
                      <p className="text-[var(--color-vet-accent)]">{selectedPet.tip}</p>
                    </div>

                    {/* Supplies */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                        <ShoppingBag className="w-5 h-5 ml-2 text-[var(--color-vet-primary)]" />
                        {t('supplies.essentials')}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedPet.supplies && selectedPet.supplies.map((item, idx) => (
                          <div key={idx} className="flex items-center bg-gray-50 px-3 py-2 rounded-lg">
                            <Package className="w-4 h-4 text-[var(--color-vet-primary)] ml-2" />
                            <span className="text-gray-700 text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <a
                      href="#contact"
                      onClick={() => setSelectedPet(null)}
                      className="flex-1 bg-[var(--color-vet-primary)] hover:bg-[var(--color-vet-primary)] text-white font-medium py-3 px-6 rounded-lg text-center transition-colors"
                    >
                      {t('appointments.book') || 'احجز استشارة'}
                    </a>
                    <button
                      onClick={() => setSelectedPet(null)}
                      className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
                    >
                      {t('actions.close')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoPets;
