import { useEffect, useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LanguageProvider from './components/LanguageProvider'
import { SocketProvider } from './context/SocketContext'
import { useLanguageStore } from './stores/languageStore'
import { useAuthStore } from './stores/authStore'

const UnifiedSupport = lazy(() => import('./components/UnifiedSupport').then(module => ({ default: module.UnifiedSupport })))
import { ErrorBoundary } from './components/ErrorBoundary'
import SplashScreen from './components/SplashScreen'

// Lazy load all pages for better code splitting
const Home = lazy(() => import('./pages/Home'))
const CustomerServices = lazy(() => import('./pages/CustomerServices'))
const CustomerService = lazy(() => import('./pages/CustomerService'))
const GlobalVets = lazy(() => import('./pages/GlobalVets'))
const PublicVetProfile = lazy(() => import('./pages/PublicVetProfile'))
const Emergency = lazy(() => import('./pages/Emergency'))
const Login = lazy(() => import('./pages/Login'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Register = lazy(() => import('./pages/Register'))
const VetRegistration = lazy(() => import('./pages/VetRegistration'))
const PetStoreRegistration = lazy(() => import('./pages/PetStoreRegistration'))
const PendingApproval = lazy(() => import('./pages/PendingApproval'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Chat = lazy(() => import('./pages/Chat'))
const Appointments = lazy(() => import('./pages/Appointments'))
const VetBookings = lazy(() => import('./pages/VetBookings'))
const PetRecords = lazy(() => import('./pages/PetRecords'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminTransactions = lazy(() => import('./pages/admin/Transactions'))
const AdminManagePetGuides = lazy(() => import('./pages/admin/ManagePetGuides'))
const AdminManageDiseases = lazy(() => import('./pages/admin/ManageDiseases'))
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'))
const AdminManageStores = lazy(() => import('./pages/admin/AdminManageStores'))
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard'))
const CustomerDashboard = lazy(() => import('./pages/CustomerDashboard'))
const PetStoreDashboard = lazy(() => import('./pages/PetStoreDashboard'))
const NoPets = lazy(() => import('./pages/NoPets'))
const PartnerStores = lazy(() => import('./pages/PartnerStores'))
const StoreDetails = lazy(() => import('./pages/StoreDetails'))
const Billing = lazy(() => import('./pages/Billing'))
const Products = lazy(() => import('./pages/Products'))
const Cart = lazy(() => import('./pages/Cart'))
const Favorites = lazy(() => import('./pages/Favorites'))
const Checkout = lazy(() => import('./pages/Checkout'))
const CheckoutSuccess = lazy(() => import('./pages/CheckoutSuccess'))
const CheckoutCancel = lazy(() => import('./pages/CheckoutCancel'))
const DeliveryRequest = lazy(() => import('./pages/DeliveryRequest'))
const DeliveryTracking = lazy(() => import('./pages/DeliveryTracking'))
const DeliveryAdmin = lazy(() => import('./pages/DeliveryAdmin'))
const VeterinaryDiseases = lazy(() => import('./pages/VeterinaryDiseases'))
const Profile = lazy(() => import('./pages/Profile'))
const AboutUs = lazy(() => import('./pages/AboutUs'))
const ContactUs = lazy(() => import('./pages/ContactUs'))
const Terms = lazy(() => import('./pages/Terms'))
const Privacy = lazy(() => import('./pages/Privacy'))
const FAQ = lazy(() => import('./pages/FAQ'))
const Community = lazy(() => import('./pages/Community'))
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'))

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-green-50 to-purple-50 z-50">
      <div className="relative w-24 h-24 flex items-center justify-center bg-white rounded-3xl shadow-xl mb-8 animate-pulse">
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C7 2 3 6 3 11c0 3.3 2 6 5 8 .9.6 1.3 1.6 1 2.6L8.5 24l3.1-1.6c1-.6 2.2-.6 3.2 0L18 24l-.5-2.4c-.3-1 .1-2 1-2.6 3-2 5-4.7 5-8 0-5-4-9-9-9z"></path>
          <circle cx="8" cy="10" r="1.5" fill="#2563eb" />
          <circle cx="16" cy="10" r="1.5" fill="#2563eb" />
        </svg>
      </div>
      <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">بيتو كير</div>
      <div className="text-slate-500 font-medium flex items-center gap-1">جاري تجهيز الصفحة<span className="animate-pulse">...</span></div>
    </div>
  }>
    {children}
  </Suspense>
)

const OnboardingGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore()
  const locationPath = window.location.pathname

  if (isAuthenticated && user && !user.phone && locationPath !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />
  }

  return <>{children}</>
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isInitializing } = useAuthStore()

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="relative w-16 h-16 flex items-center justify-center bg-white rounded-2xl shadow-lg animate-pulse">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C7 2 3 6 3 11c0 3.3 2 6 5 8 .9.6 1.3 1.6 1 2.6L8.5 24l3.1-1.6c1-.6 2.2-.6 3.2 0L18 24l-.5-2.4c-.3-1 .1-2 1-2.6 3-2 5-4.7 5-8 0-5-4-9-9-9z"></path>
          </svg>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  const { currentLanguage } = useLanguageStore()
  const { isAuthenticated, initializeGoogleAuth, isInitializing } = useAuthStore()
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    initializeGoogleAuth()
  }, [])

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <ErrorBoundary>
        <LanguageProvider>
          <SocketProvider>
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 text-neutral-800 relative overflow-x-hidden">
              <div className="fixed inset-0 bg-gradient-to-br from-primary-100/30 via-secondary-100/30 to-accent-100/30 pointer-events-none z-0"></div>
              <div className="relative z-10 min-h-screen">
                <Navbar />
                <main className="pt-24 min-h-[70vh] relative z-10">
                  <OnboardingGuard>
                      <Routes>
                        <Route path="/" element={<SuspenseWrapper><Home /></SuspenseWrapper>} />
                        <Route path="/services" element={<SuspenseWrapper><CustomerServices /></SuspenseWrapper>} />
                        <Route path="/customer-service" element={<SuspenseWrapper><CustomerService /></SuspenseWrapper>} />
                        <Route path="/global-vets" element={<SuspenseWrapper><GlobalVets /></SuspenseWrapper>} />
                        <Route path="/vets/:id" element={<SuspenseWrapper><PublicVetProfile /></SuspenseWrapper>} />
                        <Route path="/veterinary-diseases" element={<SuspenseWrapper><VeterinaryDiseases /></SuspenseWrapper>} />
                        <Route path="/partner-stores" element={<SuspenseWrapper><PartnerStores /></SuspenseWrapper>} />
                        <Route path="/partner-stores/:id" element={<SuspenseWrapper><StoreDetails /></SuspenseWrapper>} />
                        <Route path="/billing" element={<SuspenseWrapper><Billing /></SuspenseWrapper>} />
                        <Route path="/products" element={<SuspenseWrapper><Products /></SuspenseWrapper>} />
                        <Route path="/cart" element={<SuspenseWrapper><Cart /></SuspenseWrapper>} />
                        <Route path="/favorites" element={<SuspenseWrapper><Favorites /></SuspenseWrapper>} />
                        <Route path="/checkout" element={<SuspenseWrapper><Checkout /></SuspenseWrapper>} />
                        <Route path="/checkout/success" element={<SuspenseWrapper><CheckoutSuccess /></SuspenseWrapper>} />
                        <Route path="/checkout/cancel" element={<SuspenseWrapper><CheckoutCancel /></SuspenseWrapper>} />
                        <Route path="/delivery/request" element={<SuspenseWrapper><DeliveryRequest /></SuspenseWrapper>} />
                        <Route path="/delivery/track" element={<SuspenseWrapper><DeliveryTracking /></SuspenseWrapper>} />
                        <Route path="/delivery/admin" element={<SuspenseWrapper><DeliveryAdmin /></SuspenseWrapper>} />
                        <Route path="/emergency" element={<SuspenseWrapper><Emergency /></SuspenseWrapper>} />
                        <Route path="/login" element={<SuspenseWrapper><Login /></SuspenseWrapper>} />
                        <Route path="/forgot-password" element={<SuspenseWrapper><ForgotPassword /></SuspenseWrapper>} />
                        <Route path="/reset-password" element={<SuspenseWrapper><ResetPassword /></SuspenseWrapper>} />
                        <Route path="/register" element={<SuspenseWrapper><Register /></SuspenseWrapper>} />
                        <Route path="/complete-profile" element={<SuspenseWrapper><CompleteProfile /></SuspenseWrapper>} />
                        <Route path="/vet-registration" element={<SuspenseWrapper><VetRegistration /></SuspenseWrapper>} />
                        <Route path="/petstore-registration" element={<SuspenseWrapper><PetStoreRegistration /></SuspenseWrapper>} />
                        <Route path="/pending-approval" element={<SuspenseWrapper><PendingApproval /></SuspenseWrapper>} />
                        <Route
                          path="/dashboard"
                          element={<ProtectedRoute><SuspenseWrapper><Dashboard /></SuspenseWrapper></ProtectedRoute>}
                        />
                        <Route
                          path="/chat"
                          element={<ProtectedRoute><SuspenseWrapper><Chat /></SuspenseWrapper></ProtectedRoute>}
                        />
                        <Route
                          path="/appointments"
                          element={<ProtectedRoute><SuspenseWrapper><Appointments /></SuspenseWrapper></ProtectedRoute>}
                        />
                        <Route
                          path="/vet-bookings"
                          element={<ProtectedRoute><SuspenseWrapper><VetBookings /></SuspenseWrapper></ProtectedRoute>}
                        />
                        <Route path="/no-pets" element={<SuspenseWrapper><NoPets /></SuspenseWrapper>} />
                        <Route
                          path="/pet-records"
                          element={<ProtectedRoute><SuspenseWrapper><PetRecords /></SuspenseWrapper></ProtectedRoute>}
                        />
                        <Route
                          path="/admin"
                          element={<ProtectedRoute><SuspenseWrapper><AdminDashboard /></SuspenseWrapper></ProtectedRoute>}
                        />
                        <Route
                          path="/admin-dashboard"
                          element={<ProtectedRoute><SuspenseWrapper><AdminDashboard /></SuspenseWrapper></ProtectedRoute>}
                        />
                        <Route
                          path="/admin/transactions"
                          element={<ProtectedRoute><SuspenseWrapper><AdminTransactions /></SuspenseWrapper></ProtectedRoute>}
                        />
                        <Route
                          path="/admin/manage-pet-guides"
                          element={<ProtectedRoute><SuspenseWrapper><AdminManagePetGuides /></SuspenseWrapper></ProtectedRoute>}
                        />
                        <Route
                          path="/admin/manage-diseases"
                          element={<ProtectedRoute><SuspenseWrapper><AdminManageDiseases /></SuspenseWrapper></ProtectedRoute>}
                        />
                        <Route
                          path="/admin/manage-coupons"
                          element={<ProtectedRoute><SuspenseWrapper><AdminCoupons /></SuspenseWrapper></ProtectedRoute>}
                        />
                        <Route
                          path="/admin/manage-stores"
                          element={<ProtectedRoute><SuspenseWrapper><AdminManageStores /></SuspenseWrapper></ProtectedRoute>}
                        />
                        <Route
                          path="/doctor-dashboard"
                          element={<ProtectedRoute><SuspenseWrapper><DoctorDashboard /></SuspenseWrapper></ProtectedRoute>}
                        />
                        <Route
                          path="/customer-dashboard"
                          element={<ProtectedRoute><SuspenseWrapper><CustomerDashboard /></SuspenseWrapper></ProtectedRoute>}
                        />
                        <Route
                          path="/petstore-dashboard"
                          element={<ProtectedRoute><SuspenseWrapper><PetStoreDashboard /></SuspenseWrapper></ProtectedRoute>}
                        />
                        <Route
                          path="/profile"
                          element={<ProtectedRoute><SuspenseWrapper><Profile /></SuspenseWrapper></ProtectedRoute>}
                        />
                        <Route path="/about" element={<SuspenseWrapper><AboutUs /></SuspenseWrapper>} />
                        <Route path="/contact" element={<SuspenseWrapper><ContactUs /></SuspenseWrapper>} />
                        <Route path="/terms" element={<SuspenseWrapper><Terms /></SuspenseWrapper>} />
                        <Route path="/privacy" element={<SuspenseWrapper><Privacy /></SuspenseWrapper>} />
                        <Route path="/faq" element={<SuspenseWrapper><FAQ /></SuspenseWrapper>} />
                        <Route path="/community" element={<SuspenseWrapper><Community /></SuspenseWrapper>} />
                        <Route path="*" element={<SuspenseWrapper><Home /></SuspenseWrapper>} />
                      </Routes>
                  </OnboardingGuard>
                </main>
                <SuspenseWrapper><UnifiedSupport /></SuspenseWrapper>
                <Footer />
              </div>
            </div>
          </SocketProvider>
        </LanguageProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
