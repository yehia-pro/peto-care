import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useLanguageStore } from '@/stores/languageStore'
import { toast } from 'sonner'
import { notificationsAPI, formsAPI } from '@/services/api'
import api from '@/services/api'
import { Trash2, FileText, Calendar, Edit2 } from 'lucide-react'

interface PetCondition {
  petType: string
  petName: string
  age: string
  gender: string
  symptoms: string
  duration: string
  previousTreatment: string
  medications: string
  contactMethod: string
  phone: string
  alternatePhone?: string
  additionalInfo: string
  _id?: string
  createdAt?: string
}

export default function CustomerServices() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const vetId = searchParams.get('vetId')
  const vetName = searchParams.get('vetName')
  const { t } = useLanguageStore()

  const petTypes = [
    t('petTypes.dog'), t('petTypes.cat'), t('petTypes.bird'), t('petTypes.rabbit'),
    t('petTypes.hamster'), t('petTypes.fish'), t('petTypes.turtle'), t('petTypes.horse'),
    t('petTypes.livestock'), t('petTypes.other')
  ]

  const genders = [t('gender.male'), t('gender.female')]

  const contactMethods = [
    t('contact.phone'), t('customerServices.records.whatsapp')
  ]
  const [formData, setFormData] = useState<PetCondition>({
    petType: '',
    petName: '',
    age: '',
    gender: '',
    symptoms: '',
    duration: '',
    previousTreatment: '',
    medications: '',
    contactMethod: '',
    phone: '',
    alternatePhone: '',
    additionalInfo: ''
  })

  const [submittedRequests, setSubmittedRequests] = useState<PetCondition[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingFormId, setEditingFormId] = useState<string | null>(null)

  // Load saved requests on mount
  useEffect(() => {
    if (user) {
      loadForms()
    }
  }, [user])

  const loadForms = async () => {
    try {
      const res = await formsAPI.getForms()
      setSubmittedRequests(res.data.forms || [])
    } catch (e) {
      console.error("Failed to load forms", e)
    }
  }

  const handleDeleteRequest = async (id: string) => {
    try {
      if (editingFormId === id) {
        setEditingFormId(null)
        setFormData({
          petType: '', petName: '', age: '', gender: '', symptoms: '', duration: '',
          previousTreatment: '', medications: '', contactMethod: '', phone: '', alternatePhone: '', additionalInfo: ''
        })
      }
      await formsAPI.deleteForm(id)
      setSubmittedRequests(prev => prev.filter(req => req._id !== id))
      toast.success(t('customerServices.records.deletedSuccess'))
    } catch (e) {
      toast.error(t('customerServices.records.deletedError'))
    }
  }

  const handleEditClick = (req: PetCondition) => {
    setFormData(req)
    setEditingFormId(req._id || null)
    const formElement = document.getElementById('consultation-form')
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendExistingForm = async (req: PetCondition) => {
    if (!user || !vetId) return;
    setIsSubmitting(true);
    try {
        const reasonSummary = `طلب استشارة: ${req.petType} - ${req.symptoms.substring(0, 50)}...`;
        const formDetails = `بيانات الاستمارة:\nالنوع: ${req.petType || '-'}\nالاسم: ${req.petName || '-'}\nالعمر: ${req.age || '-'}\nالجنس: ${req.gender || '-'}\nالأعراض: ${req.symptoms || '-'}\nتاريخ البداية: ${req.duration || '-'}\nعلاجات سابقة: ${req.previousTreatment || '-'}\nأدوية: ${req.medications || '-'}\nالتواصل: ${req.contactMethod || '-'}\nرقم الهاتف: ${req.phone || '-'}\nرقم هاتف بديل: ${req.alternatePhone || '-'}\nإضافي: ${req.additionalInfo || '-'}`;
        
        const scheduledAt = new Date(Date.now() + 86400000).toISOString();

        await api.post('/appointments', {
          vetId,
          scheduledAt,
          reason: reasonSummary,
          notes: formDetails,
          price: 150,
          currency: 'EGP'
        });

        toast.success(`${t('customerServices.records.sentSuccess')} ${vetName || ''} ${t('customerServices.records.sentSuccessSuffix')}`);
        setTimeout(() => navigate('/appointments'), 1500);
    } catch (error) {
        console.error('Error sending appointment:', error);
        toast.error(t('customerServices.records.sentError'));
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const specializations = t('customerServices.specializations.list', { returnObjects: true }) as unknown as Record<string, string>;
  const specializationList = Object.values(specializations);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error(t('customerServices.messages.loginRequired'))
      return
    }

    setIsSubmitting(true)

    try {
      // Save to database first as requested by user
      if (editingFormId) {
        await formsAPI.updateForm(editingFormId, formData)
        setEditingFormId(null)
      } else {
        await formsAPI.createForm(formData)
      }
      await loadForms()

      if (vetId) {
        // Create appointment request
        const reasonSummary = `طلب استشارة: ${formData.petType} - ${formData.symptoms.substring(0, 50)}...`
        const formDetails = `بيانات الاستمارة:\nالنوع: ${formData.petType || '-'}\nالاسم: ${formData.petName || '-'}\nالعمر: ${formData.age || '-'}\nالجنس: ${formData.gender || '-'}\nالأعراض: ${formData.symptoms || '-'}\nتاريخ البداية: ${formData.duration || '-'}\nعلاجات سابقة: ${formData.previousTreatment || '-'}\nأدوية: ${formData.medications || '-'}\nالتواصل: ${formData.contactMethod || '-'}\nرقم الهاتف: ${formData.phone || '-'}\nرقم هاتف بديل: ${formData.alternatePhone || '-'}\nإضافي: ${formData.additionalInfo || '-'}`;

        const scheduledAt = new Date(Date.now() + 86400000).toISOString();

        await api.post('/appointments', {
          vetId,
          scheduledAt,
          reason: reasonSummary,
          notes: formDetails,
          price: 150, // Default base price for consultation request
          currency: 'EGP'
        })

        toast.success(`${t('customerServices.records.sentSuccess')} ${vetName || ''} ${t('customerServices.records.sentSuccessSuffix')}`)
      } else {
        // Show success first — form is already saved
        toast.success(t('customerServices.messages.submitSuccess'))

        // Try sending email notification (non-blocking)
        try {
          const lines = [
            t('notifications.newConsultation.header'),
            `${t('auth.email')}: ${user?.email || 'غير متاح'}`,
            '',
            `${t('customerServices.form.petType')}: ${formData.petType || '-'}`,
            `${t('customerServices.form.petName')}: ${formData.petName || '-'}`,
            `${t('customerServices.form.age')}: ${formData.age || '-'}`,
            `${t('customerServices.form.gender')}: ${formData.gender || '-'}`,
            `${t('customerServices.form.symptoms')}: ${formData.symptoms || '-'}`,
            `${t('customerServices.form.duration')}: ${formData.duration || '-'}`,
            `${t('customerServices.form.previousTreatment')}: ${formData.previousTreatment || '-'}`,
            `${t('customerServices.form.medications')}: ${formData.medications || '-'}`,
            `${t('customerServices.form.contactMethod')}: ${formData.contactMethod || '-'}`,
            `${t('customerServices.records.phoneCommunication')}: ${formData.phone || '-'}`,
            formData.alternatePhone ? `${t('customerServices.records.alternatePhone')}: ${formData.alternatePhone}` : '',
            '',
            `${t('customerServices.form.additionalInfo')}: ${formData.additionalInfo || '-'}`,
          ].join('\n')

          await notificationsAPI.sendEmail({
            to: ['yaheaeldesoky0@gmail.com', 'aymanyoussef219@gmail.com'],
            subject: t('notifications.newConsultation.subject'),
            message: lines,
          })
        } catch (emailErr) {
          // Email failed silently — form is still saved
          console.warn('Email notification failed (non-critical):', emailErr)
        }
      }
      setFormData({
        petType: '',
        petName: '',
        age: '',
        gender: '',
        symptoms: '',
        duration: '',
        previousTreatment: '',
        medications: '',
        contactMethod: '',
        phone: '',
        alternatePhone: '',
        additionalInfo: ''
      })

      if (vetId) {
        // Navigate to appointments to see the new request
        setTimeout(() => navigate('/appointments'), 1500)
      }

    } catch (error) {
      console.error('Error submitting pet condition:', error)
      toast.error(t('customerServices.messages.submitError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden">

          {/* Header Section */}
          <div className="bg-gradient-to-r from-[var(--color-vet-primary)] to-[var(--color-vet-primary)] p-8 text-white text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-3" data-key="customerServices.title">{t('customerServices.title')}</h2>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed" data-key="customerServices.subtitle">{t('customerServices.subtitle')}</p>
          </div>

          <div className="p-6 md:p-10">
            {/* Show Selected Vet Banner */}
            {vetId && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <FileText className="w-8 h-8 text-[var(--color-vet-primary)]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-900">{t('customerServices.records.bookingAt')} {vetName || 'الطبيب المختار'}</h3>
                  <p className="text-[var(--color-vet-primary)] text-sm">{t('customerServices.records.willBeSentToVet')}</p>
                </div>
              </div>
            )}

            {/* Submitted Requests Section (Replaces Specializations) */}
            {user && (
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-8 bg-[var(--color-vet-secondary)] rounded-full inline-block"></span>
                  {t('customerServices.records.title')}
                </h3>

                {submittedRequests.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">{t('customerServices.records.noRequests')}</p>
                    <p className="text-sm text-gray-400 mt-1">{t('customerServices.records.noRequestsDesc')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {submittedRequests.map((req) => (
                      <div key={req._id} className="border border-gray-100 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow relative group">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-bold text-lg text-gray-800 flex items-center gap-2">
                              {req.petName}
                              <span className="text-xs font-normal px-2 py-0.5 bg-blue-50 text-[var(--color-vet-primary)] rounded-full border border-blue-100">
                                {req.petType}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              {req.createdAt ? new Date(req.createdAt).toLocaleDateString('ar-EG') : ''}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditClick(req)}
                              className="text-gray-400 hover:text-[var(--color-vet-primary)] transition-colors p-1"
                              title={t('customerServices.records.editDetails')}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => req._id && handleDeleteRequest(req._id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              title={t('customerServices.records.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            <span className="font-semibold text-gray-700">{t('customerServices.records.symptomsLabel')}</span> {req.symptoms}
                          </p>
                          {req.medications && (
                            <p className="text-sm text-gray-600 line-clamp-1">
                              <span className="font-semibold text-gray-700">{t('customerServices.records.medicationsLabel')}</span> {req.medications}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (vetId) {
                                handleSendExistingForm(req);
                              } else {
                                navigate('/global-vets');
                              }
                            }}
                            className={`flex-1 px-4 py-2.5 text-xs font-semibold text-white rounded-xl transition-colors shadow-sm text-center ${vetId ? 'bg-[var(--color-vet-secondary)] hover:bg-[var(--color-vet-secondary)] shadow-green-200' : 'bg-[var(--color-vet-primary)] hover:bg-[var(--color-vet-primary)] shadow-blue-200'}`}
                          >
                            {vetId ? `${t('customerServices.records.sendToVet')} ${vetName || ''}` : t('customerServices.records.chooseVetToBook')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!user ? (
              <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-100">
                <div className="max-w-md mx-auto px-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
                    <h3 className="text-lg font-bold text-yellow-800 mb-2" data-key="customerServices.loginRequired.title">{t('customerServices.loginRequired.title')}</h3>
                    <p className="text-[var(--color-vet-accent)] leading-relaxed" data-key="customerServices.loginRequired.desc">{t('customerServices.loginRequired.desc')}</p>
                  </div>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full sm:w-auto bg-[var(--color-vet-primary)] text-white px-8 py-4 rounded-xl font-bold hover:bg-[var(--color-vet-primary)] transition-all transform hover:-translate-y-0.5 shadow-lg shadow-blue-200"
                  >
                    {t('customerServices.loginButton')}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-8 bg-purple-600 rounded-full inline-block"></span>
                    {t('notifications.newConsultation.header') || 'طلب استشارة بيطرية'}
                  </h3>

                  <form id="consultation-form" onSubmit={handleSubmit} className="space-y-8">
                    {/* Pet Details Group */}
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      <h4 className="text-lg font-bold text-gray-700 mb-4 border-b border-gray-200 pb-2">{t('customerServices.records.petDetails')}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="petType" className="block text-sm font-semibold text-gray-700 mb-2" data-key="customerServices.form.petType">
                            {t('customerServices.form.petType')}
                          </label>
                          <select
                            id="petType"
                            name="petType"
                            required
                            value={formData.petType}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-transparent transition-all"
                          >
                            <option value="" data-key="customerServices.form.petType.placeholder">{t('customerServices.form.petType_placeholder')}</option>
                            {petTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="petName" className="block text-sm font-semibold text-gray-700 mb-2" data-key="customerServices.form.petName">
                            {t('customerServices.form.petName')}
                          </label>
                          <input
                            type="text"
                            id="petName"
                            name="petName"
                            required
                            value={formData.petName}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-transparent transition-all placeholder-gray-400"
                            placeholder={t('customerServices.form.petName_placeholder')}
                          />
                        </div>
                        <div>
                          <label htmlFor="age" className="block text-sm font-semibold text-gray-700 mb-2" data-key="customerServices.form.age">
                            {t('customerServices.form.age')}
                          </label>
                          <input
                            type="text"
                            id="age"
                            name="age"
                            required
                            value={formData.age}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-transparent transition-all placeholder-gray-400"
                            placeholder={t('customerServices.form.age_placeholder')}
                          />
                        </div>
                        <div>
                          <label htmlFor="gender" className="block text-sm font-semibold text-gray-700 mb-2" data-key="customerServices.form.gender">
                            {t('customerServices.form.gender')}
                          </label>
                          <select
                            id="gender"
                            name="gender"
                            required
                            value={formData.gender}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-transparent transition-all"
                          >
                            <option value="" data-key="customerServices.form.gender.placeholder">{t('customerServices.form.gender_placeholder')}</option>
                            {genders.map(gender => (
                              <option key={gender} value={gender}>{gender}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Condition Details Group */}
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                      <h4 className="text-lg font-bold text-gray-700 mb-4 border-b border-gray-200 pb-2">{t('customerServices.records.healthInfo')}</h4>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                          <div>
                            <label htmlFor="duration" className="block text-sm font-semibold text-gray-700 mb-2" data-key="customerServices.form.duration">
                              {t('customerServices.form.duration')}
                            </label>
                            <input
                              type="text"
                              id="duration"
                              name="duration"
                              required
                              value={formData.duration}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-transparent transition-all placeholder-gray-400"
                              placeholder={t('customerServices.form.duration_placeholder')}
                            />
                          </div>
                          <div>
                            <label htmlFor="contactMethod" className="block text-sm font-semibold text-gray-700 mb-2" data-key="customerServices.form.contactMethod">
                              {t('customerServices.form.contactMethod')}
                            </label>
                            <select
                              id="contactMethod"
                              name="contactMethod"
                              required
                              value={formData.contactMethod}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-transparent transition-all"
                            >
                              <option value="" data-key="customerServices.form.contactMethod.placeholder">{t('customerServices.form.contactMethod_placeholder')}</option>
                              {contactMethods.map(method => (
                                <option key={method} value={method}>{method}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">{t('customerServices.records.phoneCommunication')}</label>
                            <input
                              type="tel"
                              id="phone"
                              name="phone"
                              required
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-transparent transition-all placeholder-gray-400"
                              placeholder={t('customerServices.records.enterPhone')}
                            />
                          </div>

                          <div>
                            <label htmlFor="alternatePhone" className="block text-sm font-semibold text-gray-700 mb-2">{t('customerServices.records.alternatePhone')}</label>
                            <input
                              type="tel"
                              id="alternatePhone"
                              name="alternatePhone"
                              value={formData.alternatePhone || ''}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-transparent transition-all placeholder-gray-400"
                              placeholder={t('customerServices.records.alternatePhonePlaceholder')}
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="symptoms" className="block text-sm font-semibold text-gray-700 mb-2" data-key="customerServices.form.symptoms">
                            {t('customerServices.form.symptoms')}
                          </label>
                          <textarea
                            id="symptoms"
                            name="symptoms"
                            required
                            rows={4}
                            value={formData.symptoms}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-transparent transition-all placeholder-gray-400"
                            placeholder={t('customerServices.form.symptoms_placeholder')}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="previousTreatment" className="block text-sm font-semibold text-gray-700 mb-2" data-key="customerServices.form.previousTreatment">
                              {t('customerServices.form.previousTreatment')}
                            </label>
                            <textarea
                              id="previousTreatment"
                              name="previousTreatment"
                              rows={3}
                              value={formData.previousTreatment}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-transparent transition-all placeholder-gray-400"
                              placeholder={t('customerServices.form.previousTreatment_placeholder')}
                            />
                          </div>
                          <div>
                            <label htmlFor="medications" className="block text-sm font-semibold text-gray-700 mb-2" data-key="customerServices.form.medications">
                              {t('customerServices.form.medications')}
                            </label>
                            <textarea
                              id="medications"
                              name="medications"
                              rows={3}
                              value={formData.medications}
                              onChange={handleInputChange}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-transparent transition-all placeholder-gray-400"
                              placeholder={t('customerServices.form.medications_placeholder')}
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="additionalInfo" className="block text-sm font-semibold text-gray-700 mb-2" data-key="customerServices.form.additionalInfo">
                            {t('customerServices.form.additionalInfo')}
                          </label>
                          <textarea
                            id="additionalInfo"
                            name="additionalInfo"
                            rows={3}
                            value={formData.additionalInfo}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)] focus:border-transparent transition-all placeholder-gray-400"
                            placeholder={t('customerServices.form.additionalInfo_placeholder')}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                      <h3 className="text-lg font-bold text-blue-800 mb-3" data-key="customerServices.info.title">{t('customerServices.info.title')}</h3>
                      <ul className="text-sm text-[var(--color-vet-primary)] space-y-2 list-none">
                        <li className="flex items-start gap-2" data-key="customerServices.info.item1">
                          <span className="text-[var(--color-vet-primary)]">•</span> {t('customerServices.info.item1')}
                        </li>
                        <li className="flex items-start gap-2" data-key="customerServices.info.item2">
                          <span className="text-[var(--color-vet-primary)]">•</span> {t('customerServices.info.item2')}
                        </li>
                        <li className="flex items-start gap-2" data-key="customerServices.info.item3">
                          <span className="text-[var(--color-vet-primary)]">•</span> {t('customerServices.info.item3')}
                        </li>
                        <li className="flex items-start gap-2" data-key="customerServices.info.item4">
                          <span className="text-[var(--color-vet-primary)]">•</span> {t('customerServices.info.item4')}
                        </li>
                      </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto bg-[var(--color-vet-secondary)] text-white px-10 py-4 rounded-xl font-bold hover:bg-[var(--color-vet-secondary)] focus:outline-none focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-200 flex items-center justify-center"
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('customerServices.buttons.submitting')}
                          </>
                        ) : editingFormId ? t('customerServices.records.updateConfirmForm') : t('customerServices.buttons.submit')}
                      </button>
                      {editingFormId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFormId(null)
                            setFormData({
                              petType: '', petName: '', age: '', gender: '', symptoms: '', duration: '',
                              previousTreatment: '', medications: '', contactMethod: '', phone: '', alternatePhone: '', additionalInfo: ''
                            })
                          }}
                          className="w-full sm:w-auto bg-gray-500 text-white px-10 py-4 rounded-xl font-bold hover:bg-gray-600 transition-all shadow-lg"
                        >
                          {t('customerServices.records.cancelEdit')}
                        </button>
                      )}
                    </div>
                  </form>


                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
