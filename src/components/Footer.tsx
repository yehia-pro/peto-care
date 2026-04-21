import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, Heart, Shield, Globe } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'

const Footer = () => {
    const { t } = useTranslation()
    const { user } = useAuthStore()
    const currentYear = new Date().getFullYear()

    return (
        <footer className="bg-white border-t border-gray-100 pt-16 pb-8 mt-auto relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-vet-primary)] via-purple-500 to-pink-500" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-vet-primary)] to-purple-600 rounded-xl flex items-center justify-center text-xl shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300">
                                🐾
                            </div>
                            <span className="text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                {t('navbar.brand.name')}
                            </span>
                        </Link>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            {t('footer.description')}
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" aria-label="Facebook" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-[var(--color-vet-primary)] transition-all duration-300">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" aria-label="Twitter" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-[var(--color-vet-primary)] transition-all duration-300">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" aria-label="Instagram" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-pink-50 hover:text-pink-600 transition-all duration-300">
                                <Instagram className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-[var(--color-vet-primary)]" />
                            {t('footer.quickLinks')}
                        </h3>
                        <ul className="space-y-4">
                            {user?.role !== 'vet' && (
                                <li>
                                    <Link to="/global-vets" className="text-gray-500 hover:text-[var(--color-vet-primary)] transition-colors text-sm flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                        {t('footer.ourVets')}
                                    </Link>
                                </li>
                            )}
                            <li>
                                <Link to="/partner-stores" className="text-gray-500 hover:text-[var(--color-vet-primary)] transition-colors text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                    {t('footer.partnerStores')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/products" className="text-gray-500 hover:text-[var(--color-vet-primary)] transition-colors text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                    {t('footer.products')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/veterinary-diseases" className="text-gray-500 hover:text-[var(--color-vet-primary)] transition-colors text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                    {t('footer.medicalEncyclopedia')}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-purple-500" />
                            {t('footer.ourServices')}
                        </h3>
                        <ul className="space-y-4">
                            {user?.role !== 'vet' && (
                                <li>
                                    <Link to="/services" className="text-gray-500 hover:text-purple-600 transition-colors text-sm flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                        {t('footer.homeVisit')}
                                    </Link>
                                </li>
                            )}
                            <li>
                                <Link to="/emergency" className="text-gray-500 hover:text-purple-600 transition-colors text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                    {t('footer.emergency')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/delivery/request" className="text-gray-500 hover:text-purple-600 transition-colors text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                    {t('footer.deliveryServices')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/customer-service" className="text-gray-500 hover:text-purple-600 transition-colors text-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                    {t('footer.techSupport')}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Phone className="w-5 h-5 text-[var(--color-vet-secondary)]" />
                            {t('footer.contactUs')}
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-gray-500 text-sm group">
                                <MapPin className="w-5 h-5 text-gray-400 group-hover:text-[var(--color-vet-secondary)] transition-colors shrink-0" />
                                <span>{t('footer.addressLine1')}<br />{t('footer.addressLine2')}</span>
                            </li>
                            <li className="flex items-center gap-3 text-gray-500 text-sm group">
                                <Mail className="w-5 h-5 text-gray-400 group-hover:text-[var(--color-vet-secondary)] transition-colors shrink-0" />
                                <a href="mailto:info@petocare.com" className="hover:text-[var(--color-vet-secondary)] transition-colors">info@petocare.com</a>
                            </li>
                            <li className="flex items-center gap-3 text-gray-500 text-sm group">
                                <Phone className="w-5 h-5 text-gray-400 group-hover:text-[var(--color-vet-secondary)] transition-colors shrink-0" />
                                <a href="tel:19999" className="hover:text-[var(--color-vet-secondary)] transition-colors font-mono">19999</a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-400 text-sm text-center md:text-right">
                        © {currentYear} {t('navbar.brand.name')}. {t('footer.rightsReserved')}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                        <Link to="/privacy" className="hover:text-gray-600 transition-colors">{t('footer.privacyPolicy')}</Link>
                        <Link to="/terms" className="hover:text-gray-600 transition-colors">{t('footer.termsConditions')}</Link>
                        <div className="flex items-center gap-1 text-red-500/80 bg-red-50 px-3 py-1 rounded-full text-xs font-medium">
                            <Link to="/about" className="hover:underline">{t('footer.aboutUs')}</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
