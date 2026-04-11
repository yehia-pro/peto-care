import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, User, X, AlertCircle, MessageCircle, Send, CreditCard, Star } from 'lucide-react';
import { PaymentModal } from '../components/Payment/PaymentModal';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { appointmentsAPI, vetsAPI, formsAPI } from '../services/api';
import { toast } from 'sonner';

interface Vet {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  rating: number;
  consultationFee: number;
  discountedFee?: number;
  discountExpiresAt?: string;
  availability: any[];
}

interface Appointment {
  _id: string;
  vetId: string;
  userId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
  vetName: string;
  userName: string;
}

const Appointments = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [vets, setVets] = useState<Vet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVet, setSelectedVet] = useState<Vet | null>(null);
  const [savedForms, setSavedForms] = useState<any[]>([]);
  const [selectedForm, setSelectedForm] = useState<any | null>(null);
  const [notes, setNotes] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'book' | 'my-appointments'>('book');
  const [selectedAppointmentForChat, setSelectedAppointmentForChat] = useState<Appointment | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ id: string, sender: 'user' | 'vet', text: string, time: string }>>([]);

  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMetadata, setPaymentMetadata] = useState<any>({});
  const [selectedAppointmentForPayment, setSelectedAppointmentForPayment] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchVets();
    if (user) {
      fetchAppointments();
      fetchForms();
    }
  }, [user]);

  const fetchForms = async () => {
    try {
      const response = await formsAPI.getForms();
      setSavedForms(response.data.forms || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
    }
  };

  const fetchVets = async () => {
    try {
      setError(null);
      const response = await vetsAPI.getVets({ isVerified: true });
      setVets(response.data.vets || []);
    } catch (error: any) {
      console.error('Error fetching vets:', error);
      setError(t('appointments.errors.fetchVets'));
    }
  };

  const fetchAppointments = async () => {
    try {
      setError(null);
      const response = await appointmentsAPI.getAppointments();
      setAppointments(response.data.appointments || []);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      setError(t('appointments.errors.fetchAppointments'));
    }
  };

  const handlePay = (appointment: Appointment) => {
    const vet = vets.find(v => v.id === appointment.vetId);
    let fee = 50;
    if (vet) {
      if (vet.discountedFee && (!vet.discountExpiresAt || new Date(vet.discountExpiresAt) > new Date())) {
        fee = vet.discountedFee;
      } else {
        fee = vet.consultationFee;
      }
    }

    setPaymentAmount(fee);
    setPaymentMetadata({ appointmentId: appointment._id, type: 'consultation' });
    setSelectedAppointmentForPayment(appointment);
    setShowPaymentModal(true);
  };

  const onPaymentSuccess = () => {
    fetchAppointments();
  };

  const getAvailableTimes = (vet: Vet, date: Date) => {
    const dayOfWeek = date.getDay();
    const availability = vet.availability.find((avail: any) => avail.day === dayOfWeek);

    if (!availability) return [];

    const times: string[] = [];
    const startHour = parseInt(availability.startTime.split(':')[0]);
    const endHour = parseInt(availability.endTime.split(':')[0]);

    for (let hour = startHour; hour < endHour; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`);
      times.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    return times;
  };

  const handleBookAppointment = async () => {
    if (!selectedVet || !selectedForm) {
      toast.error('الرجاء اختيار العيادة والاستمارة');
      return;
    }

    setLoading(true);
    try {
      const scheduledAt = new Date(Date.now() + 86400000).toISOString(); // Dummy date for tomorrow
      const formDetails = `بيانات الاستمارة:\nالنوع: ${selectedForm.petType || '-'}\nالاسم: ${selectedForm.petName || '-'}\nالعمر: ${selectedForm.age || '-'}\nالجنس: ${selectedForm.gender || '-'}\nالأعراض: ${selectedForm.symptoms || '-'}\nتاريخ البداية: ${selectedForm.duration || '-'}\nالشدة: ${selectedForm.severity || '-'}\nعلاجات سابقة: ${selectedForm.previousTreatment || '-'}\nأدوية: ${selectedForm.medications || '-'}\nالاستعجال: ${selectedForm.urgency || '-'}\nالتواصل: ${selectedForm.contactMethod || '-'}\nإضافي: ${selectedForm.additionalInfo || '-'}`;
      const finalNotes = notes ? `${formDetails}\n\nملاحظات إضافية: ${notes}` : formDetails;
      
      const appointmentData = { vetId: selectedVet.id, scheduledAt, reason: 'استشارة', notes: finalNotes };
      await appointmentsAPI.createAppointment(appointmentData);
      toast.success(t('appointments.messages.bookSuccess'));
      setShowBookingModal(false);
      setSelectedForm(null);
      setNotes('');
      fetchAppointments();
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast.error(t('appointments.errors.bookFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (window.confirm(t('appointments.messages.cancelConfirm'))) {
      try {
        await appointmentsAPI.cancelAppointment(appointmentId);
        fetchAppointments();
        toast.success(t('appointments.messages.cancelSuccess'));
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        toast.error(t('appointments.errors.cancelFailed'));
      }
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return t('appointments.status.confirmed');
      case 'pending': return t('appointments.status.pending');
      case 'completed': return t('appointments.status.completed');
      case 'cancelled': return t('appointments.status.cancelled');
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US');
  };

  const formatTimeLocale = (time: string) => {
    if (i18n.language !== 'ar') return time;
    // Basic conversion for 24h to 12h Arabic if needed, or just return as is
    return time;
  };

  if (loading && !vets.length && !appointments.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-vet-primary)] mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('appointments.title')}</h1>
          <p className="text-gray-600">{t('appointments.subtitle')}</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className={`-mb-px flex ${i18n.language === 'ar' ? 'space-x-reverse space-x-8' : 'space-x-8'}`}>
              <button
                onClick={() => setActiveTab('book')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'book'
                  ? 'border-[var(--color-vet-primary)] text-[var(--color-vet-primary)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {t('appointments.book')}
              </button>
              <button
                onClick={() => setActiveTab('my-appointments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'my-appointments'
                  ? 'border-[var(--color-vet-primary)] text-[var(--color-vet-primary)]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {t('appointments.myAppointments', { count: appointments.length })}
              </button>
            </nav>
          </div>
        </div>

        {/* Book Appointment Tab */}
        {activeTab === 'book' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Vet Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('appointments.chooseVet')}</h2>
              {vets.length > 0 ? (
                <div className="space-y-4">
                  {vets.map((vet) => (
                    <div
                      key={vet.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedVet?.id === vet.id
                        ? 'border-[var(--color-vet-primary)] bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                      onClick={() => setSelectedVet(vet)}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`${i18n.language === 'ar' ? 'mr-1' : 'ml-1'}`}>
                          <h3 className="font-semibold text-gray-900">
                            {t('appointments.drName', { name: `${vet.firstName} ${vet.lastName}` })}
                          </h3>
                          <p className="text-sm text-gray-600">{vet.specialization}</p>
                          <div className="flex items-center mt-1">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < Math.floor(vet.rating) ? 'text-[var(--color-vet-accent)] fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                              <span className={`text-sm text-gray-600 ${i18n.language === 'ar' ? 'mr-1' : 'ml-1'}`}>({vet.rating})</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex flex-col items-end">
                            {vet.discountedFee && (!vet.discountExpiresAt || new Date(vet.discountExpiresAt) > new Date()) ? (
                              <>
                                <p className="text-lg font-bold text-red-600 font-mono">
                                  ${vet.discountedFee}
                                </p>
                                <p className="text-sm text-gray-400 line-through font-mono">
                                  ${vet.consultationFee}
                                </p>
                              </>
                            ) : (
                              <p className="text-lg font-bold text-[var(--color-vet-primary)] font-mono">
                                ${vet.consultationFee}
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{t('appointments.consultationFee')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">{t('appointments.noVetsAvailable')}</p>
                </div>
              )}
            </div>

            {/* Form Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">تفاصيل الطلب والاستمارة</h2>

              {!user ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-6">{t('appointments.pleaseLoginToBook')}</p>
                  <button onClick={() => navigate('/login')} className="inline-block bg-[var(--color-vet-primary)] text-white px-8 py-3 rounded-xl hover:bg-[var(--color-vet-primary)] transition-all shadow-lg shadow-blue-500/30 font-medium">
                    {t('auth.login')}
                  </button>
                </div>
              ) : selectedVet ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      اختر الاستمارة الطبية المحفوظة
                    </label>
                    {savedForms.length > 0 ? (
                      <select
                        value={selectedForm?._id || ''}
                        onChange={(e) => setSelectedForm(savedForms.find(f => f._id === e.target.value) || null)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)]"
                      >
                        <option value="">-- يرجى الاختيار --</option>
                        {savedForms.map(form => (
                          <option key={form._id} value={form._id}>
                            {form.petName} ({form.petType}) - {new Date(form.createdAt).toLocaleDateString('ar-EG')}
                          </option>
                        ))}
                      </select>
                    ) : (
                       <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm mb-4">
                        لا يوجد لديك استمارات محفوظة. قم بتعبئة استمارة جديدة من صفحة جميع الخدمات.
                        <button 
                          onClick={() => navigate('/services')} 
                          className="block mt-2 text-[var(--color-vet-primary)] underline font-bold"
                        >
                          تعبئة استمارة الآن
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('appointments.notes')}
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-vet-primary)] resize-none"
                      placeholder={t('appointments.notesPlaceholder')}
                    />
                  </div>

                  <button
                    onClick={() => setShowBookingModal(true)}
                    disabled={!selectedForm || loading}
                    className="w-full bg-[var(--color-vet-primary)] text-white py-3 px-4 rounded-xl hover:bg-[var(--color-vet-primary)] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-bold shadow-lg shadow-blue-500/20"
                  >
                    {loading ? t('appointments.booking') : "إرسال الطلب"}
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">{t('appointments.chooseVetFirst')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Appointments Tab */}
        {activeTab === 'my-appointments' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('appointments.title')}</h2>

            {!user ? (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-6">{t('appointments.pleaseLoginToBook')}</p>
                <button onClick={() => navigate('/login')} className="bg-[var(--color-vet-primary)] text-white px-10 py-3 rounded-xl hover:bg-[var(--color-vet-primary)] transition-all font-bold shadow-xl shadow-blue-500/30">
                  {t('auth.login')}
                </button>
              </div>
            ) : appointments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map((appointment) => (
                  <div key={appointment._id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex flex-col h-full">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <User className="w-5 h-5 text-[var(--color-vet-primary)]" />
                          </div>
                          <div className={`${i18n.language === 'ar' ? 'mr-3' : 'ml-3'}`}>
                            <h3 className="font-bold text-gray-900">{appointment.vetName}</h3>
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <CalendarIcon className="w-3 h-3 mr-1" />
                              <span className="mr-3">{formatDate(appointment.date)}</span>
                              <Clock className="w-3 h-3 mr-1" />
                              <span>{formatTimeLocale(appointment.time)}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(appointment.status)}`}>
                          {getStatusLabel(appointment.status)}
                        </span>
                      </div>

                      {appointment.notes && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-4 flex-grow">
                          <p className="text-sm text-gray-600 line-clamp-2 italic">"{appointment.notes}"</p>
                        </div>
                      )}

                      <div className="flex items-center gap-3 pt-3 border-t">
                        {appointment.status === 'confirmed' && (
                          <button
                            onClick={() => setSelectedAppointmentForChat(appointment)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-[var(--color-vet-primary)] hover:bg-blue-200 rounded-lg text-sm font-bold transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            {t('appointments.chat')}
                          </button>
                        )}
                        {appointment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handlePay(appointment)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-vet-secondary)] text-white hover:bg-[var(--color-vet-secondary)] rounded-lg text-sm font-bold transition-all shadow-md shadow-green-500/20"
                            >
                              <CreditCard className="w-4 h-4" />
                              {t('appointments.pay')}
                            </button>
                            <button
                              onClick={() => handleCancelAppointment(appointment._id)}
                              className="flex-1 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors"
                            >
                              {t('common.cancel')}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-6">{t('appointments.noAppointmentsYet')}</p>
                <button
                  onClick={() => setActiveTab('book')}
                  className="bg-[var(--color-vet-primary)] text-white px-8 py-3 rounded-xl hover:bg-[var(--color-vet-primary)] transition-all font-bold shadow-xl shadow-blue-500/30"
                >
                  {t('appointments.bookFirst')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Chat Modal */}
        {selectedAppointmentForChat && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-[var(--color-vet-primary)] to-[var(--color-vet-primary)] text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">
                      {t('appointments.chatWith', { name: selectedAppointmentForChat.vetName })}
                    </h3>
                    <p className="text-xs text-white/80 font-mono">
                      {t('appointments.appointmentTime', {
                        date: formatDate(selectedAppointmentForChat.date),
                        time: formatTimeLocale(selectedAppointmentForChat.time)
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAppointmentForChat(null)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-10 h-10 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">{t('appointments.noMessagesYet')}</p>
                    <p className="text-sm text-gray-400 mt-1">{t('appointments.startChat')}</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${msg.sender === 'user'
                          ? 'bg-[var(--color-vet-primary)] text-white rounded-tr-none'
                          : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                          }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <p className={`text-[10px] mt-2 font-mono ${msg.sender === 'user' ? 'text-white/60 text-right' : 'text-gray-400'}`}>
                          {msg.time}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && chatMessage.trim()) {
                        const newMsg = {
                          id: Date.now().toString(),
                          sender: 'user' as const,
                          text: chatMessage,
                          time: new Date().toLocaleTimeString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
                        };
                        setChatMessages([...chatMessages, newMsg]);
                        setChatMessage('');
                        setTimeout(() => {
                          const vetMsg = {
                            id: (Date.now() + 1).toString(),
                            sender: 'vet' as const,
                            text: t('appointments.vetResponse'),
                            time: new Date().toLocaleTimeString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
                          };
                          setChatMessages(prev => [...prev, vetMsg]);
                        }, 1500);
                      }
                    }}
                    placeholder={t('appointments.chatPlaceholder')}
                    className={`flex-1 px-5 py-3 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-[var(--color-vet-primary)] transition-all ${i18n.language === 'ar' ? 'text-right' : ''}`}
                  />
                  <button
                    onClick={() => {
                      if (chatMessage.trim()) {
                        const newMsg = {
                          id: Date.now().toString(),
                          sender: 'user' as const,
                          text: chatMessage,
                          time: new Date().toLocaleTimeString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
                        };
                        setChatMessages([...chatMessages, newMsg]);
                        setChatMessage('');
                        setTimeout(() => {
                          const vetMsg = {
                            id: (Date.now() + 1).toString(),
                            sender: 'vet' as const,
                            text: t('appointments.vetResponse'),
                            time: new Date().toLocaleTimeString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })
                          };
                          setChatMessages(prev => [...prev, vetMsg]);
                        }, 1500);
                      }
                    }}
                    className="w-12 h-12 bg-[var(--color-vet-primary)] text-white rounded-2xl flex items-center justify-center hover:bg-[var(--color-vet-primary)] transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
                  >
                    <Send className={`w-5 h-5 ${i18n.language === 'ar' ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Confirmation Modal */}
        {showBookingModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">{t('appointments.confirmAppointment')}</h3>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-8 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">{t('appointments.vet')}:</span>
                  <span className="font-bold text-gray-900 text-right">{t('appointments.drName', { name: `${selectedVet?.firstName} ${selectedVet?.lastName}` })}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">الاستمارة:</span>
                  <span className="font-bold text-gray-900">{selectedForm?.petName} ({selectedForm?.petType})</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t">
                  <span className="text-gray-500 font-medium">{t('appointments.fee')}:</span>
                  <span className="text-lg font-bold text-[var(--color-vet-primary)] font-mono">
                    ${selectedVet && selectedVet.discountedFee && (!selectedVet.discountExpiresAt || new Date(selectedVet.discountExpiresAt) > new Date()) ? selectedVet.discountedFee : selectedVet?.consultationFee}
                  </span>
                </div>
                {notes && (
                  <div className="pt-2 border-t text-sm">
                    <span className="text-gray-500 font-medium block mb-1">{t('appointments.notes')}:</span>
                    <p className="text-gray-700 italic text-xs leading-relaxed">"{notes}"</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleBookAppointment}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-[var(--color-vet-primary)] text-white rounded-xl hover:bg-[var(--color-vet-primary)] disabled:bg-[var(--color-vet-primary)] transition-all font-bold shadow-lg shadow-blue-500/20"
                >
                  {loading ? t('common.loading') : t('appointments.confirm')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={paymentAmount}
          metadata={paymentMetadata}
          onSuccess={onPaymentSuccess}
          title={t('appointments.pay')}
        />
      </div>
    </div>
  );
};

export default Appointments;
