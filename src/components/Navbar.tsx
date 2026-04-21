import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, User, UserPlus, ShoppingCart, ChevronDown, Stethoscope, Briefcase, Store, Package, Heart, LogOut, CreditCard, Home, FileText, AlertCircle, HelpCircle, MessageSquare, Search, Bell, Sparkles, Phone, Calendar, MapPin, TrendingUp, Shield, Award, DollarSign, Globe } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useTranslation } from 'react-i18next'
import { useCartStore } from '../stores/cartStore'
import { useLanguageStore } from '../stores/languageStore'
import { getImageUrl } from '../utils/imageHelper'
import { SafeImage } from './SafeImage'
import { useSocket } from '../context/SocketContext'
import { toast } from 'sonner'
import { notificationsAPI } from '../services/api'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

  const { user, logout } = useAuthStore()
  const { t } = useTranslation()
  const { getItemCount } = useCartStore()
  const { currentLanguage, setLanguage } = useLanguageStore()
  const cartItemCount = getItemCount()
  const { socket } = useSocket()
  const navigate = useNavigate()

  // Handle Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fetch initial notifications
  const loadNotifications = async () => {
    if (!user) return;
    try {
      const res = await notificationsAPI.getNotifications();
      // Only show top 10 in UI dropdown
      setNotifications(res.data.notifications.slice(0, 10));
    } catch (e) {
      console.error('Failed to load notifications', e);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  // Socket Notifications
  useEffect(() => {
    if (!socket) return
    const handleNotification = (notif: any) => {
      toast[notif.type as 'success' | 'error' | 'warning' | 'info']?.(notif.title || t('navbar.notifications.new'), {
        description: notif.message,
        duration: 5000
      })
    }
    socket.on('notification', handleNotification)
    return () => {
      socket.off('notification', handleNotification)
    }
  }, [socket])

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      if (id) {
        await notificationsAPI.deleteNotification(id);
      }
      setNotifications(prev => prev.filter(n => n._id !== id));
      loadNotifications(); // Reload to get consistent page data if possible
    } catch (error) {
      console.error('Error deleting notification', error);
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Arabic only - no language toggle needed

  // Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const handleLogout = async () => {
    try {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      await logout()
      setIsMenuOpen(false)
      window.location.href = '/'
    } catch (error) {
      window.location.href = '/'
    }
  }

  // Mega Menu Data - Translated
  const megaMenus = [
    {
      label: t('navbar.menus.medicalServices'),
      href: '/services',
      icon: Stethoscope,
      items: [
        {
          label: t('navbar.services.all'),
          href: '/services',
          icon: Briefcase,
          desc: t('navbar.services.allDesc'),
          badge: t('navbar.services.new')
        },
        {
          label: t('navbar.services.vets'),
          href: '/global-vets',
          icon: Stethoscope,
          desc: t('navbar.services.vetsDesc'),
          badge: t('navbar.services.featured')
        },
        {
          label: t('navbar.services.appointments'),
          href: '/appointments',
          icon: Calendar,
          desc: t('navbar.services.appointmentsDesc')
        },
        {
          label: t('navbar.services.records'),
          href: '/pet-records',
          icon: FileText,
          desc: t('navbar.services.recordsDesc')
        },
      ].filter(item => {
        if (user?.role === 'vet' && (item.href === '/services' || item.href === '/appointments' || item.href === '/global-vets')) {
          return false
        }
        return true
      })
    },
    {
      label: t('navbar.menus.store'),
      href: '/products',
      icon: Store,
      items: [
        {
          label: t('navbar.storeItems.browse'),
          href: '/products',
          icon: Package,
          desc: t('navbar.storeItems.browseDesc'),
          badge: t('navbar.storeItems.offers')
        },
        {
          label: t('navbar.storeItems.partner'),
          href: '/partner-stores',
          icon: Store,
          desc: t('navbar.storeItems.partnerDesc')
        },
        {
          label: t('navbar.storeItems.track'),
          href: '/delivery/track',
          icon: TrendingUp,
          desc: t('navbar.storeItems.trackDesc')
        },
        {
          label: t('navbar.storeItems.exclusive'),
          href: '/products?sale=true',
          icon: Heart,
          desc: t('navbar.storeItems.exclusiveDesc')
        },
      ]
    },
    {
      label: t('navbar.menus.community'),
      href: '/community',
      icon: MessageSquare,
      items: [
        {
          label: t('navbar.communityItems.community'),
          href: '/community',
          icon: MessageSquare,
          desc: t('navbar.communityItems.communityDesc')
        },
        {
          label: t('navbar.communityItems.encyclopedia'),
          href: '/veterinary-diseases',
          icon: FileText,
          desc: t('navbar.communityItems.encyclopediaDesc'),
          badge: t('navbar.communityItems.comprehensive')
        },
        {
          label: t('navbar.communityItems.noPet'),
          href: '/no-pets',
          icon: Heart,
          desc: t('navbar.communityItems.noPetDesc'),
          badge: t('navbar.communityItems.guide')
        },
        {
          label: t('navbar.communityItems.help'),
          href: '/customer-service',
          icon: HelpCircle,
          desc: t('navbar.communityItems.helpDesc')
        },
        {
          label: t('navbar.communityItems.emergency'),
          href: '/emergency',
          icon: AlertCircle,
          desc: t('navbar.communityItems.emergencyDesc'),
          badge: t('navbar.communityItems.247')
        },
      ].filter(item => {
        if (user?.role === 'vet' && item.href === '/no-pets') {
          return false
        }
        return true
      })
    }
  ]

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 font-sans ${scrolled ? 'glass-nav py-2 shadow-lg shadow-[var(--color-vet-primary)]/5' : 'bg-transparent py-4'
          }`}
      >
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">

            {/* 1. BRAND LOGO - Enhanced with Animation */}
            <Link to="/" className="flex items-center gap-3 group relative z-50" aria-label={t('navbar.brand.name') || 'Home'}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-vet-primary)] to-[var(--color-vet-secondary)] rounded-2xl blur-md opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-vet-primary)] to-[var(--color-vet-secondary)] flex items-center justify-center text-white text-2xl shadow-lg shadow-cyan-900/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ring-2 ring-white/50">
                  🐾
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="block text-2xl font-black leading-none font-['Cairo'] bg-gradient-to-l from-gray-900 via-[var(--color-vet-primary)] to-gray-700 bg-clip-text text-transparent">
                  {t('navbar.brand.name')}
                </span>
                <span className="block text-[0.6rem] font-bold text-[var(--color-vet-accent)] tracking-widest uppercase mt-1 font-['Tajawal'] group-hover:tracking-wider transition-all">
                  {t('navbar.brand.slogan')}
                </span>
              </div>
            </Link>            {/* 2. CENTER - MEGA NAVIGATION (Desktop) - Enhanced with Animations */}
            <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 z-40 items-center">
              
              {/* Extra Floating Actions (Language) - Placed before the Pill in DOM to appear on the RIGHT in RTL */}
              <div className="ml-4 flex items-center gap-3">
                {/* Language Switcher - Moved beside Home */}
                <button
                  onClick={() => setLanguage(currentLanguage === 'ar' ? 'en' : 'ar')}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/90 backdrop-blur-xl hover:bg-white hover:shadow-lg transition-all border border-white/70 shadow-md ring-1 ring-gray-100/50 group"
                  aria-label="تغيير اللغة"
                  title={currentLanguage === 'ar' ? 'English' : 'العربية'}
                >
                  <div className="relative">
                    <Globe className="w-5 h-5 text-gray-700 group-hover:text-[var(--color-vet-primary)] transition-colors" />
                    <span className="absolute -bottom-2 -right-2 text-[10px] font-bold text-[var(--color-vet-primary)] uppercase bg-white rounded-full px-1 shadow-sm">
                      {currentLanguage === 'ar' ? 'EN' : 'AR'}
                    </span>
                  </div>
                </button>
              </div>

              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full border border-white/70 shadow-lg shadow-gray-200/50 ring-1 ring-gray-100/50 hover:shadow-xl transition-shadow duration-300">

                <Link to="/" className="group/home relative px-4 py-2 rounded-full text-sm font-bold text-gray-700 hover:text-[var(--color-vet-primary)] hover:bg-white/80 transition-all font-['Tajawal'] overflow-hidden">
                  <span className="relative z-10 flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    {t('navbar.menus.home')}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-vet-primary)]/10 to-[var(--color-vet-secondary)]/10 opacity-0 group-hover/home:opacity-100 transition-opacity"></div>
                </Link>

                {megaMenus.map((menu, index) => (
                  <div key={index} className="relative group/menu">
                    <button
                      className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-bold text-gray-600 hover:text-[var(--color-vet-primary)] hover:bg-white/80 transition-all font-['Tajawal'] group/btn overflow-hidden relative"
                    >
                      <menu.icon className="w-4 h-4" />
                      <span>{menu.label}</span>
                      <ChevronDown className="w-3 h-3 group-hover/menu:rotate-180 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-vet-primary)]/10 to-[var(--color-vet-secondary)]/10 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                    </button>

                    {/* Mega Menu Dropdown - Enhanced */}
                    <div className="absolute top-full right-0 mt-4 w-80 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-300 transform origin-top-right -translate-y-2 group-hover/menu:translate-y-0 pt-2 z-50">
                      <div className="glass-card bg-white/98 rounded-2xl shadow-2xl p-4 border border-gray-200 ring-1 ring-black/5 overflow-hidden">
                        {/* Menu Header */}
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                          <menu.icon className="w-5 h-5 text-[var(--color-vet-primary)]" />
                          <h3 className="text-sm font-bold text-gray-800 font-['Cairo']">{menu.label}</h3>
                        </div>

                        {menu.items.map((item, idx) => (
                          <Link
                            key={idx}
                            to={item.href}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-[var(--color-vet-primary)]/5 hover:to-[var(--color-vet-secondary)]/5 transition-all group/item relative overflow-hidden"
                          >
                            <div className="relative w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-vet-primary)]/10 to-[var(--color-vet-secondary)]/10 text-[var(--color-vet-primary)] flex items-center justify-center transition-all group-hover/item:scale-110 group-hover/item:rotate-3">
                              <item.icon className="w-5 h-5 relative z-10" />
                              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-vet-primary)] to-[var(--color-vet-secondary)] opacity-0 group-hover/item:opacity-20 rounded-lg transition-opacity"></div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="text-sm font-bold text-gray-800 font-['Cairo'] group-hover/item:text-[var(--color-vet-primary)] transition-colors">{item.label}</div>
                                {item.badge && (
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-vet-accent)]/20 text-[var(--color-vet-accent)] uppercase tracking-wide">{item.badge}</span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-500 font-['Tajawal'] leading-relaxed">{item.desc}</div>
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-400 transform rotate-90 opacity-0 group-hover/item:opacity-100 transition-all" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Invisible spacer to maintain perfect absolute centering (balances the Language Switcher on the left) */}
              <div className="mr-4 w-10 pointer-events-none invisible" aria-hidden="true"></div>
            </div>

            {/* 3. RIGHT ACTIONS - Enhanced with Search, Notifications, Language */}
            <div className="flex items-center gap-2">

              {/* Search Button with Dropdown */}
              <div className="relative" ref={searchRef}>
                <button
                  onClick={() => setSearchOpen(!searchOpen)}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100 group"
                  aria-label="بحث"
                >
                  <Search className="w-5 h-5 text-gray-700 group-hover:text-[var(--color-vet-primary)] transition-colors" />
                </button>

                {/* Search Dropdown */}
                {searchOpen && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                    <form onSubmit={handleSearch}>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={t('navbar.search.placeholder')}
                          aria-label={t('navbar.search.placeholder') || "Search"}
                          className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:border-[var(--color-vet-primary)] focus:ring-2 focus:ring-[var(--color-vet-primary)]/20 outline-none transition-all font-['Tajawal'] text-sm"
                          autoFocus
                        />
                        <button
                          type="submit"
                          aria-label="بحث"
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[var(--color-vet-primary)] text-white rounded-lg flex items-center justify-center hover:bg-[var(--color-vet-primary)]/90 transition-colors"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                      </div>
                      {/* Quick Search Suggestions */}
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2 font-['Tajawal']">
                          {t('navbar.search.quickSearch')}
                        </p>
                        {[
                          { label: t('navbar.search.nearbyVets'), icon: MapPin, link: '/global-vets' },
                          { label: t('navbar.search.popularProducts'), icon: TrendingUp, link: '/products' },
                          { label: t('navbar.search.emergency'), icon: AlertCircle, link: '/emergency' },
                        ].map((item, idx) => (
                          <Link
                            key={idx}
                            to={item.link}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-['Tajawal'] text-gray-700"
                          >
                            <item.icon className="w-4 h-4 text-[var(--color-vet-primary)]" />
                            <span>{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Notifications Bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100 group"
                  aria-label="الإشعارات"
                >
                  <Bell className="w-5 h-5 text-gray-700 group-hover:text-[var(--color-vet-primary)] transition-colors" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-[var(--color-vet-primary)]/5 to-[var(--color-vet-secondary)]/5">
                      <h3 className="font-bold text-gray-800 font-['Cairo']">
                        {t('navbar.notifications.title')}
                      </h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm font-['Tajawal']">
                            {t('navbar.notifications.empty')}
                          </p>
                        </div>
                      ) : (
                        notifications.map((notif, idx) => (
                          <div
                            key={notif._id || idx}
                            className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group relative"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notif.type === 'error' ? 'bg-red-100 text-red-600' :
                                notif.type === 'success' ? 'bg-green-100 text-[var(--color-vet-secondary)]' :
                                  notif.type === 'warning' ? 'bg-yellow-100 text-[var(--color-vet-accent)]' :
                                    'bg-blue-100 text-[var(--color-vet-primary)]'
                                }`}>
                                <Sparkles className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0 pl-10">
                                <p className="text-sm font-bold text-gray-800 font-['Cairo'] mb-1">
                                  {notif.title}
                                </p>
                                <p className="text-xs text-gray-600 font-['Tajawal'] line-clamp-2">
                                  {notif.message}
                                </p>
                              </div>
                            </div>
                            {notif._id && (
                              <button
                                onClick={(e) => handleDeleteNotification(e, notif._id)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 bg-white shadow-sm border border-gray-200 rounded-full transition-all z-10"
                                aria-label="حذف الإشعار"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Language Switcher - Mobile Only */}
              <button
                onClick={() => setLanguage(currentLanguage === 'ar' ? 'en' : 'ar')}
                className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100 group"
                aria-label="تغيير اللغة"
              title={currentLanguage === 'ar' ? 'English' : 'العربية'}
              >
              <div className="relative">
                <Globe className="w-5 h-5 text-gray-700 group-hover:text-[var(--color-vet-primary)] transition-colors" />
                <span className="absolute -bottom-2 -right-2 text-[10px] font-bold text-[var(--color-vet-primary)] uppercase bg-white/80 rounded-full px-1">
                  {currentLanguage === 'ar' ? 'EN' : 'AR'}
                </span>
              </div>
            </button>

            {/* Favorites (Wishlist) */}
            {user && (
              <Link to="/favorites" aria-label="المفضلة" className="relative w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-red-50 hover:shadow-md transition-all border border-transparent hover:border-red-100 group" title={t('favorites.title') || "المفضلة"}>
                <Heart className="w-5 h-5 text-gray-700 group-hover:text-red-500 transition-colors" />
                {(user?.favorites?.length || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm border-2 border-white animate-bounce-short">
                    {user?.favorites?.length}
                  </span>
                )}
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" aria-label="عربة التسوق" className="relative w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100 group">
              <ShoppingCart className="w-5 h-5 text-gray-700 group-hover:text-[var(--color-vet-primary)] transition-colors" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm border-2 border-white animate-bounce-short">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* User Actions - Enhanced */}
            {!user ? (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors hidden sm:block font-['Tajawal']">
                  {t('navbar.actions.login')}
                </Link>
                <Link to="/register" className="group relative px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[var(--color-vet-primary)] to-[var(--color-vet-secondary)] hover:shadow-lg hover:shadow-[var(--color-vet-primary)]/30 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 font-['Tajawal'] overflow-hidden">
                  <span className="relative z-10 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    <span>{t('navbar.actions.register')}</span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-vet-secondary)] to-[var(--color-vet-primary)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Link>
              </div>
            ) : (
              <div className="relative group/profile z-50">
                <Link to={
                  user.role === 'admin' ? '/admin-dashboard' :
                    user.role === 'vet' ? '/doctor-dashboard' :
                      user.role === 'petstore' ? '/petstore-dashboard' :
                        '/customer-dashboard'
                } className="flex items-center gap-2 pl-1 pr-1 py-1 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 ring-2 ring-white">
                    {user.avatarUrl ? (
                      <SafeImage src={getImageUrl(user.avatarUrl)} alt="User" className="w-full h-full object-cover" fallbackSrc="/placeholder-image.png" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[var(--color-vet-primary)] text-white text-sm font-bold">
                        {user.fullName?.[0] || 'U'}
                      </div>
                    )}
                  </div>
                  {/* Role Badge */}
                  <span className="text-xs font-bold text-gray-700 px-3 hidden lg:block max-w-[120px] truncate font-['Tajawal']">
                    {user.fullName || t('navbar.actions.welcome')}
                  </span>
                </Link>

                {/* Profile Dropdown */}
                <div className="absolute left-0 mt-4 w-64 p-2 opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-200 transform origin-top-left z-50 pt-2">
                  <div className="glass-card bg-white/95 rounded-2xl shadow-xl p-2 text-right border border-gray-100 ring-1 ring-black/5">
                    <Link to={
                      user.role === 'admin' ? '/admin-dashboard' :
                        user.role === 'vet' ? '/doctor-dashboard' :
                          user.role === 'petstore' ? '/petstore-dashboard' :
                            '/customer-dashboard'
                    } className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm font-bold text-gray-700 font-['Tajawal']">
                      <Home className="w-4 h-4 text-[var(--color-vet-primary)]" />
                      <span>{t('navbar.actions.dashboard')}</span>
                    </Link>
                    <Link to="/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm font-bold text-gray-700 font-['Tajawal']">
                      <User className="w-4 h-4 text-[var(--color-vet-primary)]" />
                      <span>{t('navbar.actions.profile')}</span>
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin/transactions" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm font-bold text-gray-700 font-['Tajawal']">
                        <DollarSign className="w-4 h-4 text-[var(--color-vet-primary)]" />
                        <span>{t('navbar.actions.transactions')}</span>
                      </Link>
                    )}
                    <Link to="/billing" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-sm font-bold text-gray-700 font-['Tajawal']">
                      <CreditCard className="w-4 h-4 text-[var(--color-vet-accent)]" />
                      <span>{t('navbar.actions.billing')}</span>
                    </Link>
                    <div className="h-px bg-gray-100 my-1" />
                    <button onClick={handleLogout} className="flex w-full items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors text-sm font-bold font-['Tajawal']">
                      <LogOut className="w-4 h-4" />
                      <span>{t('navbar.actions.logout')}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              aria-label="القائمة"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 4. MOBILE MENU (Enhanced) */}
      <div className={`fixed inset-0 z-40 bg-white/95 backdrop-blur-xl transition-all duration-500 lg:hidden flex flex-col pt-24 px-6 ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
        <div className="space-y-6 overflow-y-auto max-h-[85vh] pb-10">
          {megaMenus.map((menu, i) => (
            <div key={i} className="mb-6">
              <h3 className="text-lg font-bold text-[var(--color-vet-primary)] mb-3 font-['Cairo'] border-b border-gray-100 pb-2">{menu.label}</h3>
              <div className="grid grid-cols-1 gap-2">
                {menu.items.map((item, j) => (
                  <Link
                    key={j}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[var(--color-vet-primary)] shadow-sm">
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-gray-700 font-['Tajawal']">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {!user && (
            <div className="pt-4 border-t border-gray-100">
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block w-full py-4 text-center font-bold text-gray-600 bg-gray-100 rounded-2xl mb-3 font-['Tajawal']">
                {t('navbar.actions.login')}
              </Link>
              <Link to="/register" onClick={() => setIsMenuOpen(false)} className="block w-full py-4 text-center font-bold text-white bg-[var(--color-vet-primary)] rounded-2xl shadow-lg shadow-[var(--color-vet-primary)]/30 font-['Tajawal']">
                {t('navbar.actions.register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav >
      {/* Spacer to prevent content overlap with fixed navbar */ }
      < div className = "h-24 sm:h-28" />
    </>
  )
}

export default Navbar
