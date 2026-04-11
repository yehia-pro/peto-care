import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/authStore'
import { MessageCircle, User, Calendar, Heart, MapPin, Camera, Plus, Edit, Trash2, Clock, Bell } from 'lucide-react'
import { toast } from 'sonner'

interface Pet {
  id: string
  petName: string
  species: string
  breed: string
  age: number
  weight: number
  gender: 'male' | 'female' | 'unknown'
  color: string
  microchipId?: string
  description?: string
  medicalHistory?: string
  vaccinationRecords?: string
  allergies?: string
  currentMedications?: string
  emergencyContact?: string
  createdAt: string
  updatedAt: string
}

interface Appointment {
  id: string
  title: string
  description: string
  scheduledTime: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  vetName: string
  vetSpecialization: string
  price: number
  createdAt: string
}

interface Stats {
  totalPets: number
  upcomingAppointments: number
  completedAppointments: number
  totalVetsVisited: number
}

const CustomerDashboard: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  
  const [pets, setPets] = useState<Pet[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [stats, setStats] = useState<Stats>({
    totalPets: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    totalVetsVisited: 0
  })
  
  const [showPetForm, setShowPetForm] = useState(false)
  const [editingPet, setEditingPet] = useState<Pet | null>(null)
  const [petForm, setPetForm] = useState({
    petName: '',
    species: '',
    breed: '',
    age: 0,
    weight: 0,
    gender: 'unknown' as 'male' | 'female' | 'unknown',
    color: '',
    microchipId: '',
    description: '',
    medicalHistory: '',
    vaccinationRecords: '',
    allergies: '',
    currentMedications: '',
    emergencyContact: ''
  })

  useEffect(() => {
    fetchDashboardData()
    fetchPets()
    fetchAppointments()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/customer/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const fetchPets = async () => {
    try {
      const response = await fetch('/api/records/my-pets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPets(data.pets)
      }
    } catch (error) {
      console.error('Error fetching pets:', error)
    }
  }

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments/my-appointments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAppointments(data.appointments)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setPetForm(prev => ({ 
      ...prev, 
      [name]: name === 'age' || name === 'weight' ? parseFloat(value) || 0 : value 
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!petForm.petName || !petForm.species) {
      toast.error(t('messages.fillAllFields'))
      return
    }

    try {
      const url = editingPet ? `/api/records/${editingPet.id}` : '/api/records'
      const method = editingPet ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(petForm)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(editingPet ? t('messages.petUpdated') : t('messages.petAdded'))
        setShowPetForm(false)
        setEditingPet(null)
        resetForm()
        fetchPets()
        fetchDashboardData()
      } else {
        toast.error(data.message || t('common.error'))
      }
    } catch (error) {
      toast.error(t('common.error'))
    }
  }

  const resetForm = () => {
    setPetForm({
      petName: '',
      species: '',
      breed: '',
      age: 0,
      weight: 0,
      gender: 'unknown',
      color: '',
      microchipId: '',
      description: '',
      medicalHistory: '',
      vaccinationRecords: '',
      allergies: '',
      currentMedications: '',
      emergencyContact: ''
    })
  }

  const handleEditPet = (pet: Pet) => {
    setEditingPet(pet)
    setPetForm({
      petName: pet.petName,
      species: pet.species,
      breed: pet.breed,
      age: pet.age,
      weight: pet.weight,
      gender: pet.gender,
      color: pet.color,
      microchipId: pet.microchipId || '',
      description: pet.description || '',
      medicalHistory: pet.medicalHistory || '',
      vaccinationRecords: pet.vaccinationRecords || '',
      allergies: pet.allergies || '',
      currentMedications: pet.currentMedications || '',
      emergencyContact: pet.emergencyContact || ''
    })
    setShowPetForm(true)
  }

  const handleDeletePet = async (petId: string) => {
    if (!confirm(t('messages.confirmDeletePet'))) return

    try {
      const response = await fetch(`/api/records/${petId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        toast.success(t('messages.petDeleted'))
        fetchPets()
        fetchDashboardData()
      } else {
        toast.error(t('messages.petDeleteFailed'))
      }
    } catch (error) {
      toast.error(t('common.error'))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!user || user.role !== 'user') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            تم الرفض
          </h2>
          <p className="text-gray-600">
            مطلوب صلاحية عميل
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('dashboard.title')}
          </h1>
          <p className="text-gray-600">
            {t('dashboard.welcomeWithName', { name: user.fullName })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الحيوانات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPets}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 text-[var(--color-vet-primary)] rounded-lg flex items-center justify-center">
                <Heart className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">المواعيد القادمة</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingAppointments}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 text-[var(--color-vet-secondary)] rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">المواعيد المكتملة</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedAppointments}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الأطباء</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalVetsVisited}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 text-[var(--color-vet-accent)] rounded-lg flex items-center justify-center">
                <User className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pets Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                حيواناتي الأليفة
              </h2>
              <button
                onClick={() => {
                  setEditingPet(null)
                  resetForm()
                  setShowPetForm(true)
                }}
                className="flex items-center px-3 py-2 bg-[var(--color-vet-primary)] text-white rounded-md hover:bg-[var(--color-vet-primary)] text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                إضافة حيوان
              </button>
            </div>

            {pets.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  لا توجد حيوانات
                </h3>
                <p className="text-gray-600 mb-4">
                  أضف أول حيوان لك
                </p>
                <button
                  onClick={() => setShowPetForm(true)}
                  className="px-4 py-2 bg-[var(--color-vet-primary)] text-white rounded-md hover:bg-[var(--color-vet-primary)]"
                >
                  إضافة حيوان
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {pets.slice(0, 3).map((pet) => (
                  <div key={pet.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{pet.petName}</h3>
                        <p className="text-sm text-gray-600">
                          {pet.species} • {pet.breed}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditPet(pet)}
                          className="p-1 text-[var(--color-vet-primary)] hover:bg-blue-50 rounded"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePet(pet.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">العمر:</span>
                        <span className="ml-1 font-medium">{pet.age} سنوات</span>
                      </div>
                      <div>
                        <span className="text-gray-500">الوزن:</span>
                        <span className="ml-1 font-medium">{pet.weight} كجم</span>
                      </div>
                      <div>
                        <span className="text-gray-500">الجنس:</span>
                        <span className="ml-1 font-medium">
                          {pet.gender === 'male' ? 'ذكر' : pet.gender === 'female' ? 'أنثى' : 'غير معروف'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">اللون:</span>
                        <span className="ml-1 font-medium">{pet.color}</span>
                      </div>
                    </div>
                    {pet.medicalHistory && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">التاريخ الطبي:</span>
                          <span className="ml-1">{pet.medicalHistory.length > 50 ? pet.medicalHistory.substring(0, 50) + '...' : pet.medicalHistory}</span>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                {pets.length > 3 && (
                  <div className="text-center pt-4">
                    <button className="text-[var(--color-vet-primary)] hover:text-blue-800 text-sm font-medium">
                      عرض جميع الحيوانات
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Appointments Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                المواعيد القادمة
              </h2>
              <button className="text-[var(--color-vet-primary)] hover:text-blue-800 text-sm font-medium">
                عرض الكل
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  لا توجد مواعيد قادمة
                </h3>
                <p className="text-gray-600 mb-4">
                  احجز أول موعد لك
                </p>
                <button className="px-4 py-2 bg-[var(--color-vet-primary)] text-white rounded-md hover:bg-[var(--color-vet-primary)]">
                  حجز موعد
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.slice(0, 3).map((appointment) => (
                  <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{appointment.title}</h3>
                        <p className="text-sm text-gray-600">{appointment.vetName}</p>
                        <p className="text-sm text-gray-500">{appointment.vetSpecialization}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status === 'confirmed' ? 'مؤكد' : 
                         appointment.status === 'pending' ? 'قيد الانتظار' :
                         appointment.status === 'completed' ? 'مكتمل' : 'ملغي'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <div className="flex items-center mb-1">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(appointment.scheduledTime).toLocaleDateString('ar-EG')}
                      </div>
                      <div className="flex items-center mb-1">
                        <Clock className="h-4 w-4 mr-2" />
                        {new Date(appointment.scheduledTime).toLocaleTimeString('ar-EG', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        العيادة
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <span className="text-sm font-medium text-gray-900">
                        {appointment.price} دولار
                      </span>
                      <div className="flex space-x-2">
                        <button className="p-1 text-[var(--color-vet-primary)] hover:bg-blue-50 rounded">
                          <MessageCircle className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-[var(--color-vet-secondary)] hover:bg-green-50 rounded">
                          <Camera className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {appointments.length > 3 && (
                  <div className="text-center pt-4">
                    <button className="text-[var(--color-vet-primary)] hover:text-blue-800 text-sm font-medium">
                      عرض جميع المواعيد
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pet Form Modal */}
        {showPetForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingPet ? 'تعديل الحيوان' : 'إضافة حيوان'}
                </h3>
                <button
                  onClick={() => {
                    setShowPetForm(false)
                    setEditingPet(null)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      اسم الحيوان *
                    </label>
                    <input
                      type="text"
                      name="petName"
                      value={petForm.petName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      النوع *
                    </label>
                    <input
                      type="text"
                      name="species"
                      value={petForm.species}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                      placeholder="كلب، قطة، طائر، إلخ"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      السلالة
                    </label>
                    <input
                      type="text"
                      name="breed"
                      value={petForm.breed}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                      placeholder="جولدن ريتريفر، فارسي، إلخ"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      العمر
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={petForm.age}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الوزن (كجم)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="weight"
                      value={petForm.weight}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الجنس
                    </label>
                    <select
                      name="gender"
                      value={petForm.gender}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    >
                      <option value="unknown">غير معروف</option>
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      اللون
                    </label>
                    <input
                      type="text"
                      name="color"
                      value={petForm.color}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      رقم الشريحة
                    </label>
                    <input
                      type="text"
                      name="microchipId"
                      value={petForm.microchipId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الوصف
                  </label>
                  <textarea
                    name="description"
                    value={petForm.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    placeholder="صف حيوانك الأليف..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    التاريخ الطبي
                  </label>
                  <textarea
                    name="medicalHistory"
                    value={petForm.medicalHistory}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    placeholder="سجل أي مشاكل صحية سابقة..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    سجلات التطعيم
                  </label>
                  <textarea
                    name="vaccinationRecords"
                    value={petForm.vaccinationRecords}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    placeholder="سجل لقاحات الحيوان..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الحساسية
                  </label>
                  <textarea
                    name="allergies"
                    value={petForm.allergies}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    placeholder="سجل أي حساسيات معروفة..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    الأدوية الحالية
                  </label>
                  <textarea
                    name="currentMedications"
                    value={petForm.currentMedications}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    placeholder="سجل الأدوية الحالية..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    جهة الاتصال في حالات الطوارئ
                  </label>
                  <input
                    type="tel"
                    name="emergencyContact"
                    value={petForm.emergencyContact}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                    placeholder="اسم ورقم هاتف جهة الاتصال..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPetForm(false)
                      setEditingPet(null)
                      resetForm()
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--color-vet-primary)] text-white rounded-md hover:bg-[var(--color-vet-primary)] flex items-center"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    {editingPet ? 'تحديث الحيوان' : 'إضافة حيوان'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomerDashboard