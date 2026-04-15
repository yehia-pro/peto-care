import { Link } from 'react-router-dom'
import { Heart, Stethoscope, Users, Phone, MapPin, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'

const Home = () => {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 relative overflow-x-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-secondary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-accent-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Hero Section */}
      <section className="relative py-20 px-4 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-right">
              <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent mb-6 transform hover:scale-105 transition-transform duration-300">
                {t('home.title')}
              </h1>
              <p className="text-xl text-neutral-700 mb-8 leading-relaxed">
                {t('home.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  to="/services"
                  className="group relative bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 overflow-hidden"
                >
                  <span className="relative z-10">{t('home.findVet')}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
                <Link
                  to="/global-vets"
                  className="group relative border-2 border-primary-500 text-primary-600 px-8 py-4 rounded-xl font-semibold hover:bg-primary-50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 backdrop-blur-sm bg-white/50"
                >
                  {t('home.bookAppointment')}
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative float-animation">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-3xl blur-2xl opacity-30 transform rotate-6"></div>
                <div className="relative group">
                  <img
                    src="https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&h=800&fit=crop&q=80"
                    alt={t('home.vets.subtitle')}
                    width="800"
                    height="800"
                    className="relative rounded-3xl shadow-2xl max-w-full h-auto transform group-hover:scale-110 transition-transform duration-700"
                    style={{
                      transformStyle: 'preserve-3d',
                      filter: 'brightness(1.05) saturate(1.1) contrast(1.05)',
                    }}
                    onError={(e) => {
                      // Fallback to another cute child with pet image
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&h=800&fit=crop&q=80'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-600/20 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl card-3d border border-primary-200">
                  <div className="flex items-center space-x-2">
                    <Star className="w-6 h-6 text-accent-500 fill-current animate-pulse" />
                    <span className="font-bold text-2xl text-neutral-800">4.9</span>
                    <span className="text-neutral-600 text-sm">{t('home.vets.subtitle')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-4">
              {t('home.services.title')}
            </h2>
            <p className="text-xl text-neutral-700">
              {t('home.services.consultation')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* استشارة بيطرية → صفحة خدمات التشخيص /services - Hidden from vets */}
            {user?.role !== 'vet' && (
              <Link
                to="/services"
                className="group block text-center p-8 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 hover:from-primary-100 hover:to-primary-200 transition-all duration-300 card-3d border border-primary-200 shadow-lg hover:shadow-2xl transform hover:-translate-y-2"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform group-hover:rotate-6 transition-transform duration-300 shadow-lg">
                  <Stethoscope className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-neutral-800 mb-3">{t('home.services.consultation')}</h3>
                <p className="text-neutral-600 leading-relaxed">
                  {t('home.services.surgery')}
                </p>
              </Link>
            )}

            {/* التطعيمات → حجز موعد /appointments - Hidden from vets */}
            {user?.role !== 'vet' && (
              <Link
                to="/appointments"
                className="group block text-center p-8 rounded-2xl bg-gradient-to-br from-secondary-50 to-secondary-100 hover:from-secondary-100 hover:to-secondary-200 transition-all duration-300 card-3d border border-secondary-200 shadow-lg hover:shadow-2xl transform hover:-translate-y-2"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform group-hover:rotate-6 transition-transform duration-300 shadow-lg">
                  <Heart className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-neutral-800 mb-3">{t('home.services.vaccination')}</h3>
                <p className="text-neutral-600 leading-relaxed">
                  {t('home.services.dental')}
                </p>
              </Link>
            )}

            {/* طوارئ 24/7 → /emergency - Visible to all */}
            <Link
              to="/emergency"
              className="group block text-center p-8 rounded-2xl bg-gradient-to-br from-accent-50 to-accent-100 hover:from-accent-100 hover:to-accent-200 transition-all duration-300 card-3d border border-accent-200 shadow-lg hover:shadow-2xl transform hover:-translate-y-2"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform group-hover:rotate-6 transition-transform duration-300 shadow-lg">
                <Phone className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-neutral-800 mb-3">{t('home.services.emergency')}</h3>
              <p className="text-neutral-600 leading-relaxed">
                {t('home.vets.title')}
              </p>
            </Link>

            {/* عرض جميع الأطباء → /global-vets - Hidden from vets */}
            {user?.role !== 'vet' && (
              <Link
                to="/global-vets"
                className="group block text-center p-8 rounded-2xl bg-gradient-to-br from-primary-50 to-secondary-50 hover:from-primary-100 hover:to-secondary-100 transition-all duration-300 card-3d border border-primary-200 shadow-lg hover:shadow-2xl transform hover:-translate-y-2"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transform group-hover:rotate-6 transition-transform duration-300 shadow-lg">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-neutral-800 mb-3">{t('home.vets.viewAll')}</h3>
                <p className="text-neutral-600 leading-relaxed">
                  {t('home.testimonials.title')}
                </p>
              </Link>
            )}

            {/* تواصل معنا → صفحة خدمة العملاء /customer-service - Visible to all */}
            <Link
              to="/customer-service"
              className="group block text-center p-8 rounded-2xl bg-gradient-to-br from-error-50 to-error-100 hover:from-error-100 hover:to-error-200 transition-all duration-300 card-3d border border-error-200 shadow-lg hover:shadow-2xl transform hover:-translate-y-2"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-error-500 to-error-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform group-hover:rotate-6 transition-transform duration-300 shadow-lg">
                <MapPin className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-neutral-800 mb-3">{t('home.contact.title')}</h3>
              <p className="text-neutral-600 leading-relaxed">
                {t('home.contact.subtitle')}
              </p>
            </Link>

            {/* عرض تقييمات الأطباء → نوجّه المستخدم لصفحة خدمة العملاء كتقريب (أو صفحة مراجعات مستقلة لاحقاً) */}
            <Link
              to="/customer-service"
              className="group block text-center p-8 rounded-2xl bg-gradient-to-br from-accent-50 to-primary-50 hover:from-accent-100 hover:to-primary-100 transition-all duration-300 card-3d border border-accent-200 shadow-lg hover:shadow-2xl transform hover:-translate-y-2"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-accent-500 to-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transform group-hover:rotate-6 transition-transform duration-300 shadow-lg">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-neutral-800 mb-3">{t('home.vets.viewAll')}</h3>
              <p className="text-neutral-600 leading-relaxed">
                {t('home.services.consultation')}
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative z-10 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/50 via-transparent to-accent-600/50"></div>
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6 drop-shadow-lg">
            {t('emergency.title')}
          </h2>
          <p className="text-xl text-white mb-10 opacity-95 max-w-2xl mx-auto leading-relaxed">
            {t('emergency.subtitle')}
          </p>
          <Link
            to="/services"
            className="inline-block bg-white text-primary-600 px-10 py-4 rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 hover:-translate-y-2 relative overflow-hidden group"
          >
            <span className="relative z-10">{t('common.start')}</span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-secondary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home