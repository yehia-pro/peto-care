import axios from 'axios'

// Extend ImportMeta interface for Vite environment variables
declare global {
  interface ImportMeta {
    env: {
      VITE_API_URL?: string
      [key: string]: string | undefined
    }
  }
}

export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://yehia-ayman-peto-care-server.hf.space/api' : '/api')

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor — Supabase issues access tokens; no Express /auth/refresh in hard cutover.
api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)

// Auth API
export const authAPI = {
  register: (userData: any) => api.post('/auth/register', userData),
  registerMultipart: (formData: FormData) =>
    api.post('/auth/register-store', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  registerVetMultipart: (formData: FormData) =>
    api.post('/auth/register-vet', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  login: (credentials: any) => api.post('/auth/login', credentials),
  refresh: () => api.post('/auth/refresh'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  seedDemoVet: () => api.post('/auth/seed-demo-vet'),
  seedDemoStore: () => api.post('/auth/seed-demo-store'),
  seedDemoUser: () => api.post('/auth/seed-demo-user'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) => api.post('/auth/reset-password', { token, newPassword }),
}

// Vets API
export const vetsAPI = {
  registerVet: (vetData: any) => api.post('/vets/register', vetData),
  getVets: (params?: any) => api.get('/vets', { params }),
  getVet: (id: string) => api.get(`/vets/${id}`),
  updateVet: (id: string, data: any) => api.put(`/vets/${id}`, data),
  verifyVet: (id: string) => api.post(`/vets/${id}/verify`),
  addVetAdmin: (data: any) => api.post('/vets/admin/add', data),
}

// Appointments API
export const appointmentsAPI = {
  createAppointment: (appointmentData: any) => api.post('/appointments', appointmentData),
  getAppointments: (params?: any) => api.get('/appointments', { params }),
  getAppointment: (id: string) => api.get(`/appointments/${id}`),
  updateAppointmentStatus: (id: string, status: 'confirmed' | 'cancelled', scheduledAt?: string, entryNumber?: number, doctorNotes?: string) => 
    api.patch(`/appointments/${id}/status`, { status, scheduledAt, entryNumber, doctorNotes }),
  cancelAppointment: (id: string) => api.delete(`/appointments/${id}`),
  rescheduleAppointment: (id: string, scheduledAt: string) => api.patch(`/appointments/${id}/reschedule`, { scheduledAt }),
  getAvailableSlots: (vetId: string, date: string) => api.get(`/appointments/available-slots/${vetId}`, { params: { date } }),
}

// Pet Records API
export const recordsAPI = {
  createRecord: (recordData: any) => api.post('/records', recordData),
  getRecords: (params?: any) => api.get('/records', { params }),
  getRecord: (id: string) => api.get(`/records/${id}`),
  updateRecord: (id: string, data: any) => api.put(`/records/${id}`, data),
  deleteRecord: (id: string) => api.delete(`/records/${id}`),
}

// Reviews API
export const reviewsAPI = {
  createReview: (reviewData: any) => api.post('/reviews', reviewData),
  getReviews: (vetId: string) => api.get(`/reviews/vet/${vetId}`),
  getMyReviews: () => api.get('/reviews/my-reviews'),
  updateReview: (id: string, data: any) => api.put(`/reviews/${id}`, data),
  deleteReview: (id: string) => api.delete(`/reviews/${id}`),
}

// File Upload API
export const uploadAPI = {
  uploadDocument: (file: File, type: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    return api.post('/uploads/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/uploads/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  uploadVideo: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/uploads/videos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  getFiles: () => api.get('/uploads/my-files'),
}

// Payment API
export const paymentAPI = {
  createPaymentIntent: (amount: number, currency: string = 'usd', metadata?: any) =>
    api.post('/payments/create-intent', { amount, currency, metadata }),
  confirmPayment: (paymentIntentId: string) =>
    api.post('/payments/confirm', { paymentIntentId }),
  getPaymentHistory: () => api.get('/payments/history'),
}

// Admin API
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/overview'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  getVets: (params?: any) => api.get('/admin/vets', { params }),
  getAppointments: (params?: any) => api.get('/admin/appointments', { params }),
  updateUserStatus: (id: string, status: string) => api.patch(`/admin/users/${id}/status`, { status }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  verifyVet: (id: string) => api.post(`/admin/vets/${id}/verify`),
  updateAppointmentStatus: (id: string, status: string) => api.patch(`/admin/appointments/${id}/status`, { status }),
  getPendingUsers: () => api.get('/admin/pending'),
  approveUser: (id: string) => api.put(`/admin/approve/${id}`),
  rejectUser: (id: string) => api.delete(`/admin/reject/${id}`),
  deleteStore: (userId: string) => api.delete(`/admin/stores/${userId}`),
  getTransactions: (page = 1, limit = 20, status?: string) => api.get('/transactions', { params: { page, limit, status } }),
}

// Chat API
export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  getMessages: (conversationId: string) => api.get(`/chat/${conversationId}`),
  sendMessage: (conversationId: string, message: string) =>
    api.post(`/chat/${conversationId}/messages`, { message }),
  createConversation: (participantId: string) =>
    api.post('/chat/conversations', { participantId }),
}

type ApplicationPayload = {
  type: 'vet' | 'petstore'
  data: Record<string, any>
}

// Notifications API
export const notificationsAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  deleteNotification: (id: string) => api.delete(`/notifications/${id}`),
  sendEmail: (data: any) => api.post('/notifications/send-email', data),
  sendApplication: (payload: ApplicationPayload) => api.post('/notifications/application', payload),
  registerPushToken: (token: string) => api.post('/notifications/register-token', { token }),
}

export const deliveryAPI = {
  createOrder: (data: any) => api.post('/delivery/orders', data),
  getOrders: () => api.get('/delivery/orders'),
  getOrder: (id: string) => api.get(`/delivery/orders/${id}`),
  updateOrderStatus: (id: string, status: string) => api.patch(`/delivery/orders/${id}/status`, { status }),
  assignDriver: (id: string, driverId: string) => api.post(`/delivery/orders/${id}/assign`, { driverId }),
  createDriver: (data: any) => api.post('/delivery/drivers', data),
  getDrivers: () => api.get('/delivery/drivers'),
  updateDriverLocation: (id: string, lat: number, lng: number, orderId?: string) => api.patch(`/delivery/drivers/${id}/location`, { lat, lng, orderId }),
  createTariff: (data: any) => api.post('/delivery/tariffs', data),
  getTariffs: () => api.get('/delivery/tariffs'),
  rateOrder: (id: string, rating: number, comment?: string) => api.post(`/delivery/orders/${id}/rate`, { rating, comment })
}

export const zonesAPI = {
  createZone: (data: any) => api.post('/delivery/zones', data),
  getZones: () => api.get('/delivery/zones')
}

// Pet Stores API
export const petStoresAPI = {
  getAll: (params?: any) => api.get('/petstores', { params }),
  getOne: (id: string) => api.get(`/petstores/${id}`),
  getProfile: () => api.get('/petstores/profile'),
  updateProfile: (data: any) => api.put('/petstores/profile', data),
  getProducts: () => api.get('/petstores/products'),
  addProduct: (data: any) => api.post('/petstores/products', data),
  deleteProduct: (id: string) => api.delete(`/petstores/products/${id}`),
}

// Cart API
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (item: any) => api.post('/cart/add', item),
  removeFromCart: (productId: string) => api.delete(`/cart/remove/${productId}`),
  checkout: () => api.post('/cart/checkout'),
}

// Favorites API
export const favoritesAPI = {
  getFavorites: () => api.get('/favorites'),
  getFavoritesDetails: () => api.get('/favorites/details'),
  toggle: (itemId: string, itemType: string) => api.post('/favorites/toggle', { itemId, itemType }),
}

// Orders API
export const ordersAPI = {
  create: (data: any) => api.post('/orders', data),
  createCheckoutSession: (data: any) => api.post('/orders/checkout-session', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  getStoreOrders: () => api.get('/orders/store-orders'),
  updateStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status })
}

// Slots API
export const slotsAPI = {
  getSlots: () => api.get('/slots'),
  createSlot: (data: any) => api.post('/slots', data),
  deleteSlot: (id: string) => api.delete(`/slots/${id}`),
  getVetSlots: (vetId: string) => api.get(`/slots/vet/${vetId}`),
}



// AI API
export const aiAPI = {
  ask: (question: string) => api.post('/ai/ask', { question }),
}

// Forms API
export const formsAPI = {
  getForms: () => api.get('/forms'),
  createForm: (formData: any) => api.post('/forms', formData),
  updateForm: (id: string, formData: any) => api.put(`/forms/${id}`, formData),
  deleteForm: (id: string) => api.delete(`/forms/${id}`),
}

export default api
export const testEmailAPI = { test: () => api.get('/test-email') }
